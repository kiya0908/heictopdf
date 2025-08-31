import { unstable_setRequestLocale } from "next-intl/server";

import { generatePageMetadata } from "@/lib/seo";
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

export async function generateMetadata({ params: { locale } }: Props) {
  return generatePageMetadata({
    locale,
    title: "HEIC to PDF Converter - Convert HEIC Images to PDF Online",
    description: "Convert your HEIC images to PDF format quickly and easily. High-quality conversion with privacy protection. Free online tool.",
    keywords: ["HEIC to PDF", "image converter", "HEIC converter", "PDF converter", "online converter", "free converter"],
  });
}

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
