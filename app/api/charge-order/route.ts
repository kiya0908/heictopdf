import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

import { ChargeOrderHashids } from "@/db/dto/charge-order.dto";
import { ChargeProductHashids } from "@/db/dto/charge-product.dto";
import { prisma } from "@/db/prisma";
import { OrderPhase } from "@/db/type";
import { getErrorMessage } from "@/lib/handle-error";
// import { redis } from "@/lib/redis";
// import { stripe } from "@/lib/stripe"; // Removed for PayPal migration
import { absoluteUrl } from "@/lib/utils";

const CreateChargeOrderSchema = z.object({
  currency: z.enum(["CNY", "USD"]).default("USD"),
  productId: z.string(),
  amount: z.number().min(0).max(1000000000), // Allow 0 for free tier
  channel: z.enum(["GiftCode", "PayPal"]).default("PayPal"), // Changed from Stripe to PayPal
  url: z.string().optional(),
});

// Rate limiting removed for simplicity

export async function POST(req: NextRequest) {
  const { userId } = auth();

  const user = await currentUser();
  if (!userId || !user || !user.primaryEmailAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limiting removed for simplicity

  try {
    const data = await req.json();
    const { currency, amount, channel, productId, url } =
      CreateChargeOrderSchema.parse(data);
    if (channel !== "PayPal" && channel !== "GiftCode") {
      return NextResponse.json(
        { error: "Not Support Channel" },
        { status: 400 },
      );
    }
    const [chargeProductId] = ChargeProductHashids.decode(productId);
    const product = await prisma.chargeProduct.findFirst({
      where: {
        id: chargeProductId as number,
      },
    });
    if (!product) {
      return NextResponse.json(
        { error: "product not exists" },
        { status: 404 },
      );
    }
    const newChargeOrder = await prisma.chargeOrder.create({
      data: {
        userId: user.id,
        userInfo: {
          fullName: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
        },
        currency,
        amount,
        channel,
        phase: OrderPhase.Pending,
      },
    });

    const orderId = ChargeOrderHashids.encode(newChargeOrder.id);
    const billingUrl = absoluteUrl(`/pricing?orderId=${orderId}`);
    const nextUrl = url?.includes("?")
      ? `${url}&orderId=${orderId}`
      : `${url}?orderId=${orderId}`;
    // TODO: Implement PayPal payment logic
    if (channel === "PayPal") {
      // PayPal integration will be implemented in T-10
      return NextResponse.json(
        { error: "PayPal integration pending" },
        { status: 501 },
      );
    }
    return NextResponse.json({
      orderId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
