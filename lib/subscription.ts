import { prisma } from "@/db/prisma";

/**
 * Check if a user has an active Pro subscription
 */
export async function isUserPro(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const userPayment = await prisma.userPaymentInfo.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!userPayment) return false;

    // Check if subscription is active
    if (userPayment.subscriptionStatus !== "active") return false;

    // Check if subscription hasn't expired (if expiration date is set)
    if (userPayment.subscriptionExpiresAt) {
      const now = new Date();
      if (userPayment.subscriptionExpiresAt < now) return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking user Pro status:", error);
    return false;
  }
}

/**
 * Get user subscription details
 */
export async function getUserSubscription(userId: string) {
  if (!userId) return null;

  try {
    const userPayment = await prisma.userPaymentInfo.findUnique({
      where: { userId },
      select: {
        subscriptionProvider: true,
        paypalSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionPlanId: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return userPayment;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

/**
 * Check user's daily conversion usage
 */
export async function getUserConversionUsage(userId: string) {
  if (!userId) return { dailyCount: 0, isLimitReached: false };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.userConversionUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      // Create initial usage record
      await prisma.userConversionUsage.create({
        data: {
          userId,
          dailyConversionCount: 0,
          lastConversionDate: today,
        },
      });
      return { dailyCount: 0, isLimitReached: false };
    }

    // Check if it's a new day
    const lastConversionDate = usage.lastConversionDate;
    if (!lastConversionDate || lastConversionDate < today) {
      // Reset daily count for new day
      await prisma.userConversionUsage.update({
        where: { userId },
        data: {
          dailyConversionCount: 0,
          lastConversionDate: today,
        },
      });
      return { dailyCount: 0, isLimitReached: false };
    }

    const dailyCount = usage.dailyConversionCount;
    const FREE_DAILY_LIMIT = 10;
    
    return {
      dailyCount,
      isLimitReached: dailyCount >= FREE_DAILY_LIMIT,
    };
  } catch (error) {
    console.error("Error checking user conversion usage:", error);
    return { dailyCount: 0, isLimitReached: false };
  }
}

/**
 * Increment user's daily conversion count
 */
export async function incrementUserConversionCount(userId: string) {
  if (!userId) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.userConversionUsage.upsert({
      where: { userId },
      update: {
        dailyConversionCount: { increment: 1 },
        lastConversionDate: today,
      },
      create: {
        userId,
        dailyConversionCount: 1,
        lastConversionDate: today,
      },
    });
  } catch (error) {
    console.error("Error incrementing user conversion count:", error);
  }
}

/**
 * Check if user can perform conversion (considering Pro status and daily limits)
 */
export async function canUserConvert(userId: string): Promise<{
  canConvert: boolean;
  reason?: string;
  isPro: boolean;
  dailyCount: number;
}> {
  if (!userId) {
    return {
      canConvert: false,
      reason: "User not authenticated",
      isPro: false,
      dailyCount: 0,
    };
  }

  const isPro = await isUserPro(userId);
  
  if (isPro) {
    return {
      canConvert: true,
      isPro: true,
      dailyCount: 0, // Pro users don't have daily limits
    };
  }

  // Check daily limits for free users
  const { dailyCount, isLimitReached } = await getUserConversionUsage(userId);

  return {
    canConvert: !isLimitReached,
    reason: isLimitReached ? "Daily conversion limit reached. Upgrade to Pro for unlimited conversions." : undefined,
    isPro: false,
    dailyCount,
  };
}