const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 最终修复版本的函数
async function getUserConversionUsage(userId) {
  if (!userId) return { dailyCount: 0, isLimitReached: false };

  try {
    // 获取当前UTC日期（只包含年月日，时分秒为0）
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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

    // 将存储的日期也转换为UTC日期（只包含年月日）
    const lastDateUTC = new Date(Date.UTC(lastConversionDate.getUTCFullYear(), lastConversionDate.getUTCMonth(), lastConversionDate.getUTCDate()));
    
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
    // 获取当前UTC日期（只包含年月日，时分秒为0）
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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

async function testFinalConversionLimits() {
  console.log('🎯 最终转换限制功能测试...\n');

  const testUserId = 'final_test_' + Date.now();
  console.log(`📝 测试用户: ${testUserId}`);
  
  // 显示当前UTC时间用于调试
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  console.log(`🕐 当前UTC日期: ${todayUTC.toISOString()}`);

  try {
    // 测试转换限制（应该在第11次被限制）
    for (let i = 1; i <= 12; i++) {
      console.log(`\n=== 第${i}次转换测试 ===`);
      
      // 检查是否可以转换
      const canConvert = await canUserConvert(testUserId);
      console.log(`🔍 转换检查: 允许=${canConvert.canConvert}, 当前计数=${canConvert.dailyCount}, Pro=${canConvert.isPro}`);
      
      if (canConvert.reason) {
        console.log(`⛔ 限制原因: ${canConvert.reason}`);
      }
      
      if (!canConvert.canConvert) {
        console.log(`❌ 第${i}次转换被成功限制！`);
        break;
      }
      
      // 执行转换并增加计数
      console.log(`✅ 执行转换并增加计数...`);
      await incrementUserConversionCount(testUserId);
      
      // 验证计数更新
      const afterUsage = await getUserConversionUsage(testUserId);
      console.log(`📊 转换后: 当前计数=${afterUsage.dailyCount}, 达到限制=${afterUsage.isLimitReached}`);
      
      if (i === 10) {
        console.log(`🚨 第10次转换完成，下次应该被限制！`);
      }
    }

    // 测试Pro用户绕过限制
    console.log('\n=== Pro用户测试 ===');
    await prisma.userPaymentInfo.create({
      data: {
        userId: testUserId,
        subscriptionStatus: 'active',
        subscriptionProvider: 'paypal',
        paypalSubscriptionId: 'final_test_pro',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    const proCheck = await canUserConvert(testUserId);
    console.log(`👑 Pro用户检查: 允许=${proCheck.canConvert}, Pro=${proCheck.isPro}, 计数=${proCheck.dailyCount}`);

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
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

testFinalConversionLimits();