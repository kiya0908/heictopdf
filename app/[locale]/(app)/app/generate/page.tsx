import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import HeicConverter from "@/components/heic-converter";
import { getChargeProduct } from "@/db/queries/charge-product";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: "HeicConverter" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ConvertPage({
  params: { locale },
}: PageProps) {
  unstable_setRequestLocale(locale);
  const { data: chargeProduct } = await getChargeProduct(locale);

  return <HeicConverter locale={locale} chargeProduct={chargeProduct} />;
}
