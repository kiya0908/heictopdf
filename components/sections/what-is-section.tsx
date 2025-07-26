import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default async function WhatIsSection() {
  const t = await getTranslations({ namespace: "IndexPage.whatIs" });

  const benefits = [
    {
      title: t("benefits.item1.title"),
      description: t("benefits.item1.description"),
    },
    {
      title: t("benefits.item2.title"),
      description: t("benefits.item2.description"), 
    },
    {
      title: t("benefits.item3.title"),
      description: t("benefits.item3.description"),
    },
    {
      title: t("benefits.item4.title"),
      description: t("benefits.item4.description"),
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
          <p className="text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-8">
            {t("benefits.title")}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}