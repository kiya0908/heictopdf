import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import { generatePageMetadata } from "@/lib/seo";
import { PricingCards } from "@/components/pricing-cards";
import { PricingFaq } from "@/components/pricing-faq";
import { getChargeProduct } from "@/db/queries/charge-product";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale });
  
  return generatePageMetadata({
    locale,
    title: `${t("PricingPage.title")} - ${t("LocaleLayout.title")}`,
    description: `Choose the perfect plan for your HEIC to PDF conversion needs. ${t("LocaleLayout.description")} Compare our free and premium plans with detailed features and pricing.`,
    keywords: ["HEIC to PDF pricing", "conversion plans", "premium features", "free converter", "subscription plans"],
  });
}

export default async function PricingPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  const { data: chargeProduct = [] } = await getChargeProduct(locale);
  const t = await getTranslations({ locale });

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      {/* 添加H1标题 */}
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-gradient_indigo-purple mb-4">
          {t("PricingPage.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t("PricingPage.subtitle") || "Choose the perfect plan for your HEIC to PDF conversion needs"}
        </p>
      </div>
      
      <PricingCards chargeProduct={chargeProduct} />
      <hr className="container" />
      <PricingFaq />
    </div>
  );
}
