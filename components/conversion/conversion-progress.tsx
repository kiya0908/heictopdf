"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// import { useTranslations } from 'next-intl';

export interface ConversionResult {
  id: number;
  originalFileName: string;
  convertedFileName?: string;
  downloadUrl?: string;
  urlExpiresAt?: string;
  fileSize?: number;
}

interface ConversionProgressProps {
  file: File;
  onConversionComplete?: (result: ConversionResult) => void;
  onConversionError?: (error: string) => void;
}

export default function ConversionProgress({
  file,
  onConversionComplete,
  onConversionError
}: ConversionProgressProps) {
  // const t = useTranslations('Conversion');
  const [status, setStatus] = useState<'uploading' | 'converting' | 'completed' | 'error'>('uploading');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    convertFile();
  }, [file]);

  // 计算剩余时间显示
  useEffect(() => {
    if (result?.urlExpiresAt) {
      const updateTimeRemaining = () => {
        const expiresAt = new Date(result.urlExpiresAt!);
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('已过期');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}小时${minutes}分钟后过期`);
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // 每分钟更新
      return () => clearInterval(interval);
    }
  }, [result?.urlExpiresAt]);

  const convertFile = async () => {
    try {
      setStatus('uploading');
      setProgress(20);

      const formData = new FormData();
      formData.append('file', file);

      setStatus('converting');
      setProgress(60);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setProgress(100);
      setStatus('completed');
      setResult(data.conversion);
      onConversionComplete?.(data.conversion);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStatus('error');
      onConversionError?.(errorMessage);
    }
  };

  const downloadFile = () => {
    if (result?.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.convertedFileName || 'converted.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 文件信息 */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {status === 'completed' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : status === 'error' ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          {status !== 'completed' && status !== 'error' && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {status === 'uploading' ? '上传中...' : '转换中...'}
              </p>
            </div>
          )}

          {/* 成功状态 */}
          {status === 'completed' && result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-green-800">转换成功！</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  转换后文件: {result.convertedFileName}
                </p>
                {result.fileSize && (
                  <p className="text-sm text-gray-600">
                    文件大小: {formatFileSize(result.fileSize)}
                  </p>
                )}
                {timeRemaining && (
                  <div className="flex items-center text-sm text-amber-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {timeRemaining}
                  </div>
                )}
              </div>

              <Button 
                onClick={downloadFile}
                className="w-full"
                disabled={!result.downloadUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                下载 PDF
              </Button>
            </div>
          )}

          {/* 错误状态 */}
          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-800">转换失败</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              
              <Button 
                onClick={convertFile}
                variant="outline"
                className="w-full"
              >
                重试
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}