import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

export default async function GetStartedSection() {
  const t = await getTranslations({ namespace: "IndexPage.getStarted" });

  return (
    <section className="py-20 bg-gray-50 text-gray-900">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">{t("title")}</h2>
        <p className="text-lg text-gray-600 mb-8">
          {t("subtitle")}
        </p>
        <Link href="/">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {t("action")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
