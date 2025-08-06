"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";

import { ChargeProductHashids } from "@/db/dto/charge-product.dto";
import { prisma } from "@/db/prisma";
import { getErrorMessage } from "@/lib/handle-error";

import type { CreateSchema, UpdateSchema } from "./validations";

// 根据实际的 Prisma schema 修复字段映射
export async function createAction(input: CreateSchema) {
  noStore();
  try {
    const {
      title,
      locale,
      amount,
      currency,
      // 忽略不存在的字段：credit, originalAmount, tag, message, state
    } = input;

    await Promise.all([
      await prisma.chargeProduct.create({
        data: {
          name: title, // 映射 title -> name
          locale,
          amount,
          currency,
          // 只保留数据库中存在的字段
          description: `Product created`, // 可选字段
        },
      }),
    ]);

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateAction(input: UpdateSchema & { id: string }) {
  noStore();
  try {
    const [id] = ChargeProductHashids.decode(input.id);
    const {
      title,
      locale,
      amount,
      currency,
    } = input;
    
    await prisma.chargeProduct.update({
      where: {
        id: id as number,
      },
      data: {
        name: title, // 映射 title -> name
        locale,
        amount,
        currency,
        description: `Product updated`, // 可选字段
      },
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    console.log("err--->", err);
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteAction(input: { id: string }) {
  try {
    const [id] = ChargeProductHashids.decode(input.id);
    await prisma.chargeProduct.delete({
      where: {
        id: id as number,
      },
    });

    revalidatePath("/");
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/*
// 原代码中使用了数据库不存在的字段：
// credit, originalAmount, tag, message, state
// 这些字段不在 ChargeProduct 模型中，已从代码中移除
*/