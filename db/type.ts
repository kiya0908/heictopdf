import { Prisma } from "@prisma/client";

export enum Currency {
  CNY = "CNY",
  USD = "USD",
}

export enum OrderPhase {
  Pending = "Pending",
  Paid = "Paid",
  Canceled = "Canceled",
  Failed = "Failed",
}

export enum PaymentChannelType {
  Alipay = "Alipay",
  WeChat = "WeChat",
  Stripe = "Stripe",
  Creem = "Creem", // 新增Creem支付渠道
  GiftCode = "GiftCode",
  InviteCode = "InviteCode",
  ActivityCredit = "Event Gift",
}

export enum BillingType {
  Refund = "Refund", // 退款
  Withdraw = "Withdraw",
}

export enum FluxTaskStatus {
  Pending = "pending",
  Processing = "processing", 
  Succeeded = "succeeded",
  Failed = "failed",
  Canceled = "canceled",
}


export type ChargeProductDto = Prisma.ChargeProductGetPayload<any>;

export type ChargeProductSchema = Prisma.ChargeProductCreateInput;

export type ChargeProductSelectDto = Omit<ChargeProductDto, "id"> & {
  id: string;
};

export type ChargeOrderDto = Prisma.ChargeOrderGetPayload<any>;

// 临时类型定义 - GiftCode 功能已废弃但保留类型定义以避免编译错误
export type GiftCodeSelectDto = {
  id: string;
  code: string;
  creditAmount: number;
  used: boolean;
  expiredAt: Date | null;
  usedBy: string | null;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

