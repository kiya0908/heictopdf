/**
 * 获取Creem产品列表和搜索产品
 */

require('dotenv').config();

async function searchCreemProducts() {
  console.log('🔍 搜索Creem可用产品...');
  
  const config = {
    apiKey: process.env.CREEM_API_KEY,
    baseUrl: process.env.CREEM_API_BASE_URL || 'https://test-api.creem.io/v1',
  };
  
  console.log('📋 API配置:', {
    apiKey: config.apiKey ? `${config.apiKey.slice(0, 15)}...` : 'MISSING',
    baseUrl: config.baseUrl,
  });
  
  // 尝试多个端点获取产品列表
  const endpoints = [
    '/products',
    '/bundles', 
    '/catalog',
    '/items',
    '/offerings',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 尝试端点: ${config.baseUrl}${endpoint}`);
    
    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        }
      });
      
      console.log(`📄 响应: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('✅ 成功获取数据:');
        
        try {
          const data = JSON.parse(responseText);
          console.log('📋 产品数据:', JSON.stringify(data, null, 2));
          
          // 如果是数组，显示产品ID列表
          if (Array.isArray(data)) {
            console.log('🏷️ 找到的产品ID列表:');
            data.forEach((item, index) => {
              console.log(`  ${index + 1}. ${item.id || item._id || item.product_id} - ${item.name || item.title || '未知名称'}`);
            });
          } else if (data.products) {
            console.log('🏷️ 产品列表:');
            data.products.forEach((item, index) => {
              console.log(`  ${index + 1}. ${item.id || item._id} - ${item.name || item.title}`);
            });
          } else if (data.id) {
            console.log('🏷️ 单个产品:', data.id);
          }
          
          break; // 找到有效端点，停止尝试
        } catch (e) {
          console.log('⚠️ JSON解析失败:', responseText.slice(0, 200));
        }
      } else {
        console.log(`❌ 失败响应:`, responseText.slice(0, 200));
      }
    } catch (error) {
      console.error(`❌ 网络错误:`, error.message);
    }
  }
  
  // 尝试搜索端点
  console.log(`\n🔍 尝试搜索端点...`);
  const searchEndpoints = [
    '/search/products',
    '/products/search', 
    '/search',
  ];
  
  for (const endpoint of searchEndpoints) {
    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        }
      });
      
      console.log(`📄 ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`📋 搜索结果:`, data.slice(0, 300));
      }
    } catch (error) {
      console.log(`❌ ${endpoint} 错误:`, error.message);
    }
  }
  
  console.log('\n💡 建议:');
  console.log('1. 检查Creem管理后台，确认产品ID是否正确');
  console.log('2. 检查是否在正确的环境（测试 vs 生产）');
  console.log('3. 联系Creem技术支持获取正确的产品ID');
}

searchCreemProducts().catch(console.error);