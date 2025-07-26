import { NextRequest, NextResponse } from 'next/server';
import { convertApiClient } from '@/lib/convertapi';

export async function GET() {
  try {
    // 检查环境变量是否配置
    if (!process.env.CONVERTAPI_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CONVERTAPI_SECRET 环境变量未配置' 
        },
        { status: 500 }
      );
    }

    // 测试 ConvertAPI 连接
    // 由于我们没有实际文件来测试转换，我们创建一个简单的测试请求
    const testResponse = await fetch('https://v2.convertapi.com/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CONVERTAPI_SECRET}`,
        'Accept': 'application/json'
      }
    });

    if (testResponse.ok) {
      const userData = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'ConvertAPI 配置成功！',
        data: {
          secretConfigured: true,
          apiConnectionStatus: 'connected',
          userInfo: {
            secsLeft: userData.SecsLeft || 'N/A',
            // 不暴露敏感信息
          }
        }
      });
    } else {
      const errorData = await testResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `ConvertAPI 连接失败: ${testResponse.status} ${testResponse.statusText}`,
        details: errorData
      }, { status: 400 });
    }

  } catch (error) {
    console.error('ConvertAPI 测试错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 这是一个简单的转换测试，使用最小的测试参数
    const testResponse = await fetch('https://v2.convertapi.com/convert/txt/to/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CONVERTAPI_SECRET}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Parameters: [
          {
            Name: 'File',
            FileValue: {
              Name: 'test.txt',
              Data: Buffer.from('ConvertAPI 测试', 'utf8').toString('base64')
            }
          },
          {
            Name: 'StoreFile',
            Value: true
          }
        ]
      })
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'ConvertAPI 转换测试成功！',
        data: {
          conversionCost: result.ConversionCost,
          filesGenerated: result.Files?.length || 0,
          // 不返回实际的下载链接，只测试功能
          testCompleted: true
        }
      });
    } else {
      const errorData = await testResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `转换测试失败: ${testResponse.status} ${testResponse.statusText}`,
        details: errorData
      }, { status: 400 });
    }

  } catch (error) {
    console.error('ConvertAPI 转换测试错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `转换测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
      },
      { status: 500 }
    );
  }
}