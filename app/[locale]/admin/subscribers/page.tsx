import React from "react";

import { prisma } from "@/db/prisma";

import SubscribersCard from "./_mods/card";

export default async function AdminSubscribersPage() {
  // TODO: subscribers 功能已被废弃，相关数据表已删除
  // 返回空数据以避免构建错误
  
  const count = {
    today_count: 0,
    this_month_count: 0,
    total: 0
  };

  const subs: any[] = [];

  return <SubscribersCard count={count} dataSource={subs} />;
}
