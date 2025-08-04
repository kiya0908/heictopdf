"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { FileUp, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserArrowLeftIcon } from "@/assets";
import { Button } from "@/components/ui/button";
import HeicUploader from "@/components/upload/heic-uploader";
import BatchConversionProgress, { ConversionResult } from "@/components/conversion/conversion-progress";

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

  const handleBatchConversionComplete = (results: ConversionResult[]) => {
    setCompletedConversions(results);
    setConvertingFiles([]); // 清空转换中的文件
  };

  const handleBatchConversionError = (error: string) => {
    console.error('Batch conversion error:', error);
    setConvertingFiles([]); // 清空转换中的文件
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

        {/* 批量转换进度显示 */}
        {convertingFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">批量转换进度</h3>
            <BatchConversionProgress
              files={convertingFiles}
              onConversionComplete={handleBatchConversionComplete}
              onConversionError={handleBatchConversionError}
            />
          </div>
        )}

        {/* 完成的转换结果展示 */}
        {completedConversions.length > 0 && convertingFiles.length === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              转换完成 ({completedConversions.filter(r => r.status === 'completed').length}/{completedConversions.length})
            </h3>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setCompletedConversions([]);
                }}
              >
                开始新的转换
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}