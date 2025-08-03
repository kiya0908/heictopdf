import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";

const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
  sort: z.string().optional(),
  status: z.enum(["pending", "completed", "failed"]).optional(),
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
    const { page, pageSize, status } = values;
    const offset = (page - 1) * pageSize;
    const whereConditions: any = {
      userId,
    };
    if (status) {
      whereConditions.status = status;
    }

    const [conversionData, total] = await Promise.all([
      prisma.conversionHistory.findMany({
        where: whereConditions,
        take: pageSize,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.conversionHistory.count({ where: whereConditions }),
    ]);

    return NextResponse.json({
      data: {
        total,
        page,
        pageSize,
        data: conversionData.map((item) => ({
          id: item.id.toString(),
          originalFileName: item.originalFileName,
          originalFileSize: item.originalFileSize,
          convertedFileName: item.convertedFileName,
          downloadUrl: item.downloadUrl,
          urlExpiresAt: item.urlExpiresAt,
          conversionCost: item.conversionCost,
          status: item.status,
          errorMessage: item.errorMessage,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
