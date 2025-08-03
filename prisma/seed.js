// This script helps seed initial data for the ChargeProduct table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create HEIC to PDF conversion pricing tiers
    const products = [
      // Free tier - English
      {
        amount: 0,
        name: 'Free',
        description: 'Perfect for daily basic conversion needs, completely free.',
        locale: 'en',
        currency: 'USD',
        features: JSON.stringify([
          '5 files per conversion',
          '10 conversions per day',
          'Basic conversion speed',
          'Standard quality output',
          'Email support'
        ])
      },
      // Pro tier Monthly - English
      {
        amount: 700, // $7.00
        name: 'Pro',
        description: 'Unleash your productivity. Unlimited conversions, faster speed, cleaner experience.',
        locale: 'en',
        currency: 'USD',
        features: JSON.stringify([
          'Unlimited files per conversion',
          'Unlimited daily conversions',
          'Priority processing speed',
          'High quality output',
          'No ads',
          'Batch processing up to 50 files',
          'Priority email support',
          'All future premium features'
        ])
      },
      // Free tier - Chinese
      {
        amount: 0,
        name: '免费版',
        description: '满足您日常所有的基本转换需求，完全免费。',
        locale: 'zh',
        currency: 'CNY',
        features: JSON.stringify([
          '每次转换5个文件',
          '每天10次转换',
          '基础转换速度',
          '标准质量输出',
          '邮件支持'
        ])
      },
      // Pro tier Monthly - Chinese
      {
        amount: 4900, // ¥49.00
        name: '专业版',
        description: '解放您的生产力。无限转换，速度更快，体验更纯净。',
        locale: 'zh',
        currency: 'CNY',
        features: JSON.stringify([
          '每次转换无限文件',
          '无限每日转换次数',
          '优先处理速度',
          '高质量输出',
          '无广告体验',
          '批量处理最多50个文件',
          '优先邮件支持',
          '所有未来高级功能'
        ])
      }
    ];

    console.log('Seeding HEIC to PDF ChargeProduct data...');

    for (const product of products) {
      await prisma.chargeProduct.upsert({
        where: {
          name_locale: {
            name: product.name,
            locale: product.locale || 'en'
          }
        },
        update: product,
        create: product
      });
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();