/**
 * Creem 取消订阅 API 端点
 * 
 * 处理用户主动取消 Creem 订阅的请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/db/prisma';
import { creemClient } from '@/lib/creem';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的 Creem 订阅信息
    const userPayment = await prisma.userPaymentInfo.findUnique({
      where: { userId },
      select: {
        subscriptionProvider: true,
        creemSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!userPayment) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (userPayment.subscriptionProvider !== 'creem') {
      return NextResponse.json(
        { error: 'Not a Creem subscription' },
        { status: 400 }
      );
    }

    if (!userPayment.creemSubscriptionId) {
      return NextResponse.json(
        { error: 'Creem subscription ID not found' },
        { status: 400 }
      );
    }

    if (userPayment.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    // 调用 Creem API 取消订阅
    const cancelResult = await creemClient.cancelSubscription(
      userPayment.creemSubscriptionId,
      true // 在计费周期结束时取消
    );

    if (!cancelResult.success) {
      console.error('Creem cancel subscription failed:', cancelResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription with Creem',
          details: cancelResult.error?.message 
        },
        { status: 500 }
      );
    }

    // 更新数据库中的订阅状态
    await prisma.userPaymentInfo.update({
      where: { userId },
      data: {
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ 用户 ${userId} 的 Creem 订阅已取消`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelResult.data,
    });

  } catch (error) {
    console.error('Creem cancel subscription error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}