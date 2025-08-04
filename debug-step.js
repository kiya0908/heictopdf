const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStepByStep() {
  console.log('🔍 逐步调试转换计数问题...\n');

  const testUserId = 'debug_step_' + Date.now();
  console.log(`测试用户: ${testUserId}`);

  try {
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    console.log('今天UTC日期:', todayUTC);

    // 第1步：首次调用getUserConversionUsage
    console.log('\n--- 第1步：首次调用 getUserConversionUsage ---');
    
    let usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('数据库查询结果(首次):', usage);
    
    if (!usage) {
      console.log('没有记录，创建初始记录...');
      usage = await prisma.userConversionUsage.create({
        data: {
          userId: testUserId,
          dailyConversionCount: 0,
          lastConversionDate: todayUTC,
        },
      });
      console.log('创建的记录:', usage);
    }

    // 第2步：调用incrementUserConversionCount
    console.log('\n--- 第2步：调用 incrementUserConversionCount ---');
    
    const beforeIncrement = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('增加前记录:', beforeIncrement);
    
    await prisma.userConversionUsage.update({
      where: { userId: testUserId },
      data: {
        dailyConversionCount: { increment: 1 },
        lastConversionDate: todayUTC,
      },
    });
    
    const afterIncrement = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('增加后记录:', afterIncrement);

    // 第3步：再次调用getUserConversionUsage
    console.log('\n--- 第3步：再次调用 getUserConversionUsage ---');
    
    usage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('数据库查询结果(第二次):', usage);
    
    const lastConversionDate = usage.lastConversionDate;
    console.log('最后转换日期:', lastConversionDate);
    console.log('今天UTC日期:', todayUTC);
    
    if (lastConversionDate) {
      const lastDateUTC = new Date(lastConversionDate.getUTCFullYear(), lastConversionDate.getUTCMonth(), lastConversionDate.getUTCDate());
      console.log('转换后的最后日期UTC:', lastDateUTC);
      console.log('日期比较结果:', lastDateUTC.getTime() < todayUTC.getTime());
      console.log('日期是否相等:', lastDateUTC.getTime() === todayUTC.getTime());
      
      if (lastDateUTC.getTime() < todayUTC.getTime()) {
        console.log('⚠️ 日期比较判断为新的一天，将会重置计数!');
        await prisma.userConversionUsage.update({
          where: { userId: testUserId },
          data: {
            dailyConversionCount: 0,
            lastConversionDate: todayUTC,
          },
        });
        console.log('已重置计数为0');
      } else {
        console.log('✅ 日期相同，不会重置计数');
      }
    }

    const finalUsage = await prisma.userConversionUsage.findUnique({
      where: { userId: testUserId }
    });
    console.log('最终记录:', finalUsage);

  } catch (error) {
    console.error('调试错误:', error);
  } finally {
    await prisma.userConversionUsage.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
    console.log('\n🧹 清理完成');
  }
}

debugStepByStep();