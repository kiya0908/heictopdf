/**
 * 订阅状态显示组件 - /app页面的核心订阅信息展示
 * 
 * 最近更新: 2025-09-07 - 重大更新，完全重构订阅状态显示逻辑
 * 
 * 更新内容:
 * 1. API调用: 从 /api/paypal-subscription 改为 /api/user-subscription (支持多支付方式)
 * 2. 未订阅用户显示: 从空白"No active subscription"改为详细的免费计划信息
 * 3. 多支付方式支持: 统一的图标+名称显示系统 (Creem💳, PayPal🅿️, Stripe💰, 等)
 * 4. 智能取消逻辑: Creem用户隐藏取消按钮，其他支付方式显示
 * 5. 可扩展架构: 轻松添加新支付方式（Alipay💙, WeChat Pay💚）
 * 
 * 解决问题:
 * - 修复了硬编码"Payment System Updating"消息显示问题
 * - Creem支付用户现在可以正确看到Pro状态
 * - 免费用户看到有价值的功能对比信息，而不是空白
 */

"use client";

import React, { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Calendar, CreditCard, Download, FileText, Zap } from "lucide-react";

import Loading from "@/components/loading";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function SubscriptionInfo() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const t = useTranslations("Dashboard");

  // Fetch subscription info (supports Creem, PayPal, Stripe)
  const subscriptionQuery = useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const res = await fetch("/api/user-subscription", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!res.ok) {
        if (res.status === 404) return null; // No subscription
        throw new Error("Failed to fetch subscription");
      }
      return res.json();
    },
  });

  // Fetch conversion history
  const conversionsQuery = useQuery({
    queryKey: ["conversions"],
    queryFn: async () => {
      const res = await fetch("/api/convert", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch conversions");
      return res.json();
    },
  });

  const handleCancelSubscription = async () => {
    if (!subscriptionQuery.data?.subscriptionId && !subscription?.provider) return;
    
    try {
      let cancelUrl = "";
      let method = "DELETE";
      
      if (subscriptionQuery.data?.provider === "paypal") {
        cancelUrl = `/api/paypal-subscription?subscriptionId=${subscriptionQuery.data.subscriptionId}`;
      } else if (subscriptionQuery.data?.provider === "stripe") {
        cancelUrl = `/api/stripe-subscription?subscriptionId=${subscriptionQuery.data.subscriptionId}`;
      } else if (subscriptionQuery.data?.provider === "creem") {
        cancelUrl = `/api/creem-cancel-subscription`;
        method = "POST"; // Creem API 使用 POST 方法
      } else {
        alert("Unsupported payment provider for cancellation.");
        return;
      }
      
      const res = await fetch(cancelUrl, {
        method,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert("Subscription cancelled successfully!");
        subscriptionQuery.refetch();
      } else {
        alert(`Failed to cancel subscription: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      alert("An error occurred while cancelling the subscription.");
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 支付方式图标和显示名称映射
  const getProviderDisplay = (provider: string) => {
    const providerMap: Record<string, { icon: string; name: string }> = {
      creem: { icon: "💳", name: "Creem" },
      paypal: { icon: "🅿️", name: "PayPal" },
      stripe: { icon: "💰", name: "Stripe" },
      alipay: { icon: "💙", name: "Alipay" },
      wechat: { icon: "💚", name: "WeChat Pay" },
      default: { icon: "💳", name: provider }
    };
    return providerMap[provider] || providerMap.default;
  };

  const subscription = subscriptionQuery.data;
  const conversions = conversionsQuery.data;
  const isPro = subscription?.isPro || subscription?.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionQuery.isLoading ? (
            <Loading />
          ) : subscription?.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "Pro Member" : subscription.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plan: {subscription.planType === "yearly" ? "Yearly" : "Monthly"}
                    {subscription.provider && (
                      <span className="ml-2 px-2 py-1 bg-muted rounded text-xs capitalize">
                        {getProviderDisplay(subscription.provider).icon} {getProviderDisplay(subscription.provider).name}
                      </span>
                    )}
                  </p>
                </div>
                {isPro && (
                  <Button variant="outline" size="sm" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
              
              {subscription.expiresAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {subscription.provider === "creem" 
                    ? "Active subscription (Creem)" 
                    : `Next billing: ${formatDate(subscription.expiresAt)}`
                  }
                </div>
              )}
              
              {!subscription.expiresAt && subscription.provider === "creem" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Active subscription - No expiration date
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mb-4">
                <Badge variant="outline" className="mb-2">Free Plan</Badge>
                <p className="text-muted-foreground">
                  Currently using our free tier with daily limits
                </p>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between items-center mb-1">
                      <span>Daily conversions:</span>
                      <span className="font-medium">10 free/day</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Files per conversion:</span>
                      <span className="font-medium">10 files max</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>File size limit:</span>
                      <span className="font-medium">10MB each</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button asChild>
                <a href="/pricing">Upgrade to Pro - Unlimited Conversions</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversionsQuery.isLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {conversions?.usage?.dailyCount || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPro ? "Conversions Today" : `Daily Usage (${conversions?.usage?.maxDaily || 10} max)`}
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {conversions?.pagination?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Conversions
                </div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {isPro ? "∞" : Math.max(0, (conversions?.usage?.maxDaily || 10) - (conversions?.usage?.dailyCount || 0))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isPro ? "Unlimited" : "Remaining Today"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Conversions
          </CardTitle>
          <CardDescription>
            Your recent HEIC to PDF conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversionsQuery.isLoading ? (
            <Loading />
          ) : conversions?.conversions?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Original File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.conversions.slice(0, 10).map((conversion: any) => (
                  <TableRow key={conversion.id}>
                    <TableCell className="font-medium">
                      {conversion.originalFileName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        conversion.status === "completed" ? "default" :
                        conversion.status === "failed" ? "destructive" : "secondary"
                      }>
                        {conversion.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(conversion.createdAt)}
                    </TableCell>
                    <TableCell>
                      {conversion.status === "completed" && conversion.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(conversion.downloadUrl, conversion.convertedFileName || "converted.pdf")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon name="post" />
              <EmptyPlaceholder.Title>
                No conversions yet
              </EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                Start converting your HEIC files to PDF to see them here.
              </EmptyPlaceholder.Description>
              <Button asChild>
                <a href="/">Start Converting</a>
              </Button>
            </EmptyPlaceholder>
          )}
        </CardContent>
      </Card>
    </div>
  );
}