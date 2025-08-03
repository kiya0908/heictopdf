"use client";

import { useTransition } from "react";

import { useAuth } from "@clerk/nextjs";

import { generateUserStripe } from "@/actions/generate-user-stripe";
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import type { ChargeProductSelectDto } from "@/db/type";
import { url } from "@/lib";
import { usePathname } from "@/lib/navigation";
import { SubscriptionPlan, UserSubscriptionPlan } from "@/types";

interface BillingFormButtonProps {
  offer: ChargeProductSelectDto;
  btnText?: string;
}

export function BillingFormButton({
  offer,
  btnText = "Buy Plan",
}: BillingFormButtonProps) {
  let [isPending, startTransition] = useTransition();
  const { getToken } = useAuth();
  const pathname = usePathname();

  // TODO: Replace with PayPal payment logic
  const stripeSessionAction = () =>
    startTransition(async () => {
      // Stripe payment logic temporarily disabled
      console.log("Payment button clicked - PayPal integration pending");
      // const data = await fetch(`/api/charge-order`, {
      //   method: "POST",
      //   body: JSON.stringify({
      //     amount: offer.amount,
      //     chanel: "Stripe",
      //     productId: offer.id,
      //     url: url(pathname).href,
      //     currency: offer.currency?.toUpperCase(),
      //   }),
      //   headers: { Authorization: `Bearer ${await getToken()}` },
      // }).then((res) => res.json());
      // window.location.href = data.url;
    });
  const userOffer = offer.amount > 0; // Pro tier has amount > 0
  return (
    <Button
      variant={userOffer ? "default" : "outline"}
      className="w-full"
      disabled={isPending}
      onClick={stripeSessionAction}
    >
      {isPending ? (
        <>
          <Icons.spinner className="mr-2 size-4 animate-spin" /> Loading...
        </>
      ) : (
        <>{btnText}</>
      )}
    </Button>
  );
}
