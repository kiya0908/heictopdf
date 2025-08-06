"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "@clerk/nextjs";

import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getErrorMessage } from "@/lib/handle-error";

interface PayPalButtonProps {
  planId: string;
  customId: string; // User ID
  btnText?: string;
  className?: string;
  disabled?: boolean;
}

export function PayPalButton({
  planId,
  customId,
  btnText = "Subscribe with PayPal",
  className,
  disabled = false,
}: PayPalButtonProps) {
  const [showPayPal, setShowPayPal] = useState(false);
  const { getToken } = useAuth();
  const { toast } = useToast();

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // TODO: 临时禁用PayPal支付功能 - 需要商业账户
  // 当获得PayPal商业账户后，删除下面的return语句即可恢复功能
  return (
    <Button disabled className={className}>
      {btnText}
    </Button>
  );

  /* 
  // 原PayPal功能代码 - 保留以便后续恢复
  if (!clientId) {
    console.error("PayPal Client ID not configured");
    return (
      <Button disabled className={className}>
        PayPal Not Configured
      </Button>
    );
  }
  */

  const handleSubscribeClick = () => {
    if (!showPayPal) {
      setShowPayPal(true);
    }
  };

  const createSubscription = async () => {
    try {
      const response = await fetch("/api/paypal-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          planId,
          customId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      return data.subscriptionId;
    } catch (error) {
      console.error("Subscription creation error:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      console.log("PayPal subscription approved:", data);
      
      toast({
        title: "Success!",
        description: "Your subscription has been activated. Welcome to Pro!",
      });

      // Redirect to dashboard or success page
      window.location.href = "/dashboard?subscription=success";
    } catch (error) {
      console.error("Subscription approval error:", error);
      toast({
        title: "Error",
        description: "There was an issue activating your subscription. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const onError = (error: any) => {
    console.error("PayPal error:", error);
    toast({
      title: "Payment Error",
      description: "There was an issue with PayPal. Please try again.",
      variant: "destructive",
    });
    setShowPayPal(false);
  };

  const onCancel = () => {
    console.log("PayPal payment cancelled");
    toast({
      title: "Payment Cancelled",
      description: "You can try again anytime.",
    });
    setShowPayPal(false);
  };

  if (!showPayPal) {
    return (
      <Button
        onClick={handleSubscribeClick}
        disabled={disabled}
        className={className}
      >
        {btnText}
      </Button>
    );
  }

  return (
    <div className="w-full">
      <PayPalScriptProvider
        options={{
          clientId: clientId || "",
          vault: true,
          intent: "subscription",
          currency: "USD",
        }}
      >
        <PayPalButtons
          style={{
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "subscribe",
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={onError}
          onCancel={onCancel}
        />
      </PayPalScriptProvider>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPayPal(false)}
        className="mt-2 w-full"
      >
        Cancel
      </Button>
    </div>
  );
}

export default PayPalButton;