import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Zap, Download } from "lucide-react";

export default async function HowToSection() {
  const t = await getTranslations({ namespace: "IndexPage.howTo" });

  const steps = [
    {
      icon: Upload,
      title: t("steps.step1.title"),
      description: t("steps.step1.description"),
      detail: t("steps.step1.detail"),
    },
    {
      icon: Zap,
      title: t("steps.step2.title"),
      description: t("steps.step2.description"),
      detail: t("steps.step2.detail"),
    },
    {
      icon: Download,
      title: t("steps.step3.title"),
      description: t("steps.step3.description"),
      detail: t("steps.step3.detail"),
    },
  ];

  return (
    <section className="py-16">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                <Card className="border-0 shadow-sm h-full">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    <p className="text-sm text-muted-foreground/80 italic">
                      {step.detail}
                    </p>
                  </CardContent>
                </Card>
                
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-muted-foreground/20 transform -translate-y-1/2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}