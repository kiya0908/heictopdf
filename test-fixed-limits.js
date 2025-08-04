const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 使用修复后的逻辑
async function getUserConversionUsage(userId) {
  if (!userId) return { dailyCount: 0, isLimitReached: false };

  try {
    // 使用UTC时间来避免时区问题
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const usage = await prisma.userConversionUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      // Create initial usage record
      await prisma.userConversionUsage.create({
        data: {
          userId,
          dailyConversionCount: 0,
          lastConversionDate: todayUTC,
        },
      });
      return { dailyCount: 0, isLimitReached: false };
    }

    // Check if it's a new day using UTC dates
    const lastConversionDate = usage.lastConversionDate;
    if (!lastConversionDate) {
      // If no date recorded, set today and reset count
      await prisma.userConversionUsage.update({
        where: { userId },
        data: {
          dailyConversionCount: 0,
          lastConversionDate: todayUTC,
        },
      });
      return { dailyCount: 0, isLimitReached: false };
    }

    // Compare dates by converting to UTC date strings
    const lastDateUTC = new Date(lastConversionDate.getUTCFullYear(), lastConversionDate.getUTCMonth(), lastConversionDate.getUTCDate());
    
    if (lastDateUTC.getTime() < todayUTC.getTime()) {
      // Reset daily count for new day
      await prisma.userConversionUsage.update({
        where: { userId },
        data: {
          dailyConversionCount: 0,
          lastConversionDate: todayUTC,
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

async function incrementUserConversionCount(userId) {
  if (!userId) return;

  try {
    // 使用UTC时间来避免时区问题
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    await prisma.userConversionUsage.upsert({
      where: { userId },
      update: {
        dailyConversionCount: { increment: 1 },
        lastConversionDate: todayUTC,
      },
      create: {
        userId,
        dailyConversionCount: 1,
        lastConversionDate: todayUTC,
      },
    });
  } catch (error) {
    console.error("Error incrementing user conversion count:", error);
  }
}

async function canUserConvert(userId) {
  if (!userId) {
    return {
      canConvert: false,
      reason: "User not authenticated",
      isPro: false,
      dailyCount: 0,
    };
  }

  // 检查Pro用户状态
  const userPayment = await prisma.userPaymentInfo.findUnique({
    where: { userId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  const isPro = userPayment && userPayment.subscriptionStatus === "active";
  
  if (isPro) {
    return {
      canConvert: true,
      isPro: true,
      dailyCount: 0,
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

async function testFixedConversionLimits() {
  console.log('🚀 测试修复后的转换限制功能...\n');

  const testUserId = 'fixed_test_' + Date.now();
  console.log(`📝 测试用户: ${testUserId}`);

  try {
    // 测试0-11次转换
    for (let i = 1; i <= 12; i++) {
      console.log(`\n--- 第${i}次转换 ---`);
      
      // 检查是否可以转换
      const canConvert = await canUserConvert(testUserId);
      console.log(`转换前检查: canConvert=${canConvert.canConvert}, count=${canConvert.dailyCount}, isPro=${canConvert.isPro}`);
      
      if (canConvert.reason) {
        console.log(`限制说明: ${canConvert.reason}`);
      }
      
      if (!canConvert.canConvert) {
        console.log(`❌ 转换被限制，测试结束`);
        break;
      }
      
      // 执行转换并增加计数
      console.log(`✅ 允许转换，增加计数...`);
      await incrementUserConversionCount(testUserId);
      
      // 验证计数更新
      const afterUsage = await getUserConversionUsage(testUserId);
      console.log(`转换后计数: ${afterUsage.dailyCount}, 是否达到限制: ${afterUsage.isLimitReached}`);
    }

    // 测试Pro用户
    console.log('\n--- 测试Pro用户权限 ---');
    await prisma.userPaymentInfo.create({
      data: {
        userId: testUserId,
        subscriptionStatus: 'active',
        subscriptionProvider: 'paypal',
        paypalSubscriptionId: 'test_pro_sub',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const proCheck = await canUserConvert(testUserId);
    console.log(`Pro用户检查: canConvert=${proCheck.canConvert}, isPro=${proCheck.isPro}`);

    console.log('\n✅ 转换限制测试完成!');

  } catch (error) {
    console.error('❌ 测试错误:', error);
  } finally {
    // 清理测试数据
    await prisma.userConversionUsage.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.userPaymentInfo.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
    console.log('\n🧹 测试数据已清理');
  }
}

testFixedConversionLimits();