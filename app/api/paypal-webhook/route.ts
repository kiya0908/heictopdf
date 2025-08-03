import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";

// PayPal webhook event types we care about
const SUPPORTED_EVENTS = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED", 
  "BILLING.SUBSCRIPTION.EXPIRED",
  "PAYMENT.SALE.COMPLETED",
] as const;

type PayPalWebhookEvent = {
  id: string;
  event_type: typeof SUPPORTED_EVENTS[number];
  resource_type: string;
  summary: string;
  resource: {
    id: string;
    status?: string;
    plan_id?: string;
    custom_id?: string;
    subscriber?: {
      email_address?: string;
    };
    billing_info?: {
      next_billing_time?: string;
    };
  };
  create_time: string;
};

// Verify PayPal webhook signature
function verifyPayPalSignature(
  payload: string,
  headers: Headers,
  webhookId: string
): boolean {
  try {
    const authAlgo = headers.get("PAYPAL-AUTH-ALGO");
    const transmission = headers.get("PAYPAL-TRANSMISSION-ID");
    const certId = headers.get("PAYPAL-CERT-ID");
    const signature = headers.get("PAYPAL-TRANSMISSION-SIG");
    const timestamp = headers.get("PAYPAL-TRANSMISSION-TIME");

    if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
      console.error("Missing required PayPal headers");
      return false;
    }

    // TODO: Implement proper PayPal signature verification
    // This is a simplified version - in production, you need to:
    // 1. Get PayPal's public certificate using certId
    // 2. Verify the signature using the certificate
    // For now, we'll do basic validation
    
    return true; // Temporarily return true for development
  } catch (error) {
    console.error("PayPal signature verification failed:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    
    // Get PayPal webhook ID from environment
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error("PAYPAL_WEBHOOK_ID not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // Verify PayPal signature
    if (!verifyPayPalSignature(body, headersList, webhookId)) {
      console.error("PayPal webhook signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event: PayPalWebhookEvent = JSON.parse(body);
    console.log("PayPal webhook event:", event.event_type, event.id);

    // Only process supported events
    if (!SUPPORTED_EVENTS.includes(event.event_type)) {
      console.log(`Ignoring unsupported event: ${event.event_type}`);
      return NextResponse.json({ received: true });
    }

    await handleWebhookEvent(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(event: PayPalWebhookEvent) {
  const { event_type, resource } = event;
  const subscriptionId = resource.id;
  const customId = resource.custom_id; // This should be the user ID
  
  console.log(`Processing ${event_type} for subscription ${subscriptionId}`);

  switch (event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      await handleSubscriptionActivated(subscriptionId, customId, resource);
      break;
      
    case "BILLING.SUBSCRIPTION.CANCELLED":
      await handleSubscriptionCancelled(subscriptionId, customId);
      break;
      
    case "BILLING.SUBSCRIPTION.EXPIRED":
      await handleSubscriptionExpired(subscriptionId, customId);
      break;
      
    case "PAYMENT.SALE.COMPLETED":
      await handlePaymentCompleted(subscriptionId, customId, resource);
      break;
      
    default:
      console.log(`Unhandled event type: ${event_type}`);
  }
}

async function handleSubscriptionActivated(
  subscriptionId: string,
  customId: string | undefined,
  resource: PayPalWebhookEvent["resource"]
) {
  if (!customId) {
    console.error("No customId (userId) found in subscription activation");
    return;
  }

  try {
    // Update or create user payment info
    await prisma.userPaymentInfo.upsert({
      where: { userId: customId },
      update: {
        paypalSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        subscriptionPlanId: resource.plan_id,
        subscriptionProvider: "paypal",
        updatedAt: new Date(),
      },
      create: {
        userId: customId,
        paypalSubscriptionId: subscriptionId,
        subscriptionStatus: "active", 
        subscriptionPlanId: resource.plan_id,
        subscriptionProvider: "paypal",
        userInfo: {
          email: resource.subscriber?.email_address,
        },
      },
    });

    console.log(`Subscription activated for user ${customId}`);
  } catch (error) {
    console.error("Error handling subscription activation:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(
  subscriptionId: string,
  customId: string | undefined
) {
  if (!customId) {
    console.error("No customId (userId) found in subscription cancellation");
    return;
  }

  try {
    await prisma.userPaymentInfo.updateMany({
      where: {
        userId: customId,
        paypalSubscriptionId: subscriptionId,
      },
      data: {
        subscriptionStatus: "cancelled",
        updatedAt: new Date(),
      },
    });

    console.log(`Subscription cancelled for user ${customId}`);
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
    throw error;
  }
}

async function handleSubscriptionExpired(
  subscriptionId: string,
  customId: string | undefined
) {
  if (!customId) {
    console.error("No customId (userId) found in subscription expiration");
    return;
  }

  try {
    await prisma.userPaymentInfo.updateMany({
      where: {
        userId: customId,
        paypalSubscriptionId: subscriptionId,
      },
      data: {
        subscriptionStatus: "expired",
        updatedAt: new Date(),
      },
    });

    console.log(`Subscription expired for user ${customId}`);
  } catch (error) {
    console.error("Error handling subscription expiration:", error);
    throw error;
  }
}

async function handlePaymentCompleted(
  subscriptionId: string,
  customId: string | undefined,
  resource: PayPalWebhookEvent["resource"]
) {
  if (!customId) {
    console.error("No customId (userId) found in payment completion");
    return;
  }

  try {
    // Update subscription status and next billing time if available
    const updateData: any = {
      subscriptionStatus: "active",
      updatedAt: new Date(),
    };

    if (resource.billing_info?.next_billing_time) {
      updateData.subscriptionExpiresAt = new Date(resource.billing_info.next_billing_time);
    }

    await prisma.userPaymentInfo.updateMany({
      where: {
        userId: customId,
        paypalSubscriptionId: subscriptionId,
      },
      data: updateData,
    });

    console.log(`Payment completed for user ${customId}`);
  } catch (error) {
    console.error("Error handling payment completion:", error);
    throw error;
  }
}

export async function GET() {
  return NextResponse.json({ status: "PayPal webhook endpoint active" });
}