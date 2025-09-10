/**
 * 订单历史页面 - 显示当前登录用户的支付记录
 * 
 * 数据流程说明：
 * 1. 页面组件：OrderInfo 组件负责订单数据的获取和显示
 * 2. 身份验证：通过 Clerk 获取当前登录用户的 userId 和 token
 * 3. API调用：前端调用 `/api/order` 接口，传递用户认证信息
 * 4. 数据查询：API路由从 ChargeOrder 表查询当前用户的订单记录
 *    - 过滤条件：userId = 当前登录用户ID
 *    - 状态过滤：默认排除 Pending 状态订单
 *    - 排序方式：按创建时间倒序显示
 * 5. 支付渠道：支持显示多种支付方式的订单
 *    - Stripe 订单记录
 *    - PayPal 订单记录  
 *    - Creem 订单记录（通过 webhook 创建）
 *    - 其他支付渠道订单
 * 
 * Creem支付流程：
 * - 用户在Creem完成支付后，Creem发送webhook到 `/api/creem-webhook`
 * - Webhook处理器验证签名后，在ChargeOrder表中创建订单记录
 * - 订单记录包含：用户ID、支付金额、支付渠道、订阅信息等
 * - 用户访问此页面时即可看到Creem支付的订单历史
 */

import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import { OrderInfo } from "@/components/order-info";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({
  params: { locale },
}: PageProps) {
  const t = await getTranslations({ locale, namespace: "Orders" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BillingPage({ params: { locale } }: PageProps) {
  unstable_setRequestLocale(locale);

  return <OrderInfo />;
}
