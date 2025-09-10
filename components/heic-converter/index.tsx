"use client";

import React, { useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Download, FileImage, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatFileSize } from "@/lib/utils";
import { PricingCardDialog } from "@/components/pricing-cards";
import { ChargeProductSelectDto } from "@/db/type";

interface ConversionFile {
  file: File;
  id: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  downloadUrl?: string;
  convertedFileName?: string;
  error?: string;
  progress?: number;
}

interface ConversionResult {
  success: boolean;
  conversion?: {
    id: string;
    originalFileName: string;
    convertedFileName: string;
    downloadUrl: string;
    urlExpiresAt: string;
    fileSize: number;
  };
  error?: string;
  usage?: {
    dailyCount: number;
    isPro: boolean;
  };
}

export default function HeicConverter({
  locale,
  chargeProduct,
}: {
  locale: string;
  chargeProduct?: ChargeProductSelectDto[];
}) {
  const [files, setFiles] = useState<ConversionFile[]>([]);
  const [pricingCardOpen, setPricingCardOpen] = useState(false);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const t = useTranslations("HeicConverter");

  // 获取用户使用情况
  const { data: usageData } = useQuery({
    queryKey: ["conversion-usage"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/convert", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch usage data");
      return res.json();
    },
  });

  // 转换文件的 mutation
  const convertMutation = useMutation({
    mutationFn: async (file: File): Promise<ConversionResult> => {
      const formData = new FormData();
      formData.append("file", file);

      const token = await getToken();
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.json();
    },
    onSuccess: (result, file) => {
      if (result.success && result.conversion) {
        setFiles(prev => prev.map(f => 
          f.file === file ? {
            ...f,
            status: 'completed',
            downloadUrl: result.conversion!.downloadUrl,
            convertedFileName: result.conversion!.convertedFileName,
            progress: 100
          } : f
        ));
        toast.success(t("status.conversionComplete"));
        queryClient.invalidateQueries({ queryKey: ["conversion-usage"] });
      } else {
        setFiles(prev => prev.map(f => 
          f.file === file ? {
            ...f,
            status: 'failed',
            error: result.error || t("status.conversionFailed"),
            progress: 0
          } : f
        ));
        
        if (result.error?.includes("limit") || result.error?.includes("not allowed")) {
          setPricingCardOpen(true);
        }
        
        toast.error(result.error || t("status.conversionFailed"));
      }
    },
    onError: (error, file) => {
      setFiles(prev => prev.map(f => 
        f.file === file ? {
          ...f,
          status: 'failed',
          error: t("status.networkError"),
          progress: 0
        } : f
      ));
      toast.error(t("status.networkError"));
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: ConversionFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // 开始转换
    newFiles.forEach(fileObj => {
      setFiles(prev => prev.map(f => 
        f.id === fileObj.id ? { ...f, status: 'converting', progress: 10 } : f
      ));
      
      convertMutation.mutate(fileObj.file);
    });
  }, [convertMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/heic': ['.heic', '.HEIC'],
      'image/heif': ['.heif', '.HEIF'],
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadFile = (downloadUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const retryConversion = (fileObj: ConversionFile) => {
    setFiles(prev => prev.map(f => 
      f.id === fileObj.id ? { ...f, status: 'converting', progress: 10, error: undefined } : f
    ));
    convertMutation.mutate(fileObj.file);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <p className="text-muted-foreground text-center">
            {t("subtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 使用情况显示 */}
          {usageData?.usage && !usageData.usage.isPro && (
            <Alert>
              <AlertDescription>
                {t("usage.dailyUsage", {
                  current: usageData.usage.dailyCount,
                  total: 10
                })}
                {usageData.usage.dailyCount >= 10 && (
                  <Button 
                    variant="link" 
                    className="p-0 ml-2" 
                    onClick={() => setPricingCardOpen(true)}
                  >
                    {t("usage.upgradeButton")}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 文件上传区域 */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? t("upload.dragActive") : t("upload.dragInactive")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("upload.clickToSelect")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("upload.supportedFormats")}
            </p>
          </div>

          {/* 文件列表 */}
          {files.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold">{t("queue.title")}</h3>
              
              {files.map((fileObj) => (
                <Card key={fileObj.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <FileImage className="h-10 w-10 text-muted-foreground" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fileObj.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      
                      {/* 进度条 */}
                      {fileObj.status === 'converting' && (
                        <div className="mt-2">
                          <Progress value={fileObj.progress} className="w-full" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("status.converting", { progress: fileObj.progress })}
                          </p>
                        </div>
                      )}
                      
                      {/* 错误信息 */}
                      {fileObj.error && (
                        <p className="text-sm text-destructive mt-1">
                          {fileObj.error}
                        </p>
                      )}
                    </div>

                    {/* 状态标识 */}
                    <div className="flex items-center space-x-2">
                      {fileObj.status === 'pending' && (
                        <Badge variant="secondary">{t("status.pending")}</Badge>
                      )}
                      {fileObj.status === 'converting' && (
                        <Badge variant="secondary">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {t("status.converting")}
                        </Badge>
                      )}
                      {fileObj.status === 'completed' && (
                        <>
                          <Badge variant="default">{t("status.completed")}</Badge>
                          <Button
                            size="sm"
                            onClick={() => downloadFile(fileObj.downloadUrl!, fileObj.convertedFileName!)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {t("actions.download")}
                          </Button>
                        </>
                      )}
                      {fileObj.status === 'failed' && (
                        <>
                          <Badge variant="destructive">{t("status.failed")}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryConversion(fileObj)}
                          >
                            {t("actions.retry")}
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileObj.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 定价对话框 */}
      <PricingCardDialog
        onClose={setPricingCardOpen}
        isOpen={pricingCardOpen}
        chargeProduct={chargeProduct}
      />
    </div>
  );
}