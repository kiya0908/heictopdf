import { unstable_setRequestLocale } from "next-intl/server";

import { NavMobile } from "@/components/layout/mobile-nav";
import { NavBar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import Promotion from "@/components/sections/promotion";
import NativeBanner from "@/components/ads/NativeBanner";

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function MarketingLayout({
  children,
  params,
}: MarketingLayoutProps) {
  unstable_setRequestLocale(params.locale);

  return (
    <div className="flex min-h-screen flex-col">
      <NavMobile />
      <NavBar scroll={true} />
      <main className="flex-1">{children}</main>
      <NativeBanner className="py-8 px-4" />
      <SiteFooter />
      <Promotion locale={params.locale} />
    </div>
  );
}
