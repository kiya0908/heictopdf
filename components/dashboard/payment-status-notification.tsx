'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface PaymentStatusNotificationProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export function PaymentStatusNotification({ searchParams }: PaymentStatusNotificationProps) {
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
    isTestMode?: boolean;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  useEffect(() => {
    const paymentSuccess = searchParams.payment_success === 'true';
    const paymentFailed = searchParams.payment_failed === 'true';
    const provider = searchParams.provider;
    const isTestMode = searchParams.mode === 'test';

    if (paymentSuccess && provider === 'creem') {
      setNotification({
        show: true,
        type: 'success',
        message: isTestMode 
          ? '🧪 测试支付成功！欢迎成为Pro用户！(测试模式)'
          : '🎉 支付成功！欢迎成为Pro用户！现在您可以无限制转换文件了！',
        isTestMode,
      });

      // 5秒后自动隐藏通知
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } else if (paymentFailed && provider === 'creem') {
      setNotification({
        show: true,
        type: 'error',
        message: isTestMode 
          ? '⚠️ 测试支付已取消或失败 (测试模式)'
          : '⚠️ 支付已取消或失败，请重试',
        isTestMode,
      });

      // 3秒后自动隐藏通知
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  }, [searchParams]);

  if (!notification.show) {
    return null;
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border-l-4 animate-in slide-in-from-right-5
      ${notification.type === 'success' 
        ? 'bg-green-50 border-green-400 text-green-800' 
        : 'bg-red-50 border-red-400 text-red-800'
      }
      ${notification.isTestMode ? 'border-yellow-400 bg-yellow-50' : ''}
    `}>
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {notification.message}
          </p>
          {notification.isTestMode && (
            <p className="text-xs mt-1 opacity-75">
              这是测试环境，实际不会产生费用
            </p>
          )}
        </div>
        <button
          onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}