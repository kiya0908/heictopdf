import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import SubscriptionInfo from "@/components/dashboard/subscription-info";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { PaymentStatusNotification } from "@/components/dashboard/payment-status-notification";

interface PageProps {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
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

export default async function DashboardPage({ 
  params: { locale },
  searchParams 
}: PageProps) {
  unstable_setRequestLocale(locale);

  return (
    <DashboardShell>
      <PaymentStatusNotification searchParams={searchParams} />
      <DashboardHeader 
        heading="Dashboard" 
        text="Manage your conversions and subscription"
      />
      <SubscriptionInfo />
    </DashboardShell>
  );
}
