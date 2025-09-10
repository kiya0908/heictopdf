/**
 * 用户订阅状态API - 统一多支付方式查询接口
 * 
 * 创建时间: 2025-09-07
 * 最近更新: 2025-09-07 - 初始创建，支持Creem/PayPal/Stripe多支付方式订阅状态查询
 * 
 * 功能说明:
 * - 统一的用户订阅状态查询接口，替代原有的单一PayPal接口
 * - 支持多种支付提供商: Creem, PayPal, Stripe (可扩展)
 * - 返回标准化的订阅状态数据格式
 * - 解决了/app页面订阅状态显示问题（从硬编码"Payment System Updating"改为真实状态）
 * 
 * API响应格式:
 * - status: 订阅状态 ("FREE", "ACTIVE", "EXPIRED", etc.)
 * - provider: 支付提供商 ("creem", "paypal", "stripe", etc.)
 * - planType: 计划类型 ("monthly", "yearly")
 * - subscriptionId: 订阅ID
 * - isActive: 是否激活
 * - isPro: 是否Pro用户
 */

import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/db/prisma";

// 强制动态渲染
export const dynamic = 'force-dynamic';

/**
 * 获取用户订阅状态的统一API接口
 * 支持Creem、PayPal、Stripe等多种支付方式的订阅状态查询
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 查询用户的支付信息
    const userPaymentInfo = await prisma.userPaymentInfo.findUnique({
      where: { userId: user.id },
    });

    // 如果没有找到支付信息，返回免费用户状态
    if (!userPaymentInfo) {
      return NextResponse.json({
        status: "FREE" as string,
        provider: null as string | null,
        planType: null as string | null,
        subscriptionId: null as string | null,
        expiresAt: null as Date | null,
        isActive: false,
        isPro: false
      });
    }

    let subscriptionData: {
      status: string;
      provider: string | null;
      planType: string | null;
      subscriptionId: string | null;
      expiresAt: Date | null;
      isActive: boolean;
      isPro: boolean;
      userInfo?: any;
    } = {
      status: "FREE",
      provider: userPaymentInfo.subscriptionProvider || null,
      planType: null,
      subscriptionId: null,
      expiresAt: userPaymentInfo.subscriptionExpiresAt,
      isActive: false,
      isPro: false,
      userInfo: userPaymentInfo.userInfo
    };

    // 检查Creem订阅状态
    if (userPaymentInfo.creemSubscriptionId && userPaymentInfo.subscriptionProvider === "creem") {
      const isActive = userPaymentInfo.subscriptionStatus === "active";
      
      // 根据订阅计划ID确定计划类型
      let planType = "monthly"; // 默认
      if (userPaymentInfo.subscriptionPlanId) {
        const CREEM_YEARLY_PRODUCT_ID = process.env.CREEM_YEARLY_PRODUCT_ID;
        planType = userPaymentInfo.subscriptionPlanId === CREEM_YEARLY_PRODUCT_ID ? "yearly" : "monthly";
      }

      subscriptionData = {
        ...subscriptionData,
        status: isActive ? "ACTIVE" : userPaymentInfo.subscriptionStatus?.toUpperCase() || "INACTIVE",
        provider: "creem",
        planType,
        subscriptionId: userPaymentInfo.creemSubscriptionId,
        isActive,
        isPro: isActive,
        // Creem订阅通常不设置过期时间，或者设置为null表示持续订阅
        expiresAt: userPaymentInfo.subscriptionExpiresAt
      };
    }
    
    // 检查PayPal订阅状态 (如果有的话)
    else if (userPaymentInfo.paypalSubscriptionId) {
      const isActive = userPaymentInfo.subscriptionStatus === "active" && 
                      (!userPaymentInfo.subscriptionExpiresAt || userPaymentInfo.subscriptionExpiresAt > new Date());

      subscriptionData = {
        ...subscriptionData,
        status: isActive ? "ACTIVE" : "EXPIRED",
        provider: "paypal",
        planType: userPaymentInfo.subscriptionPlanId?.includes("YEARLY") ? "yearly" : "monthly",
        subscriptionId: userPaymentInfo.paypalSubscriptionId,
        isActive,
        isPro: isActive
      };
    }
    
    // 检查Stripe订阅状态 (如果有的话)
    else if (userPaymentInfo.stripeSubscriptionId) {
      const isActive = userPaymentInfo.subscriptionStatus === "active" && 
                      (!userPaymentInfo.stripeCurrentPeriodEnd || userPaymentInfo.stripeCurrentPeriodEnd > new Date());

      subscriptionData = {
        ...subscriptionData,
        status: isActive ? "ACTIVE" : "EXPIRED",
        provider: "stripe",
        planType: "monthly", // 可以根据stripePriceId来判断
        subscriptionId: userPaymentInfo.stripeSubscriptionId,
        expiresAt: userPaymentInfo.stripeCurrentPeriodEnd,
        isActive,
        isPro: isActive
      };
    }

    return NextResponse.json(subscriptionData);

  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}