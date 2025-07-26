/**
 * ConvertAPI 客户端封装
 * 用于 HEIC 到 PDF 的转换服务
 */

export interface ConvertApiResponse {
  ConversionCost: number;
  Files: Array<{
    FileName: string;
    FileSize: number;
    Url: string;
  }>;
}

export interface ConvertApiError {
  Code: number;
  Message: string;
  InvalidParameter?: string;
}

export class ConvertApiClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://v2.convertapi.com';

  constructor() {
    this.apiKey = process.env.CONVERTAPI_SECRET!;
    if (!this.apiKey) {
      throw new Error('CONVERTAPI_SECRET environment variable is required');
    }
  }

  /**
   * 将 HEIC 文件转换为 PDF
   * @param fileBuffer HEIC 文件的 Buffer 数据
   * @param fileName 原始文件名
   * @returns 转换结果，包含下载链接
   */
  async convertHeicToPdf(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ConvertApiResponse> {
    try {
      // 将 Buffer 转换为 base64
      const base64Data = fileBuffer.toString('base64');

      const requestBody = {
        Parameters: [
          {
            Name: 'File',
            FileValue: {
              Name: fileName,
              Data: base64Data
            }
          },
          {
            Name: 'StoreFile',
            Value: true // 启用临时存储，获得3小时有效的下载链接
          }
        ]
      };

      const response = await fetch(`${this.baseUrl}/convert/heic/to/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `ConvertAPI request failed: ${response.status} ${response.statusText}. ${
            errorData.Message || ''
          }`
        );
      }

      const result: ConvertApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('ConvertAPI Error:', error);
      throw error;
    }
  }

  /**
   * 检查文件是否为支持的 HEIC 格式
   * @param fileName 文件名
   * @returns 是否支持
   */
  static isSupportedFormat(fileName: string): boolean {
    const supportedExtensions = ['.heic', '.HEIC', '.heif', '.HEIF'];
    return supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext.toLowerCase()));
  }

  /**
   * 检查文件大小是否在限制范围内
   * @param fileSize 文件大小（字节）
   * @param maxSize 最大允许大小（字节），默认 10MB
   * @returns 是否在限制范围内
   */
  static isFileSizeValid(fileSize: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return fileSize > 0 && fileSize <= maxSize;
  }
}

// 导出单例实例
export const convertApiClient = new ConvertApiClient();