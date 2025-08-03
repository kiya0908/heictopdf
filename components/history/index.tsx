"use client";

import React, { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import copy from "copy-to-clipboard";
import { debounce } from "lodash-es";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import qs from "query-string";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";
import Loading from "@/components/loading";
import BlurFade from "@/components/magicui/blur-fade";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import Container from "./container";
import LoadMoreLoading from "./loading";

interface ConversionHistoryItem {
  id: string;
  originalFileName: string;
  originalFileSize: number;
  convertedFileName?: string;
  downloadUrl?: string;
  urlExpiresAt?: Date;
  conversionCost?: number;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const useQueryConversionHistoryMutation = (config?: {
  onSuccess: (result: any) => void;
  onError?: (error: any) => void;
}) => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (values: any) => {
      const path = "/api/convert";
      const res = await fetch(`${path}?${qs.stringify(values)}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return res.json();
    },
    onSuccess: async (result) => {
      config?.onSuccess(result);
    },
    onError: (error) => {
      console.error("Conversion history query error:", error);
      config?.onError?.(error);
    },
  });
};



export default function History({ locale }: { locale: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [init, setInit] = useState(false);
  const t = useTranslations("History");
  const id = useId();
  const [pageParams, setPageParams] = useState({
    page: 1,
    pageSize: 12,
  });
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState<ConversionHistoryItem[]>([]);
  const useQueryConversionHistory = useQueryConversionHistoryMutation({
    onSuccess(result) {
      const { conversions = [], pagination } = result;
      // 确保 conversions 是数组，如果不是则使用空数组
      const safeData = Array.isArray(conversions) ? conversions : [];
      setDataSource(pagination.page === 1 ? safeData : [...dataSource, ...safeData]);
      setPageParams({ page: pagination.page || 1, pageSize: pagination.limit || 12 });
      setHasMore(pagination.page * pagination.limit < pagination.total);
      setInit(true);
    },
    onError(error) {
      console.error("Failed to load conversion history:", error);
      toast.error("Failed to load conversion history");
      setInit(true); // 即使出错也要设置 init 为 true，避免无限加载
    },
  });

  useEffect(() => {
    useQueryConversionHistory.mutateAsync({
      page: pageParams.page,
      limit: pageParams.pageSize,
    });
  }, []);

  const loadMore = () => {
    console.log("load more");
    useQueryConversionHistory.mutateAsync({
      page: pageParams.page + 1,
      limit: pageParams.pageSize,
    });
  };

  const copyFileName = (fileName: string) => {
    copy(fileName);
    toast.success(t("action.copySuccess"));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const debounceLoadMore = debounce(loadMore, 500);

  return (
    <Container className="h-[calc(100vh_-_76px)]">
      <div
        className="no-scrollbar h-full overflow-y-auto overflow-x-hidden"
        id={id}
        ref={containerRef}
      >
        <InfiniteScroll
          scrollThreshold={0.58}
          dataLength={dataSource.length}
          next={debounceLoadMore}
          hasMore={hasMore}
          loader={
            init ? (
              <div
                className={cn("flex h-16 w-full items-center justify-center", {
                  "h-96": !init,
                })}
              >
                <LoadMoreLoading />
              </div>
            ) : (
              <div className="flex h-full min-h-96 w-full items-center justify-center">
                <Loading />
              </div>
            )
          }
          className="pb-10"
          // onScroll={handleScroll}
          scrollableTarget={id}
        >
          {dataSource.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataSource.map((item, idx) => (
                <BlurFade
                  key={item.id}
                  delay={0.25 + (idx % pageParams.pageSize) * 0.05}
                  inView
                >
                  <div className="border-stroke-light bg-surface-300 hover:border-stroke-strong flex flex-col space-y-4 overflow-hidden rounded-xl border p-4">
                    {/* 文件图标和状态 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px]" title={item.originalFileName}>
                            {item.originalFileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(item.originalFileSize)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* 转换信息 */}
                    {item.convertedFileName && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Converted to:</p>
                        <p className="truncate" title={item.convertedFileName}>
                          {item.convertedFileName}
                        </p>
                      </div>
                    )}

                    {/* 时间信息 */}
                    <div className="text-xs text-gray-500">
                      <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                      {item.urlExpiresAt && (
                        <p>Expires: {new Date(item.urlExpiresAt).toLocaleString()}</p>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-row justify-between space-x-2 pt-2">
                      <button
                        className="focus-ring text-content-strong border-stroke-strong hover:border-stroke-stronger inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border bg-transparent px-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
                        onClick={() => copyFileName(item.originalFileName)}
                      >
                        <Copy className="w-3 h-3 me-1" />
                        {t("action.copy")}
                      </button>
                      {item.downloadUrl && item.status === 'completed' && (
                        <a
                          href={item.downloadUrl}
                          download={item.convertedFileName}
                          className="focus-ring text-white bg-blue-600 hover:bg-blue-700 inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-sm font-medium transition-colors"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </BlurFade>
              ))}
            </div>
          ) : init ? (
            <div className="flex min-h-96 items-center justify-center">
              <EmptyPlaceholder>
                <EmptyPlaceholder.Icon name="post" />
                <EmptyPlaceholder.Title>
                  {t("empty.title")}
                </EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description>
                  {t("empty.description")}
                </EmptyPlaceholder.Description>
                <Button variant="outline">{t("action.generate")}</Button>
              </EmptyPlaceholder>
            </div>
          ) : (
            <div className="hidden"></div>
          )}
        </InfiniteScroll>
        {/* <ScrollBar className="hidden" /> */}
      </div>
    </Container>
  );
}
