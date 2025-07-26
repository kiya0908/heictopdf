import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "@/lib/navigation";

export default async function FaqSection() {
  const t = await getTranslations({ namespace: "IndexPage.faq" });

  const faqs = [
    {
      question: t("items.q1.question"),
      answer: t("items.q1.answer"),
    },
    {
      question: t("items.q2.question"),
      answer: t("items.q2.answer"),
    },
    {
      question: t("items.q3.question"),
      answer: t("items.q3.answer"),
    },
    {
      question: t("items.q4.question"),
      answer: t("items.q4.answer"),
    },
    {
      question: t("items.q5.question"),
      answer: t("items.q5.answer"),
    },
    {
      question: t("items.q6.question"),
      answer: t("items.q6.answer"),
    },
    {
      question: t("items.pricing.question"),
      answer: (
        <span>
          {t("items.pricing.answer")}{" "}
          <Link
            href="/pricing"
            className="inline-flex items-center px-3 py-1 rounded-md text-primary hover:bg-primary/20 hover:underline transition-colors duration-200 font-medium"
          >
            {t("items.pricing.link")}
          </Link>
        </span>
      ),
    },
  ];

  return (
    <section className="py-16">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg p-1"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                <span className="font-medium">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}