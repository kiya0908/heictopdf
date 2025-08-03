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

  // Fetch subscription info
  const subscriptionQuery = useQuery({
    queryKey: ["userSubscription"],
    queryFn: async () => {
      const res = await fetch("/api/paypal-subscription", {
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
    if (!subscriptionQuery.data?.id) return;
    
    try {
      const res = await fetch(`/api/paypal-subscription?subscriptionId=${subscriptionQuery.data.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      
      if (res.ok) {
        subscriptionQuery.refetch();
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
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

  const subscription = subscriptionQuery.data;
  const conversions = conversionsQuery.data;
  const isPro = subscription?.status === "ACTIVE";

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
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "Pro Member" : subscription.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plan: {subscription.plan_id?.includes("YEARLY") ? "Yearly" : "Monthly"}
                  </p>
                </div>
                {isPro && (
                  <Button variant="outline" size="sm" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
              
              {subscription.billing_info?.next_billing_time && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Next billing: {formatDate(subscription.billing_info.next_billing_time)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button asChild>
                <a href="/pricing">Upgrade to Pro</a>
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
              <EmptyPlaceholder.Icon name="file" />
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