"use client";

import { useEffect, useMemo, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSearchParams } from "next/navigation";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useReward } from "react-rewards";

import PayPalButton from "@/components/features/paypal/PayPalButton";
import { HeaderSection } from "@/components/shared/header-section";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import SignBox from "@/components/sign-box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChargeProductSelectDto } from "@/db/type";
import { useMediaQuery } from "@/hooks/use-media-query";
import { url } from "@/lib";
import { usePathname } from "@/lib/navigation";
import { cn, formatPrice } from "@/lib/utils";

interface PricingCardsProps {
  userId?: string;
  locale?: string;
  chargeProduct?: ChargeProductSelectDto[];
}

const PricingCard = ({
  userId,
  offer,
  isYearly = false,
}: {
  userId?: string;
  offer: ChargeProductSelectDto;
  isYearly?: boolean;
}) => {
  const pathname = usePathname();
  const t = useTranslations("PricingPage");

  // Parse features from JSON string
  const features = offer.features ? JSON.parse(offer.features as string) : [];
  const isProTier = offer.amount > 0;
  const isFree = offer.amount === 0;

  // Calculate pricing based on billing period with localized display
  const getPrice = () => {
    if (isFree) return formatPrice(0, offer.currency === 'CNY' ? '¥' : '$');
    
    if (isYearly) {
      // Display localized prices but payment will be in USD
      const yearlyPrice = offer.currency === 'CNY' ? 4900 * 10 : 6900; // ¥490 or $69 yearly
      return formatPrice(yearlyPrice, offer.currency === 'CNY' ? '¥' : '$');
    }
    
    // Display localized prices: ¥49 for CN, $7 for others
    const monthlyPrice = offer.currency === 'CNY' ? 4900 : 700; // ¥49 or $7 monthly
    return formatPrice(monthlyPrice, offer.currency === 'CNY' ? '¥' : '$');
  };

  const getPeriod = () => {
    if (isFree) return t("plans.free.period");
    return isYearly ? "/year" : "/month";
  };

  const getOriginalPrice = () => {
    if (!isYearly || isFree) return null;
    // Show original price for yearly discount calculation
    const originalPrice = offer.currency === 'CNY' ? 4900 * 12 : 700 * 12; // ¥588 or $84
    return formatPrice(originalPrice, offer.currency === 'CNY' ? '¥' : '$');
  };

  const getCTA = () => {
    if (isFree) return t("plans.free.cta");
    // TODO: 临时使用支付暂停的翻译键，恢复PayPal后改回 t("plans.pro.cta")
    return t("paymentDisabled.cta");
  };

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border shadow-sm",
        isProTier ? "-m-0.5 border-2 border-purple-400" : "",
      )}
      key={offer.name}
    >
      {/* Popular Badge */}
      {isProTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-xs font-semibold text-white">
            {t("plans.pro.badge")}
          </span>
        </div>
      )}

      <div className="min-h-[150px] items-start space-y-4 bg-muted/50 p-6">
        <p className="flex font-urban text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {offer.name}
        </p>

        <div className="flex flex-row">
          <div className="flex items-end">
            <div className="flex text-left text-3xl font-semibold leading-6">
              {getOriginalPrice() && (
                <span className="mr-2 text-base text-muted-foreground/80 line-through">
                  {getOriginalPrice()}
                </span>
              )}
              <span>{getPrice()}</span>
            </div>
            <div className="-mb-1 ml-2 text-left text-sm font-medium text-muted-foreground">
              <div>{getPeriod()}</div>
              {isYearly && isProTier && (
                <div className="text-xs text-green-600">
                  {offer.currency === 'CNY' ? '约¥40.8/月' : '~$5.75/month'}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-left text-sm text-muted-foreground">
          <div>{offer.description}</div>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-16 p-6">
        <ul className="space-y-2 text-left text-sm font-medium leading-normal">
          {features.map((feature: string) => (
            <li className="flex items-start gap-x-3" key={feature}>
              <Icons.check className="size-5 shrink-0 text-purple-500" />
              <p>{feature}</p>
            </li>
          ))}
          
          {/* Show limitations for free tier */}
          {isFree && (
            <>
              {Array.isArray(t("plans.free.limitations")) && (t("plans.free.limitations") as string[]).map((limitation: string) => (
                <li
                  className="flex items-start text-muted-foreground"
                  key={limitation}
                >
                  <Icons.close className="mr-3 size-5 shrink-0" />
                  <p>{limitation}</p>
                </li>
              ))}
            </>
          )}
        </ul>
        
        <SignedIn>
          {isProTier && (
            // TODO: 临时禁用PayPal按钮，显示支付暂停提示
            // 恢复PayPal后取消注释下面的PayPalButton组件
            /*
            <PayPalButton 
              planId={isYearly ? 
                process.env.NEXT_PUBLIC_PAYPAL_PRO_YEARLY_USD_PLAN_ID || "" : 
                process.env.NEXT_PUBLIC_PAYPAL_PRO_MONTHLY_USD_PLAN_ID || ""
              }
              customId={userId || ""}
              btnText={getCTA()}
            />
            */
            <div className="text-center space-y-2">
              <Button disabled className="w-full">
                {getCTA()}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("paymentDisabled.description")}
              </p>
            </div>
          )}
          {isFree && (
            <Button variant="outline" className="w-full">
              {getCTA()}
            </Button>
          )}
        </SignedIn>

        <SignedOut>
          <div className="flex justify-center">
            <SignInButton mode="modal" forceRedirectUrl={url(pathname).href}>
              <Button
                variant={isProTier ? "default" : "outline"}
                className="w-full"
              >
                {getCTA()}
              </Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export function FreeCard() {
  const t = useTranslations("PricingPage");

  return (
    <div
      className={cn(
        "relative col-span-3 flex flex-col overflow-hidden rounded-3xl border shadow-sm lg:col-span-3",
      )}
    >
      <div className="min-h-[150px] items-start space-y-4 bg-muted/50 p-6">
        <p className="flex font-urban text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t("plans.free.title")}
        </p>

        <div className="flex flex-row">
          <div className="flex items-end">
            <div className="flex text-left text-3xl font-semibold leading-6">
              {`${formatPrice(0, "$")}`}
            </div>
            <div className="-mb-1 ml-2 text-left text-sm font-medium text-muted-foreground">
              <div>10 {t("worth")}</div>
            </div>
          </div>
        </div>
        <div className="text-left text-sm text-muted-foreground">
          <div>{t("plans.free.valueProposition")}</div>
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-16 p-6">
        <ul className="space-y-2 text-left text-sm font-medium leading-normal">
          {Array.isArray(t("plans.free.features")) && (t("plans.free.features") as string[]).map((feature: string) => (
            <li className="flex items-start gap-x-3" key={feature}>
              <Icons.check className="size-5 shrink-0 text-purple-500" />
              <p>{feature}</p>
            </li>
          ))}

          {Array.isArray(t("plans.free.limitations")) && (t("plans.free.limitations") as string[]).map((limitation: string) => (
            <li
              className="flex items-start text-muted-foreground"
              key={limitation}
            >
              <Icons.close className="mr-3 size-5 shrink-0" />
              <p>{limitation}</p>
            </li>
          ))}
        </ul>
        <SignBox>
          <Button>{t("plans.free.cta")}</Button>
        </SignBox>
      </div>
    </div>
  );
}
export function PricingCards({
  chargeProduct,
}: PricingCardsProps) {
  const t = useTranslations("PricingPage");
  const [isYearly, setIsYearly] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useUser();

  const { reward } = useReward("order-success", "confetti", {
    position: "fixed",
    elementCount: 360,
    spread: 80,
    elementSize: 8,
    lifetime: 400,
  });

  useEffect(() => {
    if (!searchParams.size) {
      return;
    }
    if (searchParams.get("success") === "true") {
      setTimeout(() => {
        reward();
      }, 1000);
    } else if (searchParams.get("success") === "false") {
      console.log("支付失败");
    }
  }, [searchParams]);

  return (
    <MaxWidthWrapper>
      <section className="flex flex-col items-center text-center">
        <HeaderSection label={t("label")} title={t("title")} />
        <div className="mb-4 mt-10 flex items-center gap-5">
          <ToggleGroup
            type="single"
            size="sm"
            defaultValue={isYearly ? "yearly" : "monthly"}
            onValueChange={(value) => setIsYearly(value === "yearly")}
            aria-label="toggle-billing"
            className="h-9 overflow-hidden rounded-full border bg-background p-1 *:h-7 *:text-muted-foreground"
          >
            <ToggleGroupItem
              value="monthly"
              className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              aria-label="Toggle monthly billing"
            >
              {t("billing.monthly")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="yearly"
              className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              aria-label="Toggle yearly billing"
            >
              {t("billing.yearly")} ({t("billing.save")})
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {/* <div className="mb-4 mt-10 flex items-center gap-5">
          <ToggleGroup
            type="single"
            size="sm"
            defaultValue={isYearly ? "yearly" : "monthly"}
            onValueChange={toggleBilling}
            aria-label="toggle-year"
            className="h-9 overflow-hidden rounded-full border bg-background p-1 *:h-7 *:text-muted-foreground"
          >
            <ToggleGroupItem
              value="yearly"
              className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              aria-label="Toggle yearly billing"
            >
              Yearly (-20%)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="monthly"
              className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              aria-label="Toggle monthly billing"
            >
              Monthly
            </ToggleGroupItem>
          </ToggleGroup>
        </div> */}

        <div className="grid gap-5 bg-inherit py-5 md:grid-cols-2">
          {chargeProduct?.map((offer) => (
            <PricingCard 
              offer={offer} 
              key={offer.id} 
              isYearly={isYearly}
              userId={user?.id}
            />
          ))}
        </div>

        <p className="mt-3 text-balance text-center text-base text-muted-foreground">
          {t("contact.title")}
          <br />
          <a
            className="font-medium text-primary hover:underline"
            href="mailto:support@heictopdf.com"
          >
            support@heictopdf.com
          </a>{" "}
          {t("contact.description")}
          <br />
        </p>
      </section>
      <div
        className="pointer-events-none fixed bottom-10 left-[50%] translate-x-[-50%]"
        id="order-success"
      />
    </MaxWidthWrapper>
  );
}

export function PricingCardDialog({
  onClose,
  isOpen,
  chargeProduct,
}: {
  isOpen: boolean;
  chargeProduct?: ChargeProductSelectDto[];
  onClose: (isOpen: boolean) => void;
}) {
  const t = useTranslations("PricingPage");
  const { isSm, isMobile } = useMediaQuery();
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useUser();
  
  const product = useMemo(() => {
    if (isSm || isMobile) {
      return ([chargeProduct?.[1]] ?? []) as ChargeProductSelectDto[];
    }
    return chargeProduct ?? ([] as ChargeProductSelectDto[]);
  }, [isSm, isMobile]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onClose(open);
      }}
    >
      <DialogContent className="w-[96vw] md:w-[960px] md:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <div className="mb-4 flex justify-center">
            <ToggleGroup
              type="single"
              size="sm"
              defaultValue={isYearly ? "yearly" : "monthly"}
              onValueChange={(value) => setIsYearly(value === "yearly")}
              aria-label="toggle-billing"
              className="h-9 overflow-hidden rounded-full border bg-background p-1 *:h-7 *:text-muted-foreground"
            >
              <ToggleGroupItem
                value="monthly"
                className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              >
                {t("billing.monthly")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="yearly"
                className="rounded-full px-5 data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
              >
                {t("billing.yearly")} ({t("billing.save")})
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-1 gap-5 bg-inherit py-5 lg:grid-cols-2">
            {product?.map((offer) => (
              <PricingCard 
                offer={offer} 
                key={offer.id} 
                isYearly={isYearly}
                userId={user?.id}
              />
            ))}
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
