import { NextResponse, type NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";

// PayPal API base URLs
const PAYPAL_API_BASE = process.env.PAYPAL_ENVIRONMENT === "production" 
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const CreateSubscriptionSchema = z.object({
  planId: z.string(),
  customId: z.string(), // User ID
});

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create PayPal subscription
async function createPayPalSubscription(planId: string, customId: string) {
  const accessToken = await getPayPalAccessToken();

  const subscriptionData = {
    plan_id: planId,
    custom_id: customId, // User ID for webhook identification
    application_context: {
      brand_name: "HEIC to PDF Converter",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=false`,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("PayPal subscription creation failed:", errorData);
    throw new Error(`Failed to create PayPal subscription: ${response.statusText}`);
  }

  return await response.json();
}

// Get subscription details
async function getPayPalSubscription(subscriptionId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get PayPal subscription: ${response.statusText}`);
  }

  return await response.json();
}

// Cancel subscription
async function cancelPayPalSubscription(subscriptionId: string, reason: string = "User requested cancellation") {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({
      reason: reason,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel PayPal subscription: ${response.statusText}`);
  }

  return response.status === 204; // PayPal returns 204 for successful cancellation
}

// POST: Create new subscription
export async function POST(req: NextRequest) {
  // TODO: 临时禁用PayPal订阅功能 - 需要商业账户
  // 当获得PayPal商业账户后，删除下面的return语句即可恢复功能
  return NextResponse.json(
    { 
      error: "Payment feature is temporarily disabled", 
      message: "We are perfecting our payment system. Please stay tuned for updates.",
      code: "PAYMENT_DISABLED"
    }, 
    { status: 503 }
  );

  /* 
  // 原订阅创建代码 - 保留以便后续恢复
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  */

    const body = await req.json();
    const { planId, customId } = CreateSubscriptionSchema.parse(body);

    // Verify that customId matches the authenticated user
    if (customId !== userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    // Create PayPal subscription
    const subscription = await createPayPalSubscription(planId, customId);

    // Store subscription info in database
    await prisma.userPaymentInfo.upsert({
      where: { userId },
      update: {
        paypalSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status?.toLowerCase() || "pending",
        subscriptionPlanId: planId,
        subscriptionProvider: "paypal",
        updatedAt: new Date(),
      },
      create: {
        userId,
        paypalSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status?.toLowerCase() || "pending",
        subscriptionPlanId: planId,
        subscriptionProvider: "paypal",
        userInfo: {
          email: user.primaryEmailAddress?.emailAddress,
          fullName: user.fullName,
        },
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      approvalUrl: subscription.links?.find((link: any) => link.rel === "approve")?.href,
    });

  } catch (error) {
    console.error("PayPal subscription creation error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// GET: Get subscription details
export async function GET(req: NextRequest) {
  // TODO: 临时禁用PayPal订阅功能 - 需要商业账户
  // 当获得PayPal商业账户后，删除下面的return语句即可恢复功能
  return NextResponse.json(
    { 
      error: "Payment feature is temporarily disabled", 
      message: "We are perfecting our payment system. Please stay tuned for updates.",
      code: "PAYMENT_DISABLED"
    }, 
    { status: 503 }
  );

  /* 
  // 原订阅查询代码 - 保留以便后续恢复
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  */

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");

    if (!subscriptionId) {
      // Get user's current subscription from database
      const userPayment = await prisma.userPaymentInfo.findUnique({
        where: { userId },
      });

      if (!userPayment?.paypalSubscriptionId) {
        return NextResponse.json({ error: "No subscription found" }, { status: 404 });
      }

      const subscription = await getPayPalSubscription(userPayment.paypalSubscriptionId);
      return NextResponse.json(subscription);
    }

    // Get specific subscription
    const subscription = await getPayPalSubscription(subscriptionId);
    return NextResponse.json(subscription);

  } catch (error) {
    console.error("PayPal subscription fetch error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE: Cancel subscription
export async function DELETE(req: NextRequest) {
  // TODO: 临时禁用PayPal订阅功能 - 需要商业账户
  // 当获得PayPal商业账户后，删除下面的return语句即可恢复功能
  return NextResponse.json(
    { 
      error: "Payment feature is temporarily disabled", 
      message: "We are perfecting our payment system. Please stay tuned for updates.",
      code: "PAYMENT_DISABLED"
    }, 
    { status: 503 }
  );

  /* 
  // 原订阅取消代码 - 保留以便后续恢复
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  */

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const reason = searchParams.get("reason") || "User requested cancellation";

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    // Verify user owns this subscription
    const userPayment = await prisma.userPaymentInfo.findFirst({
      where: {
        userId,
        paypalSubscriptionId: subscriptionId,
      },
    });

    if (!userPayment) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Cancel with PayPal
    const cancelled = await cancelPayPalSubscription(subscriptionId, reason);

    if (cancelled) {
      // Update database
      await prisma.userPaymentInfo.update({
        where: { id: userPayment.id },
        data: {
          subscriptionStatus: "cancelled",
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ cancelled });

  } catch (error) {
    console.error("PayPal subscription cancellation error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}