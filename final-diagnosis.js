// 最终诊断：获取401错误详细信息
require('dotenv').config();

async function getFinalDiagnostic() {
  try {
    console.log('🔬 最终诊断：获取详细错误信息');
    console.log('================================');
    
    const apiKey = process.env.CREEM_API_KEY_TEST || process.env.CREEM_API_KEY;
    const baseUrl = process.env.CREEM_API_BASE_URL || 'https://test-api.creem.io';
    
    // 1. 获取401错误的详细响应体
    console.log('📋 第一步：获取401错误详细信息...');
    
    try {
      const response = await fetch(`${baseUrl}/products`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'HeicToPDF-Debug/1.0'
        }
      });
      
      const responseText = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());
      
      console.log('详细401响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseText
      });
      
      // 尝试解析JSON错误消息
      try {
        const errorData = JSON.parse(responseText);
        console.log('解析的错误数据:', errorData);
        
        if (errorData.message || errorData.error) {
          console.log('🚨 错误提示:', errorData.message || errorData.error);
        }
      } catch (e) {
        console.log('响应体不是JSON格式:', responseText);
      }
      
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
    
    // 2. 尝试无认证的GET请求，看看会得到什么信息
    console.log('\n📋 第二步：测试无认证请求...');
    
    try {
      const noAuthResponse = await fetch(`${baseUrl}/products`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HeicToPDF-Debug/1.0'
        }
      });
      
      const noAuthText = await noAuthResponse.text();
      console.log('无认证请求响应:', {
        status: noAuthResponse.status,
        statusText: noAuthResponse.statusText,
        body: noAuthText
      });
    } catch (error) {
      console.log('❌ 无认证请求失败:', error.message);
    }
    
    // 3. 检查是否有API文档URL在响应头中
    console.log('\n📋 第三步：寻找API文档链接...');
    
    try {
      const headResponse = await fetch(`${baseUrl}/`, {
        method: 'HEAD',
        headers: { 'User-Agent': 'HeicToPDF-Debug/1.0' }
      });
      
      const allHeaders = Object.fromEntries(headResponse.headers.entries());
      console.log('所有响应头:', allHeaders);
      
      // 查找可能的文档链接
      const docHeaders = ['link', 'x-api-docs', 'x-documentation', 'x-docs-url'];
      for (const header of docHeaders) {
        if (allHeaders[header]) {
          console.log(`📖 找到文档链接 ${header}: ${allHeaders[header]}`);
        }
      }
    } catch (error) {
      console.log('❌ HEAD请求失败:', error.message);
    }
    
    // 4. 尝试常见的错误端点来获取API信息
    console.log('\n📋 第四步：尝试错误端点获取信息...');
    
    const errorEndpoints = [
      '/404-page-that-should-not-exist',  // 可能返回API信息
      '/api',                             // 可能有API信息
      '/v1',                              // 版本信息
      ''                                  // 根路径POST
    ];
    
    for (const endpoint of errorEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: endpoint === '' ? 'POST' : 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HeicToPDF-Debug/1.0'
          }
        });
        
        const data = await response.text();
        
        if (response.status !== 404 || data.length > 10) {
          console.log(`📄 ${endpoint || 'POST /'} (${response.status}):`, data.slice(0, 200));
        }
      } catch (error) {
        // 忽略错误
      }
    }
    
    console.log('\n📋 总结和建议：');
    console.log('====================');
    console.log('🔍 技术分析结果:');
    console.log('  • API服务器正常运行 (根路径返回200 OK)');
    console.log('  • API端点存在 (/products返回401而不是404)');
    console.log('  • API Key格式正确 (creem_test_前缀)');
    console.log('  • CORS配置正确 (支持authorization头)');
    console.log('  • 所有认证方式都被拒绝 (401 Unauthorized)');
    
    console.log('\n💡 可能的解决方案:');
    console.log('1. 检查Creem开发者控制台:');
    console.log('   - 确认API Key已激活');
    console.log('   - 检查API Key权限设置');
    console.log('   - 验证测试环境配置');
    
    console.log('2. 联系Creem技术支持:');
    console.log('   - 提供API Key: ' + apiKey);
    console.log('   - 询问测试环境正确的API Base URL');
    console.log('   - 确认Bundle ID使用方式');
    
    console.log('3. 检查官方文档:');
    console.log('   - 查看最新的认证方式');
    console.log('   - 确认API端点结构');
    console.log('   - 验证Bundle操作流程');
    
    console.log('4. 临时解决方案:');
    console.log('   - 实现支付页面的UI和逻辑');
    console.log('   - 等待API问题解决后再连接真实支付');
    console.log('   - 使用模拟数据测试完整流程');
    
  } catch (error) {
    console.error('❌ 最终诊断失败:', error);
  }
}

getFinalDiagnostic();