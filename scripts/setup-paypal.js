// PayPal产品和订阅计划创建脚本
const fs = require('fs');
const path = require('path');

// ⚠️ 请设置环境变量或在.env文件中配置：
const PAYPAL_CONFIG = {
  CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  ENVIRONMENT: 'sandbox',
  API_BASE: 'https://api-m.sandbox.paypal.com'
};

// 获取PayPal访问令牌
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_CONFIG.API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`获取访问令牌失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 创建产品
async function createProduct(accessToken) {
  const productData = {
    name: 'HEIC to PDF Pro Subscription',
    description: 'Professional HEIC to PDF conversion service with unlimited conversions and premium features',
    type: 'SERVICE',
    category: 'SOFTWARE',
  };

  const response = await fetch(`${PAYPAL_CONFIG.API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建产品失败: ${response.statusText}\n${errorText}`);
  }

  return await response.json();
}

// 创建订阅计划
async function createPlan(accessToken, productId, planName, interval, amount) {
  const planData = {
    product_id: productId,
    name: planName,
    description: `HEIC to PDF Pro ${interval === 'MONTH' ? 'Monthly' : 'Yearly'} Subscription`,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: {
          interval_unit: interval,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = 无限续订
        pricing_scheme: {
          fixed_price: {
            value: amount.toString(),
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
    taxes: {
      percentage: '0',
      inclusive: false,
    },
  };

  const response = await fetch(`${PAYPAL_CONFIG.API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'PayPal-Request-Id': `${planName}-${Date.now()}`, // 防重复
    },
    body: JSON.stringify(planData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`创建计划失败: ${response.statusText}\n${errorText}`);
  }

  return await response.json();
}

// 更新环境变量文件
function updateEnvFile(monthlyPlanId, yearlyPlanId) {
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新环境变量
  envContent = envContent.replace(
    /PAYPAL_CLIENT_ID=.*/,
    `PAYPAL_CLIENT_ID=${PAYPAL_CONFIG.CLIENT_ID}`
  );
  envContent = envContent.replace(
    /PAYPAL_CLIENT_SECRET=.*/,
    `PAYPAL_CLIENT_SECRET=${PAYPAL_CONFIG.CLIENT_SECRET}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_PAYPAL_CLIENT_ID=.*/,
    `NEXT_PUBLIC_PAYPAL_CLIENT_ID=${PAYPAL_CONFIG.CLIENT_ID}`
  );
  envContent = envContent.replace(
    /PAYPAL_PRO_MONTHLY_USD_PLAN_ID=.*/,
    `PAYPAL_PRO_MONTHLY_USD_PLAN_ID=${monthlyPlanId}`
  );
  envContent = envContent.replace(
    /PAYPAL_PRO_YEARLY_USD_PLAN_ID=.*/,
    `PAYPAL_PRO_YEARLY_USD_PLAN_ID=${yearlyPlanId}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_PAYPAL_PRO_MONTHLY_USD_PLAN_ID=.*/,
    `NEXT_PUBLIC_PAYPAL_PRO_MONTHLY_USD_PLAN_ID=${monthlyPlanId}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_PAYPAL_PRO_YEARLY_USD_PLAN_ID=.*/,
    `NEXT_PUBLIC_PAYPAL_PRO_YEARLY_USD_PLAN_ID=${yearlyPlanId}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ 环境变量文件已更新');
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始创建PayPal产品和订阅计划...\n');
    
    // 验证配置
    if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
      console.error('❌ 请先设置 PAYPAL_CLIENT_ID 和 PAYPAL_CLIENT_SECRET 环境变量');
      console.log('   或在 .env.local 文件中配置这些值');
      return;
    }
    
    console.log('1️⃣ 获取PayPal访问令牌...');
    const accessToken = await getAccessToken();
    console.log('✅ 获取访问令牌成功\n');
    
    console.log('2️⃣ 创建产品...');
    const product = await createProduct(accessToken);
    console.log(`✅ 产品创建成功: ${product.id}`);
    console.log(`   产品名称: ${product.name}\n`);
    
    console.log('3️⃣ 创建月付计划...');
    const monthlyPlan = await createPlan(
      accessToken,
      product.id,
      'HEIC to PDF Pro Monthly',
      'MONTH',
      7.00
    );
    console.log(`✅ 月付计划创建成功: ${monthlyPlan.id}\n`);
    
    console.log('4️⃣ 创建年付计划...');
    const yearlyPlan = await createPlan(
      accessToken,
      product.id,
      'HEIC to PDF Pro Yearly',
      'YEAR',
      69.00
    );
    console.log(`✅ 年付计划创建成功: ${yearlyPlan.id}\n`);
    
    console.log('5️⃣ 更新环境变量...');
    updateEnvFile(monthlyPlan.id, yearlyPlan.id);
    
    console.log('\n🎉 所有配置完成！');
    console.log('=====================================');
    console.log('📋 创建结果汇总:');
    console.log(`产品ID: ${product.id}`);
    console.log(`月付计划ID: ${monthlyPlan.id}`);
    console.log(`年付计划ID: ${yearlyPlan.id}`);
    console.log('=====================================');
    console.log('\n🔄 请重启开发服务器以加载新的环境变量');
    
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    console.log('\n🔍 常见问题:');
    console.log('1. 检查Client ID和Client Secret是否正确');
    console.log('2. 确保PayPal账户是Business类型');
    console.log('3. 检查网络连接');
  }
}

// 运行脚本
main();