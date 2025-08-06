import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { type GetSchema } from "./validations";

// TODO: giftCode 功能已被废弃，相关数据表已删除
// 这些查询 暂时禁用，后续可以完全删除

export async function getBySearch(input: GetSchema) {
  noStore();
  
  try {
    // giftCode 表已被删除，返回空结果
    return {
      data: [],
      pageCount: 0,
      total: 0,
      pageSize: input.pageSize,
      page: input.page,
    };
  } catch (err) {
    console.error("Error in getBySearch:", err);
    return { 
      data: [], 
      pageCount: 0, 
      total: 0, 
      pageSize: input.pageSize, 
      page: input.page 
    };
  }
}

/*
// 原实现 - 保留以备参考
import { GiftCodeHashids } from "@/db/dto/giftcode.dto";
import { prisma } from "@/db/prisma";
import { type GiftCodeDto } from "@/db/type";

export async function getBySearch(input: GetSchema) {
  noStore();
  const { page, pageSize, sort, from, to, operator } = input;

  try {
    const offset = (page - 1) * pageSize;
    const [column, order] = (sort?.split(".").filter(Boolean) ?? [
      "createdAt",
      "desc",
    ]) as [keyof GiftCodeDto | undefined, "asc" | "desc" | undefined];

    const whereConditions: any = {};

    if (from && to) {
      whereConditions.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const where =
      operator === "or"
        ? {
            OR: Object.entries(whereConditions).map(([key, value]) => ({
              [key]: value,
            })),
          }
        : whereConditions;

    const [data, total] = await prisma.$transaction([
      prisma.giftCode.findMany({
        where,
        take: pageSize,
        skip: offset,
        orderBy: column ? { [column]: order ?? "desc" } : { id: "desc" },
      }),
      prisma.giftCode.count({ where }),
    ]);

    const pageCount = Math.ceil(total / pageSize);

    return {
      data: data.map(({ id, ...rest }) => ({
        ...rest,
        id: GiftCodeHashids.encode(id),
      })),
      pageCount,
      total,
    };
  } catch (err) {
    console.error("Error in getBySearch:", err);
    return { data: [], pageCount: 0, total: 0, pageSize, page };
  }
}
*/