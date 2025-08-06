import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";

const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
  sort: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(req: NextRequest) {
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
    const { page, pageSize, type } = values;
    const offset = (page - 1) * pageSize;
    const whereConditions: any = {
      userId,
    };
    if (type) {
      whereConditions.type = type;
    }

    // 获取用户转换使用统计
    const usageData = await prisma.userConversionUsage.findUnique({
      where: { userId },
    });

    // 获取转换历史记录用于统计
    const [conversionHistory, totalConversions] = await Promise.all([
      prisma.conversionHistory.findMany({
        where: { userId },
        take: pageSize,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.conversionHistory.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      data: {
        total: totalConversions,
        page,
        pageSize,
        usageStats: {
          dailyConversionCount: usageData?.dailyConversionCount || 0,
          lastConversionDate: usageData?.lastConversionDate,
          totalConversions,
        },
        data: conversionHistory.map((record) => ({
          id: record.id.toString(),
          originalFileName: record.originalFileName,
          convertedFileName: record.convertedFileName,
          status: record.status,
          conversionCost: record.conversionCost,
          createdAt: record.createdAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
