'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreemButtonProps {
  planType: 'monthly' | 'yearly';
  customId?: string;
  btnText?: string;
  className?: string;
  disabled?: boolean;
}

export default function CreemButton({ 
  planType, 
  customId, 
  btnText,
  className,
  disabled = false 
}: CreemButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const t = useTranslations("PricingPage");
  const locale = useLocale(); // 获取当前语言

  const handleSubscribe = async () => {
    if (!user || disabled) {
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 创建Creem订阅:', { planType, userId: user.id });

      // 根据planType从环境变量获取产品ID
      const getProductId = () => {
        if (planType === 'monthly') {
          return process.env.NEXT_PUBLIC_CREEM_MONTHLY_PRODUCT_ID || process.env.CREEM_MONTHLY_PRODUCT_ID;
        } else if (planType === 'yearly') {
          return process.env.NEXT_PUBLIC_CREEM_YEARLY_PRODUCT_ID || process.env.CREEM_YEARLY_PRODUCT_ID;
        }
        throw new Error(`Invalid planType: ${planType}`);
      };

      const productId = getProductId();
      
      if (!productId) {
        throw new Error(`Product ID not found for plan type: ${planType}. Please check CREEM_${planType.toUpperCase()}_PRODUCT_ID environment variable.`);
      }
      
      console.log(`📋 选择的产品ID: ${productId} (${planType})`);

      const response = await fetch('/api/creem-subscription', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: productId,
          customId: customId || user.id,
          locale: locale, // 传递当前语言给API
          // 额外信息用于调试
          planType,
          userEmail: user.emailAddresses[0]?.emailAddress,
          userName: user.fullName || user.firstName || 'User',
        }),
      });

      const data = await response.json();
      console.log('📄 API响应:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      if (data.checkout_url) {
        console.log('🔗 跳转支付页面:', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('❌ 订阅创建失败:', error);
      
      // 显示用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`支付创建失败: ${errorMessage}\n\n请稍后重试或联系客服。`);
    } finally {
      setLoading(false);
    }
  };

  // 显示测试模式标识
  const isTestMode = process.env.NODE_ENV === 'development' || 
                    process.env.CREEM_ENVIRONMENT === 'sandbox';

  return (
    <div className="flex flex-col space-y-2">
      <Button 
        onClick={handleSubscribe}
        disabled={loading || disabled}
        className={cn("w-full relative", className)}
        variant="default"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>处理中...</span>
          </div>
        ) : (
          <>
            <span>{btnText || `订阅 Pro ${planType === 'yearly' ? '年付' : '月付'}`}</span>
            {isTestMode && (
              <span className="ml-2 text-xs bg-yellow-500 text-black px-1 rounded">
                测试
              </span>
            )}
          </>
        )}
      </Button>
      
      {isTestMode && (
        <p className="text-xs text-center text-muted-foreground">
          🧪 当前为测试模式，不会产生实际费用
        </p>
      )}
      
      <p className="text-xs text-center text-muted-foreground">
        安全支付 • 随时可取消
      </p>
    </div>
  );
}