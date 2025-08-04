const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugConversionCount() {
  const testUserId = 'debug_user_' + Date.now();
  
  console.log('🔍 调试转换次数计算...');
  console.log('测试用户ID:', testUserId);

  try {
    // 1. 检查初始状态
    console.log('\n1. 检查初始状态...');
    let usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('初始usage记录:', usage);

    // 2. 创建初始记录
    console.log('\n2. 创建初始记录...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.userConversionUsage.create({
      data: {
        userId: testUserId,
        dailyConversionCount: 0,
        lastConversionDate: today,
      },
    });
    
    usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('创建后的usage记录:', usage);

    // 3. 增加转换次数
    console.log('\n3. 增加转换次数...');
    await prisma.userConversionUsage.update({
      where: { userId: testUserId },
      data: {
        dailyConversionCount: { increment: 1 },
        lastConversionDate: today,
      },
    });
    
    usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('增加1次后的usage记录:', usage);

    // 4. 再增加几次
    for (let i = 2; i <= 5; i++) {
      await prisma.userConversionUsage.update({
        where: { userId: testUserId },
        data: {
          dailyConversionCount: { increment: 1 },
        },
      });
      
      usage = await prisma.userConversionUsage.findUnique({
        where: { userId: testUserId }
      });
      console.log(`增加第${i}次后的usage记录:`, usage);
    }

    // 5. 测试日期重置逻辑
    console.log('\n5. 测试日期重置逻辑...');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    await prisma.userConversionUsage.update({
      where: { userId: testUserId },
      data: {
        lastConversionDate: yesterday, // 设置为昨天
      },
    });
    
    usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('设置为昨天后的记录:', usage);
    
    // 检查今天应该重置
    const lastConversionDate = usage.lastConversionDate;
    const shouldReset = !lastConversionDate || lastConversionDate < today;
    console.log('是否应该重置:', shouldReset);
    console.log('今天日期:', today);
    console.log('最后转换日期:', lastConversionDate);

  } catch (error) {
    console.error('调试过程中出错:', error);
  } finally {
    // 清理
    try {
      await prisma.userConversionUsage.deleteMany({
        where: { userId: testUserId }
      });
      console.log('\n✅ 测试数据已清理');
    } catch (e) {
      console.error('清理时出错:', e);
    }
    await prisma.$disconnect();
  }
}

debugConversionCount();