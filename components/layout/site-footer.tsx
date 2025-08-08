import * as React from "react";

import { useTranslations } from "next-intl";

import { ModeToggle } from "@/components/layout/mode-toggle";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import NewsletterForm from "../forms/newsletter-form";
import { Icons } from "../shared/icons";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  const t = useTranslations("PageLayout");
  return (
    <footer
      className={cn(
        "container border-t",
        "w-full p-6 pb-4 md:py-12",
        className,
      )}
    >
      <div className="flex max-w-7xl flex-col items-center justify-end gap-4 text-sm md:flex-row">
        <Link
          href="/terms-of-use"
          className="underline-offset-4 hover:underline"
          prefetch={false}
          title={t("footer.term")}
        >
          {t("footer.term")}
        </Link>
        <Link
          href="/privacy-policy"
          className="underline-offset-4 hover:underline"
          prefetch={false}
          title={t("footer.privacy")}
        >
          {t("footer.privacy")}
        </Link>
        <a
          href="mailto:support@heic-to-pdf.pro"
          className="underline-offset-4 hover:underline"
          title={t("footer.contact")}
        >
          {t("footer.contact")}
        </a>
        <ModeToggle />
      </div>
      <div className="mt-4 flex max-w-7xl flex-col items-center justify-between gap-4 text-sm md:flex-row">
        <div className="flex items-center gap-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-medium">HEIC to PDF Converter</span>
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <a
            href="https://github.com"
            title="GitHub"
            className="underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="mt-4 flex max-w-7xl flex-col items-center justify-center gap-4 text-sm md:flex-row">
        <p className="text-muted-foreground">
          &copy; 2025 HEIC to PDF Converter. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
