import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Star, 
  Layers, 
  Gift, 
  Headphones 
} from "lucide-react";

// 图标映射
const iconMap = {
  shield: Shield,
  zap: Zap,
  star: Star,
  layers: Layers,
  gift: Gift,
  headphones: Headphones,
};

export default async function WhyChooseSection() {
  const t = await getTranslations({ namespace: "IndexPage.why" });

  const features = [
    {
      icon: "shield",
      title: t("features.security.title"),
      description: t("features.security.description"),
    },
    {
      icon: "zap",
      title: t("features.speed.title"),
      description: t("features.speed.description"),
    },
    {
      icon: "star",
      title: t("features.quality.title"),
      description: t("features.quality.description"),
    },
    {
      icon: "layers",
      title: t("features.batch.title"),
      description: t("features.batch.description"),
    },
    {
      icon: "gift",
      title: t("features.free.title"),
      description: t("features.free.description"),
    },
    {
      icon: "headphones",
      title: t("features.support.title"),
      description: t("features.support.description"),
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}