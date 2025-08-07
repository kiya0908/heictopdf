import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";
// import { redis } from "@/lib/redis";

const searchParamsSchema = z.object({
  conversionId: z.string(),
});

export async function GET(req: NextRequest) {
  // Rate limiting removed for simplicity - rely on Vercel's built-in limits

  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const values = searchParamsSchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const { conversionId } = values;
    
    const conversionData = await prisma.conversionHistory.findUnique({
      where: {
        id: parseInt(conversionId),
        userId: userId, // 确保只能下载自己的文件
      },
    });

    if (!conversionData || !conversionData.downloadUrl) {
      return new Response("Conversion record not found or download URL not available", {
        status: 404,
      });
    }

    if (conversionData.status !== "completed") {
      return new Response("Conversion not completed yet", {
        status: 400,
      });
    }

    // 检查下载链接是否过期
    if (conversionData.urlExpiresAt && conversionData.urlExpiresAt < new Date()) {
      return new Response("Download link has expired", {
        status: 410,
      });
    }

    // 获取文件内容
    const blob = await fetch(conversionData.downloadUrl).then((response) =>
      response.blob(),
    );
    
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf"); // HEIC转PDF的结果都是PDF
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(conversionData.convertedFileName || `converted_${conversionId}.pdf`)}"`,
    );
    return new NextResponse(blob, { status: 200, statusText: "OK", headers });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}