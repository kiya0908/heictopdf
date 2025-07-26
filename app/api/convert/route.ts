/**
 * HEIC to PDF 转换 API 接口
 * POST /api/convert
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convertApiClient, ConvertApiClient } from '@/lib/convertapi';
import { UsageLimitManager } from '@/lib/usage-limits';
import { prisma } from '@/db/prisma';

export async function POST(request: NextRequest) {
  try {
    // 1. 用户认证检查
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to convert files.' },
        { status: 401 }
      );
    }

    // 2. 检查请求格式
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Please upload a file.' },
        { status: 400 }
      );
    }

    // 3. 解析上传的文件
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please select a HEIC file.' },
        { status: 400 }
      );
    }

    // 4. 文件格式验证
    if (!ConvertApiClient.isSupportedFormat(file.name)) {
      return NextResponse.json(
        { 
          error: 'Unsupported file format. Please upload a HEIC or HEIF file.',
          supportedFormats: ['.heic', '.HEIC', '.heif', '.HEIF']
        },
        { status: 400 }
      );
    }

    // 5. 文件大小验证
    if (!UsageLimitManager.isFileSizeValid(file.size)) {
      const maxSizeMB = UsageLimitManager.getMaxFileSize() / (1024 * 1024);
      return NextResponse.json(
        { 
          error: `File size exceeds limit. Maximum allowed size is ${maxSizeMB}MB.`,
          maxSize: maxSizeMB,
          currentSize: Math.round(file.size / (1024 * 1024) * 100) / 100
        },
        { status: 400 }
      );
    }

    // 6. 检查用户转换限制
    const usageCheck = await UsageLimitManager.canUserConvert(userId);
    if (!usageCheck.canConvert) {
      return NextResponse.json(
        {
          error: 'Daily conversion limit exceeded.',
          limit: {
            remainingConversions: usageCheck.remainingConversions,
            isPremium: usageCheck.isPremium,
            resetTime: usageCheck.resetTime
          }
        },
        { status: 429 }
      );
    }

    // 7. 创建转换记录
    const conversionRecord = await prisma.conversionHistory.create({
      data: {
        userId,
        originalFileName: file.name,
        originalFileSize: file.size,
        status: 'pending'
      }
    });

    try {
      // 8. 执行文件转换
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const convertResult = await convertApiClient.convertHeicToPdf(
        fileBuffer,
        file.name
      );

      // 9. 更新转换记录为成功
      const updatedRecord = await prisma.conversionHistory.update({
        where: { id: conversionRecord.id },
        data: {
          status: 'completed',
          convertedFileName: convertResult.Files[0]?.FileName,
          downloadUrl: convertResult.Files[0]?.Url,
          urlExpiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3小时后过期
          conversionCost: convertResult.ConversionCost
        }
      });

      // 10. 记录用户使用次数
      await UsageLimitManager.recordConversion(userId);

      // 11. 返回成功结果
      return NextResponse.json({
        success: true,
        conversion: {
          id: updatedRecord.id,
          originalFileName: updatedRecord.originalFileName,
          convertedFileName: updatedRecord.convertedFileName,
          downloadUrl: updatedRecord.downloadUrl,
          urlExpiresAt: updatedRecord.urlExpiresAt,
          fileSize: convertResult.Files[0]?.FileSize
        },
        usage: {
          remainingConversions: usageCheck.remainingConversions - 1,
          isPremium: usageCheck.isPremium
        }
      });

    } catch (conversionError) {
      // 转换失败，更新记录
      await prisma.conversionHistory.update({
        where: { id: conversionRecord.id },
        data: {
          status: 'failed',
          errorMessage: conversionError instanceof Error ? conversionError.message : 'Unknown error'
        }
      });

      console.error('Conversion failed:', conversionError);
      
      return NextResponse.json(
        {
          error: 'File conversion failed. Please try again or contact support.',
          details: conversionError instanceof Error ? conversionError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 获取用户转换历史
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 获取转换历史
    const [conversions, total] = await Promise.all([
      prisma.conversionHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          originalFileName: true,
          convertedFileName: true,
          downloadUrl: true,
          urlExpiresAt: true,
          status: true,
          createdAt: true,
          originalFileSize: true
        }
      }),
      prisma.conversionHistory.count({
        where: { userId }
      })
    ]);

    // 获取用户使用情况
    const usageInfo = await UsageLimitManager.canUserConvert(userId);

    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      usage: usageInfo
    });

  } catch (error) {
    console.error('Get conversions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion history' },
      { status: 500 }
    );
  }
}