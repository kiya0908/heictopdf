/**
 * 测试转换限制功能的脚本
 * 用于验证：
 * 1. 每日10次转换限制
 * 2. 批量转换次数计算逻辑
 * 3. Pro用户无限制转换
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 手动实现测试所需的函数
async function isUserPro(userId) {
  try {
    const userPayment = await prisma.userPaymentInfo.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!userPayment) return false;

    if (userPayment.subscriptionStatus !== "active") return false;

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

async function getUserConversionUsage(userId) {
  if (!userId) return { dailyCount: 0, isLimitReached: false };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.userConversionUsage.findUnique({
      where: { userId },
    });

    if (!usage) {
      await prisma.userConversionUsage.create({
        data: {
          userId,
          dailyConversionCount: 0,
          lastConversionDate: today,
        },
      });
      return { dailyCount: 0, isLimitReached: false };
    }

    const lastConversionDate = usage.lastConversionDate;
    if (!lastConversionDate || lastConversionDate < today) {
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

async function incrementUserConversionCount(userId) {
  if (!userId) return;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 确保不会重置计数 - 直接增加
    const result = await prisma.userConversionUsage.upsert({
      where: { userId },
      update: {
        dailyConversionCount: { increment: 1 },
        // 不更新日期，保持当前日期
      },
      create: {
        userId,
        dailyConversionCount: 1,
        lastConversionDate: today,
      },
    });
    
    return result;
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

  const isPro = await isUserPro(userId);
  
  if (isPro) {
    return {
      canConvert: true,
      isPro: true,
      dailyCount: 0,
    };
  }

  const { dailyCount, isLimitReached } = await getUserConversionUsage(userId);

  return {
    canConvert: !isLimitReached,
    reason: isLimitReached ? "Daily conversion limit reached. Upgrade to Pro for unlimited conversions." : undefined,
    isPro: false,
    dailyCount,
  };
}

async function testConversionLimits() {
  console.log('🔍 开始测试转换限制功能...\n');

  // 创建测试用户
  const testUserId = 'test_user_' + Date.now();
  console.log(`📝 创建测试用户: ${testUserId}`);

  try {
    // 1. 测试初始状态
    console.log('\n1️⃣ 测试初始用户转换状态...');
    
    let conversionCheck = await canUserConvert(testUserId);
    console.log('初始转换检查结果:', {
      canConvert: conversionCheck.canConvert,
      dailyCount: conversionCheck.dailyCount,
      isPro: conversionCheck.isPro,
      reason: conversionCheck.reason
    });

    // 2. 模拟进行9次转换
    console.log('\n2️⃣ 模拟进行9次批量转换...');
    
    for (let i = 1; i <= 9; i++) {
      await incrementUserConversionCount(testUserId);
      let usage = await getUserConversionUsage(testUserId);
      console.log(`第${i}次转换后: 今日已用${usage.dailyCount}次, 是否达到限制: ${usage.isLimitReached}`);
    }

    // 3. 检查第10次转换前的状态
    console.log('\n3️⃣ 检查第10次转换前的状态...');
    conversionCheck = await canUserConvert(testUserId);
    console.log('第10次转换前检查:', {
      canConvert: conversionCheck.canConvert,
      dailyCount: conversionCheck.dailyCount,
      reason: conversionCheck.reason
    });

    // 4. 进行第10次转换
    console.log('\n4️⃣ 进行第10次转换...');
    await incrementUserConversionCount(testUserId);
    let usage = await getUserConversionUsage(testUserId);
    console.log(`第10次转换后: 今日已用${usage.dailyCount}次, 是否达到限制: ${usage.isLimitReached}`);

    // 5. 检查是否被限制
    console.log('\n5️⃣ 检查第11次转换是否被限制...');
    conversionCheck = await canUserConvert(testUserId);
    console.log('第11次转换前检查:', {
      canConvert: conversionCheck.canConvert,
      dailyCount: conversionCheck.dailyCount,
      reason: conversionCheck.reason
    });

    // 6. 测试Pro用户
    console.log('\n6️⃣ 测试Pro用户权限...');
    
    // 创建Pro用户记录
    await prisma.userPaymentInfo.create({
      data: {
        userId: testUserId,
        subscriptionStatus: 'active',
        subscriptionProvider: 'paypal',
        paypalSubscriptionId: 'test_sub_' + Date.now(),
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
      }
    });

    conversionCheck = await canUserConvert(testUserId);
    console.log('Pro用户转换检查:', {
      canConvert: conversionCheck.canConvert,
      dailyCount: conversionCheck.dailyCount,
      isPro: conversionCheck.isPro,
      reason: conversionCheck.reason
    });

    console.log('\n✅ 转换限制测试完成!');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  } finally {
    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    try {
      await prisma.userConversionUsage.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.userPaymentInfo.deleteMany({
        where: { userId: testUserId }
      });
      await prisma.conversionHistory.deleteMany({
        where: { userId: testUserId }
      });
      console.log('✅ 测试数据清理完成');
    } catch (cleanupError) {
      console.error('⚠️ 清理测试数据时出错:', cleanupError);
    }
    
    await prisma.$disconnect();
  }
}

// 运行测试
testConversionLimits();