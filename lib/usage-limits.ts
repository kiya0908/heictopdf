/**
 * 用户使用限制管理
 * 处理免费用户每日转换次数限制
 */

import { prisma } from "@/db/prisma";

export interface UsageLimit {
  userId: string;
  dailyConversions: number;
  lastConversionDate: Date;
  isPremium: boolean;
}

export class UsageLimitManager {
  // 免费用户每日限制
  private static readonly FREE_DAILY_LIMIT = 10;
  
  // 文件大小限制 (10MB)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  /**
   * 检查用户是否可以进行转换
   * @param userId 用户ID
   * @returns 是否可以转换和剩余次数
   */
  static async canUserConvert(userId: string): Promise<{
    canConvert: boolean;
    remainingConversions: number;
    isPremium: boolean;
    resetTime?: Date;
  }> {
    try {
      // 获取用户转换使用情况
      const usage = await prisma.userConversionUsage.findUnique({
        where: { userId }
      });

      // 检查用户是否为付费用户 (这里需要根据你的付费逻辑调整)
      const isPremium = await this.checkUserPremiumStatus(userId);

      // 付费用户无限制
      if (isPremium) {
        return {
          canConvert: true,
          remainingConversions: -1, // -1 表示无限制
          isPremium: true
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 如果没有使用记录，创建新记录
      if (!usage) {
        await prisma.userConversionUsage.create({
          data: {
            userId,
            dailyConversionCount: 0,
            lastConversionDate: today
          }
        });
        
        return {
          canConvert: true,
          remainingConversions: this.FREE_DAILY_LIMIT,
          isPremium: false,
          resetTime: this.getNextResetTime()
        };
      }

      // 检查是否是新的一天，如果是则重置计数
      const lastConversionDate = usage.lastConversionDate 
        ? new Date(usage.lastConversionDate) 
        : new Date(0); // 如果为 null，使用 epoch 时间
      lastConversionDate.setHours(0, 0, 0, 0);

      if (lastConversionDate.getTime() < today.getTime()) {
        // 新的一天，重置计数
        await prisma.userConversionUsage.update({
          where: { userId },
          data: {
            dailyConversionCount: 0,
            lastConversionDate: today
          }
        });

        return {
          canConvert: true,
          remainingConversions: this.FREE_DAILY_LIMIT,
          isPremium: false,
          resetTime: this.getNextResetTime()
        };
      }

      // 检查今日是否还有剩余次数
      const remainingConversions = this.FREE_DAILY_LIMIT - usage.dailyConversionCount;
      const canConvert = remainingConversions > 0;

      return {
        canConvert,
        remainingConversions: Math.max(0, remainingConversions),
        isPremium: false,
        resetTime: this.getNextResetTime()
      };
    } catch (error) {
      console.error('Error checking user conversion limit:', error);
      // 出错时允许转换，但记录错误
      return {
        canConvert: true,
        remainingConversions: 1,
        isPremium: false
      };
    }
  }

  /**
   * 记录用户转换使用
   * @param userId 用户ID
   */
  static async recordConversion(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.userConversionUsage.upsert({
        where: { userId },
        update: {
          dailyConversionCount: {
            increment: 1
          },
          lastConversionDate: today
        },
        create: {
          userId,
          dailyConversionCount: 1,
          lastConversionDate: today
        }
      });
    } catch (error) {
      console.error('Error recording conversion:', error);
      // 记录失败不应该阻止转换流程
    }
  }

  /**
   * 检查用户付费状态
   * @param userId 用户ID
   * @returns 是否为付费用户
   */
  private static async checkUserPremiumStatus(userId: string): Promise<boolean> {
    try {
      // 这里需要根据你的付费逻辑来实现
      // 可能需要检查 Stripe 订阅状态或者用户积分等
      const userPayment = await prisma.userPaymentInfo.findUnique({
        where: { userId }
      });

      // 简单的检查逻辑：如果有有效的订阅就是付费用户
      if (userPayment?.stripeSubscriptionId && userPayment?.stripeCurrentPeriodEnd) {
        return new Date() < userPayment.stripeCurrentPeriodEnd;
      }

      return false;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  /**
   * 获取下次重置时间（明天凌晨）
   */
  private static getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * 获取文件大小限制
   */
  static getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * 检查文件大小是否有效
   */
  static isFileSizeValid(fileSize: number): boolean {
    return fileSize > 0 && fileSize <= this.MAX_FILE_SIZE;
  }
}