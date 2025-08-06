"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { openCustomerPortal } from "@/actions/open-customer-portal";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface CustomerPortalButtonProps {
  userStripeId: string;
}

export function CustomerPortalButton({
  userStripeId,
}: CustomerPortalButtonProps) {
  let [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      // 暂时禁用功能，显示提示
      toast.error("支付功能暂时不可用，请联系客服处理订阅问题。");
      
      // 如果后续需要恢复功能，可以取消注释下面的代码
      /*
      const result = await openCustomerPortal(userStripeId);
      if (result.status === 'error') {
        toast.error('打开客户门户失败，请稍后重试');
      }
      */
    });
  };

  return (
    <Button 
      disabled={isPending} 
      onClick={handleClick}
      variant="outline"
    >
      {isPending ? (
        <>
          <Icons.spinner className="mr-2 size-4 animate-spin" /> 加载中...
        </>
      ) : (
        "管理订阅（暂时不可用）"
      )}
    </Button>
  );
}

/*
// 原实现 - 保留以便后续恢复
export function CustomerPortalButton({
  userStripeId,
}: CustomerPortalButtonProps) {
  let [isPending, startTransition] = useTransition();
  const generateUserStripeSession = openCustomerPortal.bind(null, userStripeId);

  const stripeSessionAction = () =>
    startTransition(async () => await generateUserStripeSession());

  return (
    <Button disabled={isPending} onClick={stripeSessionAction}>
      {isPending ? (
        <>
          <Icons.spinner className="mr-2 size-4 animate-spin" /> Loading...
        </>
      ) : (
        "Open Customer Portal"
      )}
    </Button>
  );
}
*/
