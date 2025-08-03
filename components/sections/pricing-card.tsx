import { PricingPlans } from "@/components/pricing-plans";
import { PricingFaq } from "@/components/pricing-faq";

type Props = {
  locale: string;
};

export default async function PricingCard(props: Props) {
  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      <PricingPlans locale={props.locale} />
      <hr className="container" />
      <PricingFaq />
    </div>
  );
}
