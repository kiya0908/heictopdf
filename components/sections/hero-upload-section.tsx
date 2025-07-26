"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { FileUp, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserArrowLeftIcon } from "@/assets";
import { Button } from "@/components/ui/button";
import HeicUploader from "@/components/upload/heic-uploader";
import ConversionProgress, { ConversionResult } from "@/components/conversion/conversion-progress";

export default function HeroUploadSection() {
  const t = useTranslations("IndexPage");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertingFiles, setConvertingFiles] = useState<File[]>([]);
  const [completedConversions, setCompletedConversions] = useState<ConversionResult[]>([]);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const startConversion = () => {
    if (selectedFiles.length > 0) {
      setConvertingFiles([...selectedFiles]);
      setSelectedFiles([]);
    }
  };

  const handleConversionComplete = (result: ConversionResult) => {
    setCompletedConversions(prev => [...prev, result]);
    setConvertingFiles(prev => prev.slice(1)); // 移除已完成的文件
  };

  const handleConversionError = (error: string) => {
    console.error('Conversion error:', error);
    setConvertingFiles(prev => prev.slice(1)); // 移除失败的文件
  };

  return (
    <div className="container max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("upload.title")}</h2>
          <p className="text-muted-foreground">
            {t("upload.subtitle")}
          </p>
        </div>
        
        {/* 文件上传区域 */}
        <HeicUploader 
          onFilesSelected={handleFilesSelected}
          maxFiles={5}
          maxSize={10 * 1024 * 1024} // 10MB
        />
        
        {/* 转换按钮 */}
        {selectedFiles.length > 0 && (
          <div className="text-center">
            <SignedIn>
              <Button
                size="lg"
                className="gap-2"
                onClick={startConversion}
                disabled={convertingFiles.length > 0}
              >
                <FileUp className="h-4 w-4" />
                {t("action.generate")} ({selectedFiles.length})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="redirect">
                <Button
                  size="lg"
                  className="gap-2"
                >
                  <UserArrowLeftIcon className="mr-2 size-4" />
                  {t("action.login")}
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        )}

        {/* 转换进度显示 */}
        {convertingFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">转换进度</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {convertingFiles.map((file, index) => (
                <ConversionProgress
                  key={`${file.name}-${index}`}
                  file={file}
                  onConversionComplete={handleConversionComplete}
                  onConversionError={handleConversionError}
                />
              ))}
            </div>
          </div>
        )}

        {/* 完成的转换结果 */}
        {completedConversions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">转换完成</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {completedConversions.map((result, index) => (
                <div key={result.id} className="p-4 border rounded-lg bg-green-50">
                  <p className="font-medium">{result.originalFileName}</p>
                  <p className="text-sm text-gray-600">→ {result.convertedFileName}</p>
                  {result.downloadUrl && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = result.downloadUrl!;
                        link.download = result.convertedFileName || 'converted.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      下载 PDF
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}