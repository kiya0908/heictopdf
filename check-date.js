const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDateIssue() {
  console.log('🔍 检查日期问题...\n');

  const testUserId = 'date_test_' + Date.now();
  
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('JavaScript 当前时间:', now);
    console.log('JavaScript 今天0点:', today);
    console.log('时区偏移 (分钟):', now.getTimezoneOffset());
    
    // 创建记录
    const usage = await prisma.userConversionUsage.create({
      data: {
        userId: testUserId,
        dailyConversionCount: 5,
        lastConversionDate: today,
      },
    });
    
    console.log('\n数据库中存储的记录:');
    console.log('lastConversionDate:', usage.lastConversionDate);
    console.log('createdAt:', usage.createdAt);
    
    // 比较日期
    const storedDate = usage.lastConversionDate;
    console.log('\n日期比较:');
    console.log('stored < today:', storedDate < today);
    console.log('stored === today:', storedDate.getTime() === today.getTime());
    console.log('stored > today:', storedDate > today);
    
    console.log('\n转换为本地字符串:');
    console.log('stored:', storedDate.toLocaleDateString());
    console.log('today:', today.toLocaleDateString());
    
    // 测试 UTC vs 本地时间
    const utcToday = new Date();
    utcToday.setUTCHours(0, 0, 0, 0);
    console.log('\nUTC今天0点:', utcToday);
    console.log('stored < utcToday:', storedDate < utcToday);
    
  } catch (error) {
    console.error('检查错误:', error);
  } finally {
    await prisma.userConversionUsage.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.$disconnect();
  }
}

checkDateIssue();