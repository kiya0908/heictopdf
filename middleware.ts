/**
 * 🚨 CRITICAL MIDDLEWARE CONFIGURATION 🚨
 * 
 * ⚠️  WARNING: DO NOT MODIFY THE MATCHER CONFIGURATION BELOW! ⚠️
 * 
 * This configuration is specifically designed to prevent common Clerk authentication errors.
 * Modifying the matcher can cause API routes to bypass authentication middleware,
 * resulting in "Clerk can't detect clerkMiddleware" errors.
 * 
 * Common mistakes that WILL break authentication:
 * ❌ Using negative lookahead to exclude 'api' in the main pattern
 * ❌ Missing explicit '/api/(.*)' matcher
 * ❌ Only matching page routes without API routes
 * 
 * If you need to modify routing behavior, update the route matchers below instead.
 */

// 👇 ******** 这是最终的、权威的、完整的 middleware.ts 文件内容 ******** 👇

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { get } from "@vercel/edge-config";
import { env } from "@/env.mjs";
import countries from "@/lib/countries.json";
import { getIP } from "@/lib/ip";
// Redis a/o kv functionality imports as needed
import { defaultLocale, localePrefix, locales } from "./config";


export const config = {
  matcher: ["/((?!_next|_static|.*\\..*).*)", "/api/(.*)"],
};

// ===================================================================
// 1. 定义路由规则 
// ===================================================================
const isProtectedRoute = createRouteMatcher([
    "/:locale/app(.*)",
    "/:locale/admin(.*)",
]);

// 公共路由列表
const isPublicRoute = createRouteMatcher([
    "/api/webhooks(.*)","/api/health(.*)","/","/pricing","/blog(.*)","/privacy-policy","/terms-of-use","/newsletters(.*)","/confirm(.*)","/:locale","/:locale/","/public(.*)", "/:locale/pricing","/:locale/blog(.*)","/:locale/privacy-policy","/:locale/terms-of-use","/:locale/newsletters(.*)","/:locale/confirm(.*)","/sign-in(.*)","/sign-up(.*)","/:locale/sign-in(.*)","/:locale/sign-up(.*)",
]);

// nextIntlMiddleware 配置保持不变
const nextIntlMiddleware = createMiddleware({
  defaultLocale,
  locales,
  localePrefix,
});

// ===================================================================
// 2. 修正后的 Clerk Middleware 逻辑 (这是修复所有问题的关键)
// ===================================================================
export default clerkMiddleware((auth, req) => {
  // 如果路由不是公共的，我们就执行认证保护
  if (!isPublicRoute(req)) {
    auth().protect();
  }
  
  // 对于所有请求 (无论是公共的，还是通过了认证的受保护路由)，
  // 我们都必须运行 next-intl 中间件来处理国际化。
  return nextIntlMiddleware(req);
});