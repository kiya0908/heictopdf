import { redirect } from "next/navigation";

import { unstable_setRequestLocale } from "next-intl/server";

// TODO: subscribers 功能已被废弃，相关数据表已删除
// 这个页面暂时重定向到首页，后续可以完全删除

export const metadata = {
  title: "感谢你的订阅",
};

export default async function ConfirmPage({
  params,
}: {
  params: { token: string; locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  
  // subscribers 表已被删除，直接重定向到首页
  redirect("/");
}

/*
// 原实现 - 保留以备参考
import { Container } from "@/components/layout/container";
import { prisma } from "@/db/prisma";
import { SubbedCelebration } from "./SubbedCelebration";

export default async function ConfirmPage({
  params,
}: {
  params: { token: string; locale: string };
}) {
  unstable_setRequestLocale(params.locale);

  const subscriber = await prisma.subscribers.findFirst({
    where: {
      token: params.token,
    },
  });

  if (!subscriber || subscriber.subscribedAt) {
    redirect("/");
  }

  await prisma.subscribers.update({
    where: {
      id: subscriber.id,
    },
    data: {
      subscribedAt: new Date(),
      token: null,
    },
  });

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="relative mx-auto flex w-full max-w-2xl items-center justify-center">
        <h1
          className="w-full text-center text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
          id="subbed-celebration"
        >
          🥳 感谢你的订阅 🎉
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400"></p>
      </header>
      <SubbedCelebration />
    </Container>
  );
}
*/