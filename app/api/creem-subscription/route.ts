import { NextResponse, type NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";
import { creemClient, mapCreemStatusToSystem } from "@/lib/creem";

const CreateSubscriptionSchema = z.object({
  planId: z.string(),
  customId: z.string(), // User ID
  locale: z.string().optional(), // 语言代码，可选
});

const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  cancelAtPeriodEnd: z.boolean().default(true),
});

// POST: Create new Creem subscription
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, customId, locale } = CreateSubscriptionSchema.parse(body);

    // Verify that customId matches the authenticated user
    if (customId !== userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    // Check if user already has an active subscription
    const existingPayment = await prisma.userPaymentInfo.findUnique({
      where: { userId },
    });

    if (existingPayment?.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 409 }
      );
    }

    // 检查是否启用模拟模式（用于API权限问题期间）
    const isSimulationMode = process.env.CREEM_SIMULATION_MODE === 'true';
    
    if (isSimulationMode) {
      console.log('🎭 Creem模拟模式已启用 - API权限问题解决后请移除');
      
      // 动态生成返回URL
      const getReturnUrl = (isSuccess: boolean, locale?: string): string => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let pathSegment = '/app'; // 默认英文路径
        
        if (locale && locale !== 'en') {
          pathSegment = `/${locale}/app`;
        }
        
        const params = new URLSearchParams();
        params.set(isSuccess ? 'payment_success' : 'payment_failed', 'true');
        params.set('provider', 'creem');
        params.set('mode', 'simulation');
        
        return `${baseUrl}${pathSegment}?${params.toString()}`;
      };
      
      // 模拟订阅数据
      const mockSubscription = {
        id: `creem_mock_${Date.now()}`,
        status: 'active',
        checkout_url: getReturnUrl(true, locale),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
      };

      // 保存到数据库以便测试完整流程
      const customerEmail = user.primaryEmailAddress?.emailAddress || userId;
      
      await prisma.userPaymentInfo.upsert({
        where: { userId },
        update: {
          creemCustomerId: customerEmail,
          creemSubscriptionId: mockSubscription.id,
          subscriptionStatus: 'active',
          subscriptionPlanId: planId,
          subscriptionProvider: "creem",
          subscriptionExpiresAt: mockSubscription.currentPeriodEnd,
          updatedAt: new Date(),
        },
        create: {
          userId,
          creemCustomerId: customerEmail,
          creemSubscriptionId: mockSubscription.id,
          subscriptionStatus: 'active',
          subscriptionPlanId: planId,
          subscriptionProvider: "creem",
          subscriptionExpiresAt: mockSubscription.currentPeriodEnd,
          userInfo: {
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName,
          },
        },
      });

      return NextResponse.json({
        subscriptionId: mockSubscription.id,
        status: mockSubscription.status,
        checkout_url: mockSubscription.checkout_url,
        simulation: true,
        message: "模拟模式：API权限配置完成后将连接真实Creem支付"
      });
    }

    // 直接调用createSubscription，内部已包含重试逻辑
    const subscriptionResult = await creemClient.createSubscription({
      customerId: user.primaryEmailAddress?.emailAddress || userId,
      planId: planId,
      userId: userId,
      locale: locale, // 传递语言参数
    });

    if (!subscriptionResult.success || !subscriptionResult.data?.checkout_url) {
      console.error("❌ Creem订阅创建失败:", subscriptionResult.error);
      return NextResponse.json(
        { error: `订阅创建失败: ${subscriptionResult.error?.message || 'No checkout URL returned'}` },
        { status: 500 }
      );
    }

    const subscription = subscriptionResult.data;

    // Store subscription info in database
    const customerEmail = user.primaryEmailAddress?.emailAddress || userId;
    
    await prisma.userPaymentInfo.upsert({
      where: { userId },
      update: {
        creemCustomerId: customerEmail, // 使用邮箱作为客户ID
        creemSubscriptionId: subscription.id,
        subscriptionStatus: mapCreemStatusToSystem(subscription.status || 'pending'),
        subscriptionPlanId: planId,
        subscriptionProvider: "creem",
        subscriptionExpiresAt: subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天
        updatedAt: new Date(),
      },
      create: {
        userId,
        creemCustomerId: customerEmail,
        creemSubscriptionId: subscription.id,
        subscriptionStatus: mapCreemStatusToSystem(subscription.status || 'pending'),
        subscriptionPlanId: planId,
        subscriptionProvider: "creem",
        subscriptionExpiresAt: subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userInfo: {
          email: user.primaryEmailAddress?.emailAddress,
          fullName: user.fullName,
        },
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      checkout_url: subscription.checkout_url, // 修正：使用 snake_case
    });

  } catch (error) {
    console.error("Creem subscription creation error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// GET: Get subscription details
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      // Get user's current subscription from database
      const userPayment = await prisma.userPaymentInfo.findUnique({
        where: { userId },
      });

      if (!userPayment?.creemSubscriptionId) {
        return NextResponse.json({ error: "No subscription found" }, { status: 404 });
      }

      const subscriptionResult = await creemClient.getSubscription(userPayment.creemSubscriptionId);
      
      if (!subscriptionResult.success) {
        return NextResponse.json(
          { error: subscriptionResult.error?.message || "Failed to fetch subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json(subscriptionResult.data);
    }

    // Get specific subscription
    const subscriptionResult = await creemClient.getSubscription(subscriptionId);
    
    if (!subscriptionResult.success) {
      return NextResponse.json(
        { error: subscriptionResult.error?.message || "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptionResult.data);

  } catch (error) {
    console.error("Creem subscription fetch error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE: Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, cancelAtPeriodEnd } = CancelSubscriptionSchema.parse(body);

    // Verify user owns this subscription
    const userPayment = await prisma.userPaymentInfo.findFirst({
      where: {
        userId,
        creemSubscriptionId: subscriptionId,
      },
    });

    if (!userPayment) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Cancel with Creem
    const cancelResult = await creemClient.cancelSubscription(subscriptionId, cancelAtPeriodEnd);

    if (!cancelResult.success) {
      console.error("Failed to cancel Creem subscription:", cancelResult.error);
      return NextResponse.json(
        { error: cancelResult.error?.message || "Failed to cancel subscription" },
        { status: 500 }
      );
    }

    // Update database
    const newStatus = cancelAtPeriodEnd ? "active" : "cancelled"; // 如果是期末取消，状态暂时保持active
    
    await prisma.userPaymentInfo.update({
      where: { id: userPayment.id },
      data: {
        subscriptionStatus: newStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      cancelled: true,
      subscription: cancelResult.data 
    });

  } catch (error) {
    console.error("Creem subscription cancellation error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}