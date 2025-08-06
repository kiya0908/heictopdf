import { NextResponse, type NextRequest } from "next/server";

import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";

import { MediaDto, MediaHashids } from "@/db/dto/media.dto";
import { prisma } from "@/db/prisma";
import { env } from "@/env.mjs";
import { getErrorMessage } from "@/lib/handle-error";
import { redis } from "@/lib/redis";
import { S3Service } from "@/lib/s3";

function getKey(id: string) {
  return `media:${id}`;
}

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
});

const getSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
  name: z.string().nullish().optional(),
});

const deleteSchema = z.object({
  id: z.string(),
});

type GetSchema = z.infer<typeof getSchema>;

export async function GET(req: NextRequest) {
  // TODO: Media 功能已被废弃，相关数据表已删除
  return NextResponse.json({
    list: [],
    pageSize: 12,
    page: 1,
    message: "Media functionality has been disabled"
  });
}

export async function DELETE(req: NextRequest) {
  // TODO: Media 功能已被废弃，相关数据表已删除
  return NextResponse.json({
    error: "Media functionality has been disabled"
  }, { status: 400 });
}
