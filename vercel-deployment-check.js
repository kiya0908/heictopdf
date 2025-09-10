// 部署后验证脚本 - 在浏览器控制台运行
console.log('🚀 Vercel部署验证清单');
console.log('==================');

// 1. 检查环境变量
const checkEnvVars = () => {
  const requiredVars = [
    'NEXT_PUBLIC_CREEM_MONTHLY_PRODUCT_ID',
    'NEXT_PUBLIC_CREEM_YEARLY_PRODUCT_ID', 
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  console.log('1️⃣ 环境变量检查:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`  ${varName}: ${value ? '✅ 已配置' : '❌ 缺失'}`);
  });
};

// 2. 检查页面加载
const checkPageLoad = () => {
  console.log('2️⃣ 页面加载检查:');
  console.log(`  当前URL: ${window.location.href}`);
  console.log(`  标题: ${document.title}`);
  console.log('  Creem按钮存在:', document.querySelector('[data-testid="creem-button"]') ? '✅' : '❌');
};

// 3. 网络请求测试
const testCreemAPI = async () => {
  console.log('3️⃣ Creem API测试:');
  try {
    const response = await fetch('/api/creem-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        planType: 'monthly',
        userId: 'test_user_' + Date.now() 
      })
    });
    
    console.log(`  API状态: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ API调用成功');
      console.log('  响应数据:', data);
    } else {
      console.log('  ❌ API调用失败');
      const error = await response.text();
      console.log('  错误信息:', error);
    }
  } catch (error) {
    console.log('  ❌ 网络错误:', error.message);
  }
};

// 运行所有检查
const runAllChecks = async () => {
  checkEnvVars();
  checkPageLoad();
  await testCreemAPI();
  
  console.log('');
  console.log('🎯 下一步:');
  console.log('1. 如果所有检查通过，点击Creem支付按钮测试');
  console.log('2. 如果有错误，检查Vercel环境变量配置');
  console.log('3. 确认Creem Dashboard中的域名配置');
};

// 导出到全局，方便调用
window.vercelCheck = runAllChecks;

console.log('💡 使用方法: 在浏览器控制台运行 vercelCheck()');