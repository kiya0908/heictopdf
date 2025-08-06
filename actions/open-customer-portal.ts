"use server";

// TODO: Stripe 功能暂时禁用，等确定支付方式后恢复
// 这个文件提供空实现以保持构建兼容性

export type responseAction = {
  status: "success" | "error";
  stripeUrl?: string;
};

export async function openCustomerPortal(
  userStripeId: string,
): Promise<responseAction> {
  // 暂时禁用 Stripe 客户门户功能
  console.log("Stripe customer portal is temporarily disabled");
  
  return {
    status: "error",
    stripeUrl: undefined,
  };
}

/* 
// 原 Stripe 实现 - 保留以便后续恢复
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";

const billingUrl = absoluteUrl("/app/billing");

export async function openCustomerPortal(
  userStripeId: string,
): Promise<responseAction> {
  let redirectUrl: string = "";

  try {
    const user = await currentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: billingUrl,
      });

      redirectUrl = stripeSession.url as string;
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session");
  }

  redirect(redirectUrl);
}
*/
