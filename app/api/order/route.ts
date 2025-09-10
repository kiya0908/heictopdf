import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { ChargeOrderHashids } from "@/db/dto/charge-order.dto";
import { prisma } from "@/db/prisma";
import { OrderPhase } from "@/db/type";
import { getErrorMessage } from "@/lib/handle-error";

const searchParamsSchema = z.object({
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
  sort: z.string().optional(),
  phase: z
    .enum([OrderPhase.Paid, OrderPhase.Canceled, OrderPhase.Failed, "cancelled-subscription"])
    .optional(),
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
    const { page, pageSize, phase } = values;
    const offset = (page - 1) * pageSize;
    const whereConditions: any = {
      userId,
    };
    
    // 特殊处理"已取消"tab的查询逻辑
    if (phase === "cancelled-subscription") {
      // 查询所有订单，稍后在代码中过滤被取消的订阅
      whereConditions.phase = {
        not: OrderPhase.Pending,
      };
    } else if (phase) {
      whereConditions.phase = phase;
    } else {
      whereConditions.phase = {
        not: OrderPhase.Pending,
      };
    }

    const [data, total] = await Promise.all([
      prisma.chargeOrder.findMany({
        where: whereConditions,
        take: pageSize,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.chargeOrder.count({ where: whereConditions }),
    ]);

    // 获取用户的订阅信息
    const userPaymentInfo = await prisma.userPaymentInfo.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        subscriptionProvider: true,
        creemSubscriptionId: true,
        paypalSubscriptionId: true,
        stripeSubscriptionId: true,
      }
    });

    // 处理数据，添加动态订阅状态信息
    const processedData = data.map((order) => {
      let subscriptionStatus: {
        currentStatus: any;
        provider: any;
        subscriptionId: any;
      } | null = null;
      
      // 如果是订阅相关的订单且有用户支付信息，检查当前订阅状态
      if (userPaymentInfo && order.channel === "Creem") {
        // 检查是否是当前订单对应的订阅
        if (userPaymentInfo.subscriptionProvider === "creem" && 
            userPaymentInfo.creemSubscriptionId &&
            order.result?.creemSubscriptionId === userPaymentInfo.creemSubscriptionId) {
          subscriptionStatus = {
            currentStatus: userPaymentInfo.subscriptionStatus,
            provider: userPaymentInfo.subscriptionProvider,
            subscriptionId: userPaymentInfo.creemSubscriptionId
          };
        }
      } else if (userPaymentInfo && order.channel === "PayPal" && userPaymentInfo.paypalSubscriptionId) {
        subscriptionStatus = {
          currentStatus: userPaymentInfo.subscriptionStatus,
          provider: userPaymentInfo.subscriptionProvider,
          subscriptionId: userPaymentInfo.paypalSubscriptionId
        };
      }
      
      return {
        ...order,
        subscriptionStatus // 添加订阅状态信息
      };
    });

    // 如果是"已取消"tab，过滤出被取消的订阅
    let filteredData = processedData;
    if (phase === "cancelled-subscription") {
      filteredData = processedData.filter(order => 
        order.subscriptionStatus && 
        order.subscriptionStatus.currentStatus === 'cancelled' &&
        order.phase === OrderPhase.Paid
      );
    }

    // 重新计算分页
    const filteredTotal = filteredData.length;
    const paginatedData = filteredData.slice(offset, offset + pageSize);

    return NextResponse.json({
      data: {
        total: phase === "cancelled-subscription" ? filteredTotal : total,
        page,
        pageSize,
        data: (phase === "cancelled-subscription" ? paginatedData : processedData).map(({ id, ...rest }) => ({
          ...rest,
          id: ChargeOrderHashids.encode(id),
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
