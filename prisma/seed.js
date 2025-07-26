// This script helps seed initial data for the ChargeProduct table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create some sample charge products
    const products = [
      {
        amount: 999,
        name: 'Basic Plan',
        description: 'Perfect for individuals',
        locale: 'en',
        currency: 'USD',
        features: JSON.stringify(['10 conversions/day', 'Standard quality', 'Email support'])
      },
      {
        amount: 1999,
        name: 'Pro Plan',
        description: 'Ideal for professionals',
        locale: 'en',
        currency: 'USD',
        features: JSON.stringify(['50 conversions/day', 'High quality', 'Priority support'])
      },
      {
        amount: 4999,
        name: 'Business Plan',
        description: 'For teams and businesses',
        locale: 'en',
        currency: 'USD',
        features: JSON.stringify(['Unlimited conversions', 'Premium quality', '24/7 support', 'API access'])
      },
      // Chinese versions
      {
        amount: 999,
        name: '基础套餐',
        description: '适合个人用户',
        locale: 'zh',
        currency: 'CNY',
        features: JSON.stringify(['每天10次转换', '标准质量', '电子邮件支持'])
      },
      {
        amount: 1999,
        name: '专业套餐',
        description: '适合专业人士',
        locale: 'zh',
        currency: 'CNY',
        features: JSON.stringify(['每天50次转换', '高质量', '优先支持'])
      },
      {
        amount: 4999,
        name: '企业套餐',
        description: '适合团队和企业',
        locale: 'zh',
        currency: 'CNY',
        features: JSON.stringify(['无限转换', '优质质量', '24/7支持', 'API访问'])
      }
    ];

    console.log('Seeding ChargeProduct data...');
    
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