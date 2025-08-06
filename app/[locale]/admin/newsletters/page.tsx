import { unstable_noStore as noStore } from "next/cache";

import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";

// TODO: newsletters 功能已被废弃，相关数据表已删除
// 这个页面暂时显示禁用信息，后续可以完全删除

export default async function NewslettersPage() {
  noStore();

  const t = await getTranslations();

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-4">Newsletters</h1>
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Newsletter functionality has been disabled. The related database tables have been removed.
          </p>
        </div>
      </div>
    </Container>
  );
}

/*
// 原实现 - 保留以备参考
import { prisma } from "@/db/prisma";
import NewslettersCard from "./_mods/card";

async function getNlsData() {
  const sql = \`
    (SELECT COUNT(*) FROM newsletters) as total
  \`;
   const nl = await prisma.newsletters.findMany({
     take: 100,
     orderBy: {
       sentAt: "desc",
     },
   });

   return { nl, total: nl.length };
}

export default async function NewslettersPage() {
  noStore();

  const t = await getTranslations();

  const { nl, total } = await getNlsData();

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-4">{t("Newsletters")}</h1>

        {nl && nl.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nl.map((nl) => (
              <NewslettersCard key={nl.id} data={nl} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">{t("No newsletters found")}</p>
          </div>
        )}
      </div>
    </Container>
  );
}
*/