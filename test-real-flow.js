const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealConversionFlow() {
  console.log('🚀 测试实际的转换流程...\n');

  const testUserId = 'flow_test_' + Date.now();
  console.log(`📝 测试用户: ${testUserId}`);

  try {
    // 模拟实际API调用流程
    for (let i = 1; i <= 12; i++) {
      console.log(`\n--- 第${i}次转换 ---`);
      
      // 1. 检查用户是否可以转换 (模拟API调用开始)
      const canConvert = await checkCanUserConvert(testUserId);
      console.log(`转换前检查: canConvert=${canConvert.canConvert}, count=${canConvert.dailyCount}, isPro=${canConvert.isPro}`);
      
      if (!canConvert.canConvert) {
        console.log(`❌ 被限制: ${canConvert.reason}`);
        break;
      }
      
      // 2. 如果可以转换，增加计数 (模拟转换成功)
      console.log(`✅ 允许转换，增加计数...`);
      await incrementCount(testUserId);
      
      // 3. 验证计数是否正确增加
      const afterCount = await getDirectCount(testUserId);
      console.log(`转换后实际计数: ${afterCount}`);
    }

  } catch (error) {
    console.error('测试错误:', error);
  } finally {
    // 清理
    await prisma.userConversionUsage.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
    console.log('\n🧹 清理完成');
  }
}

async function checkCanUserConvert(userId) {
  if (!userId) {
    return { canConvert: false, reason: "用户未认证", isPro: false, dailyCount: 0 };
  }

  // 检查是否是Pro用户
  const userPayment = await prisma.userPaymentInfo.findUnique({
    where: { userId },
    select: { subscriptionStatus: true, subscriptionExpiresAt: true },
  });

  const isPro = userPayment && userPayment.subscriptionStatus === "active";
  
  if (isPro) {
    return { canConvert: true, isPro: true, dailyCount: 0 };
  }

  // 检查免费用户限制
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let usage = await prisma.userConversionUsage.findUnique({
    where: { userId },
  });

  if (!usage) {
    // 创建初始记录
    usage = await prisma.userConversionUsage.create({
      data: {
        userId,
        dailyConversionCount: 0,
        lastConversionDate: today,
      },
    });
  }

  // 检查是否需要重置（新的一天）
  const lastDate = usage.lastConversionDate;
  if (!lastDate || lastDate < today) {
    // 重置为新的一天
    usage = await prisma.userConversionUsage.update({
      where: { userId },
      data: {
        dailyConversionCount: 0,
        lastConversionDate: today,
      },
    });
  }

  const dailyCount = usage.dailyConversionCount;
  const FREE_LIMIT = 10;
  
  return {
    canConvert: dailyCount < FREE_LIMIT,
    reason: dailyCount >= FREE_LIMIT ? "每日转换次数已达上限，请升级Pro版本" : undefined,
    isPro: false,
    dailyCount,
  };
}

async function incrementCount(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.userConversionUsage.upsert({
    where: { userId },
    update: {
      dailyConversionCount: { increment: 1 },
      lastConversionDate: today, // 确保日期是今天
    },
    create: {
      userId,
      dailyConversionCount: 1,
      lastConversionDate: today,
    },
  });
}

async function getDirectCount(userId) {
  const usage = await prisma.userConversionUsage.findUnique({
    where: { userId },
    select: { dailyConversionCount: true }
  });
  return usage ? usage.dailyConversionCount : 0;
}

testRealConversionFlow();