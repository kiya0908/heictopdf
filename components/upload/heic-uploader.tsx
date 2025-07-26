"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, X, FileImage } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/lib/navigation";

interface HeicUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

export default function HeicUploader({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
}: HeicUploaderProps) {
  const t = useTranslations("IndexPage");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("");

      if (rejectedFiles.length > 0) {
        setError(t("upload.uploader.error_format"));
        return;
      }

      if (selectedFiles.length + acceptedFiles.length > maxFiles) {
        setError(t("upload.uploader.error_max_files", { maxFiles }));
        return;
      }

      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [selectedFiles, maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/heic": [".heic", ".HEIC"],
      "image/heif": [".heif", ".HEIF"],
    },
    maxSize,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          selectedFiles.length > 0 && "border-primary"
        )}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center">
          <div className="mx-auto mb-4">
            <FileUp className="h-12 w-12 text-primary/60 mx-auto" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive 
                ? t("upload.uploader.drag_active") 
                : t("upload.uploader.drag_inactive")
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("upload.uploader.supported_formats", { maxSize: formatFileSize(maxSize) })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("upload.uploader.max_files", { maxFiles })}
            </p>
          </div>
          <Button variant="outline" className="mt-4">
            <FileUp className="mr-2 h-4 w-4" />
            {t("upload.uploader.select_files")}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-medium">
            {t("upload.uploader.selected_files", { count: selectedFiles.length })}
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 服务条款和隐私政策说明 */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <p>
          {t.rich("upload.legal", {
            terms: (chunks) => (
              <Link
                href="/terms-of-use"
                className="underline hover:text-primary transition-colors"
              >
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link
                href="/privacy-policy"
                className="underline hover:text-primary transition-colors"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="mt-1">
          {t("upload.privacy_commitment")}
        </p>
      </div>
    </div>
  );
}