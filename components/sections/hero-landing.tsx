import { CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import HeroUploadSection from "./hero-upload-section";

import AnimatedGradientText from "../magicui/animated-gradient-text";

export default async function HeroLanding() {
  const t = await getTranslations({ namespace: "IndexPage" });

  const features = [
    t("upload.features.fast"),
    t("upload.features.batch"),
    t("upload.features.quality"),
    t("upload.features.secure")
  ];

  return (
    <section className="space-y-12 py-12 sm:py-20 lg:py-24">
      <div className="container flex max-w-6xl flex-col items-center gap-8 text-center">
        <AnimatedGradientText>
          <span className="mr-3">📄</span>
          <span
            className={cn(
              `inline animate-gradient bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#6366f1] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
            )}
          >
            {t("intro")}
          </span>
        </AnimatedGradientText>

        <div className="space-y-4">
          <h1 className="text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
            <span>{t("subtitle")}</span>
            <br />
            <span className="text-gradient_indigo-purple font-extrabold">
              {t("title")}
            </span>
          </h1>

          <p
            className="max-w-2xl text-balance leading-normal text-muted-foreground sm:text-xl sm:leading-8"
            style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
          >
            {t("description")}
          </p>
        </div>

        {/* 特性列表 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-sm text-muted-foreground"
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 文件上传区域 */}
      <HeroUploadSection />

      {/* 转换流程说明 */}
      <div className="container max-w-4xl">
        <div className="text-center space-y-8">
          <h3 className="text-xl font-semibold">{t("upload.steps.title")}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">1</span>
              </div>
              <h4 className="font-medium">{t("upload.steps.step1.title")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("upload.steps.step1.description")}
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">2</span>
              </div>
              <h4 className="font-medium">{t("upload.steps.step2.title")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("upload.steps.step2.description")}
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-primary font-bold">3</span>
              </div>
              <h4 className="font-medium">{t("upload.steps.step3.title")}</h4>
              <p className="text-sm text-muted-foreground">
                {t("upload.steps.step3.description")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
