import { unstable_setRequestLocale } from "next-intl/server";

import Features from "@/components/sections/features";
import HeroLanding from "@/components/sections/hero-landing";
import TwitterList from "@/components/sections/twitter-list";
import WhatIsSection from "@/components/sections/what-is-section";
import HowToSection from "@/components/sections/how-to-section";
import WhyChooseSection from "@/components/sections/why-choose-section";
import FaqSection from "@/components/sections/faq-section";
import GetStartedSection from "@/components/sections/get-started-section";

type Props = {
  params: { locale: string };
};

export default function IndexPage({ params: { locale } }: Props) {
  // Enable static rendering
  unstable_setRequestLocale(locale);

  return (
    <>
      <HeroLanding />
      <WhatIsSection />
      <HowToSection />
      <WhyChooseSection />
      <Features />
      <FaqSection />
      <GetStartedSection />
{/* {process.env.NODE_ENV === "production" && <TwitterList />} */}
    </>
  );
}
