/**
 * HEIC to PDF 转换 API 接口
 * POST /api/convert
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convertApiClient, ConvertApiClient } from '@/lib/convertapi';
import { canUserConvert, incrementUserConversionCount } from '@/lib/subscription';
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
    const files: File[] = [];
    
    // 支持单文件或多文件上传
    for (const [key, value] of formData.entries()) {
      if (key === 'file' || key === 'files' || key.startsWith('file')) {
        if (value instanceof File) {
          files.push(value);
        }
      }
    }
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded. Please select HEIC files.' },
        { status: 400 }
      );
    }

    // 4. 批量文件格式验证
    const unsupportedFiles: string[] = [];
    for (const file of files) {
      if (!ConvertApiClient.isSupportedFormat(file.name)) {
        unsupportedFiles.push(file.name);
      }
    }
    
    if (unsupportedFiles.length > 0) {
      return NextResponse.json(
        { 
          error: `Unsupported file formats: ${unsupportedFiles.join(', ')}. Please upload only HEIC or HEIF files.`,
          supportedFormats: ['.heic', '.HEIC', '.heif', '.HEIF'],
          unsupportedFiles
        },
        { status: 400 }
      );
    }

    // 5. 检查用户转换限制和文件数量限制
    const conversionCheck = await canUserConvert(userId);
    
    // 检查转换次数限制
    if (!conversionCheck.canConvert) {
      return NextResponse.json(
        {
          error: conversionCheck.reason || 'Conversion not allowed',
          limit: {
            dailyCount: conversionCheck.dailyCount,
            isPro: conversionCheck.isPro,
            maxDaily: 10
          }
        },
        { status: 429 }
      );
    }

    // 检查文件数量限制（每次转换最多10个文件）
    const MAX_FILES_PER_CONVERSION = 10;
    if (files.length > MAX_FILES_PER_CONVERSION) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${MAX_FILES_PER_CONVERSION} files per conversion.`,
          maxFiles: MAX_FILES_PER_CONVERSION,
          providedFiles: files.length
        },
        { status: 400 }
      );
    }

    // 6. 批量文件大小验证
    const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
    const MAX_FILE_SIZE_PRO = 50 * 1024 * 1024;  // 50MB
    const maxFileSize = conversionCheck.isPro ? MAX_FILE_SIZE_PRO : MAX_FILE_SIZE_FREE;
    
    const oversizedFiles: string[] = [];
    for (const file of files) {
      if (file.size > maxFileSize) {
        oversizedFiles.push(`${file.name} (${Math.round(file.size / (1024 * 1024) * 100) / 100}MB)`);
      }
    }
    
    if (oversizedFiles.length > 0) {
      const maxSizeMB = maxFileSize / (1024 * 1024);
      return NextResponse.json(
        { 
          error: `Files exceed size limit. Maximum allowed size is ${maxSizeMB}MB per file.`,
          maxSize: maxSizeMB,
          oversizedFiles,
          isPro: conversionCheck.isPro
        },
        { status: 400 }
      );
    }

    // 7. 批量创建转换记录
    const conversionRecords = await Promise.all(
      files.map(file => 
        prisma.conversionHistory.create({
          data: {
            userId,
            originalFileName: file.name,
            originalFileSize: file.size,
            status: 'pending'
          }
        })
      )
    );

    const results: any[] = [];
    const errors: any[] = [];

    try {
      // 8. 批量执行文件转换
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const record = conversionRecords[i];
        
        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const convertResult = await convertApiClient.convertHeicToPdf(
            fileBuffer,
            file.name
          );

          // 更新转换记录为成功
          const updatedRecord = await prisma.conversionHistory.update({
            where: { id: record.id },
            data: {
              status: 'completed',
              convertedFileName: convertResult.Files[0]?.FileName,
              downloadUrl: convertResult.Files[0]?.Url,
              urlExpiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3小时后过期
              conversionCost: convertResult.ConversionCost
            }
          });

          results.push({
            id: updatedRecord.id,
            originalFileName: updatedRecord.originalFileName,
            convertedFileName: updatedRecord.convertedFileName,
            downloadUrl: updatedRecord.downloadUrl,
            urlExpiresAt: updatedRecord.urlExpiresAt,
            fileSize: convertResult.Files[0]?.FileSize,
            status: 'completed'
          });

        } catch (conversionError) {
          // 单个文件转换失败，更新记录
          await prisma.conversionHistory.update({
            where: { id: record.id },
            data: {
              status: 'failed',
              errorMessage: conversionError instanceof Error ? conversionError.message : 'Unknown error'
            }
          });

          errors.push({
            id: record.id,
            originalFileName: file.name,
            error: conversionError instanceof Error ? conversionError.message : 'Unknown error',
            status: 'failed'
          });

          console.error(`Conversion failed for ${file.name}:`, conversionError);
        }
      }

      // 9. 记录用户使用次数 (仅免费用户，并且只计算一次转换)
      if (!conversionCheck.isPro) {
        await incrementUserConversionCount(userId);
      }

      // 10. 返回批量转换结果
      return NextResponse.json({
        success: true,
        totalFiles: files.length,
        successfulConversions: results.length,
        failedConversions: errors.length,
        conversions: results,
        errors: errors,
        usage: {
          dailyCount: conversionCheck.isPro ? 0 : conversionCheck.dailyCount + 1,
          isPro: conversionCheck.isPro,
          maxDaily: 10
        }
      });

    } catch (error) {
      // 批量转换过程中的系统错误
      console.error('Batch conversion error:', error);
      
      // 将所有记录标记为失败
      await Promise.all(
        conversionRecords.map(record =>
          prisma.conversionHistory.update({
            where: { id: record.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'System error during batch conversion'
            }
          })
        )
      );
      
      return NextResponse.json(
        {
          error: 'Batch conversion failed. Please try again later.',
          details: error instanceof Error ? error.message : 'Unknown error',
          totalFiles: files.length,
          failedConversions: files.length
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
    let usageInfo;
    try {
      usageInfo = await canUserConvert(userId);
    } catch (usageError) {
      console.error('Error getting user usage info:', usageError);
      // 提供默认值，避免阻塞历史记录查询
      usageInfo = {
        canConvert: true,
        dailyCount: 0,
        isPro: false,
        maxDaily: 10
      };
    }

    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      usage: {
        canConvert: usageInfo.canConvert,
        dailyCount: usageInfo.dailyCount,
        isPro: usageInfo.isPro,
        maxDaily: 10
      }
    });

  } catch (error) {
    console.error('Get conversions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion history' },
      { status: 500 }
    );
  }
}