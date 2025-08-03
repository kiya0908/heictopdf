import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import SubscriptionInfo from "@/components/dashboard/subscription-info";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params: { locale },
}: PageProps) {
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return {
    title: t("page.title") || "Dashboard",
    description: t("page.description") || "Manage your HEIC to PDF conversions and subscription",
  };
}

export default async function DashboardPage({ params: { locale } }: PageProps) {
  unstable_setRequestLocale(locale);

  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Dashboard" 
        text="Manage your conversions and subscription"
      />
      <SubscriptionInfo />
    </DashboardShell>
  );
}
