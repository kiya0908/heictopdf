"use server";

import { unstable_noStore as noStore } from "next/cache";

import { getErrorMessage } from "@/lib/handle-error";

import type { CreateSchema, UpdateSchema } from "./validations";

// TODO: giftCode 功能已被废弃，相关数据表已删除
// 这些 actions 暂时禁用，后续可以完全删除

export async function createAction(input: CreateSchema) {
  noStore();
  try {
    // giftCode 表已被删除，返回错误信息
    return {
      data: null,
      error: "Gift code functionality has been disabled.",
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateAction(input: UpdateSchema) {
  noStore();
  try {
    // giftCode 表已被删除，返回错误信息
    return {
      data: null,
      error: "Gift code functionality has been disabled.",
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteAction(input: { id: string }) {
  noStore();
  try {
    // giftCode 表已被删除，返回错误信息
    return {
      data: null,
      error: "Gift code functionality has been disabled.",
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

/*
// 原实现 - 保留以备参考
import { revalidatePath } from "next/cache";
import { GiftCodeHashids } from "@/db/dto/giftcode.dto";
import { prisma } from "@/db/prisma";

export async function createAction(input: CreateSchema) {
  noStore();
  try {
    const { code, creditAmount } = input;

    await Promise.all([
      await prisma.giftCode.create({
        data: {
          code,
          creditAmount,
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

export async function updateAction(input: UpdateSchema) {
  noStore();
  try {
    const { id, ...updateData } = input;

    const _id = GiftCodeHashids.decode(id as string)[0];

    if (!_id) {
      return {
        data: null,
        error: "Invalid gift code ID.",
      };
    }

    await Promise.all([
      prisma.giftCode.update({
        where: {
          id: Number(_id),
        },
        data: updateData,
      }),
    ]);

    revalidatePath("/admin/order/giftcode");

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
*/