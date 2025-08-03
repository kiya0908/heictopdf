# 🚨 Clerk + Next.js 中间件认证问题排查指南

## 问题现象
- ✅ 页面可以正常访问
- ❌ API 调用返回 HTTP 500 错误
- ❌ 浏览器控制台显示: `Error: HTTP error! status: 500`
- ❌ 服务器日志显示: `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()`

## 根本原因
**middleware.ts 中的 matcher 配置错误，导致 API 路由被排除在中间件处理之外**

## 错误配置示例
```typescript
// ❌ 错误：排除了所有 API 路由
export const config = {
  matcher: [
    "/((?!api|_next|_static|.*\\..*).*)",  // 这里的 !api 排除了 API 路由
  ],
};
```

## 正确配置
```typescript
// ✅ 正确：包含 API 路由
export const config = {
  matcher: [
    "/((?!_next|_static|.*\\..*).*)",     // 页面路由（移除了 !api）
    "/api/(.*)"                           // 明确包含 API 路由
  ],
};
```

## 问题发生的技术流程

### 错误流程
```
1. 前端发送请求 → GET /api/convert
2. Next.js 检查 matcher → /api/convert 被排除
3. 请求跳过中间件 → 直接到达 API 路由
4. API 调用 auth() → 没有认证上下文
5. Clerk 抛出错误 → "can't detect clerkMiddleware"
6. 返回 HTTP 500 → 前端收到错误
```

### 正确流程  
```
1. 前端发送请求 → GET /api/convert
2. Next.js 检查 matcher → /api/convert 匹配成功
3. 请求经过中间件 → Clerk 添加认证上下文
4. API 调用 auth() → 成功获取用户信息
5. 返回正确数据 → 或 401 未认证错误
```

## 快速排查步骤

### 1. 检查中间件配置 (最重要！)
```bash
# 查看 middleware.ts 文件
cat middleware.ts | grep -A 10 "matcher"
```

检查点：
- [ ] matcher 中是否包含 `/api/(.*)` 
- [ ] 是否错误排除了 `!api`
- [ ] 需要认证的 API 路由是否被匹配

### 2. 测试 API 认证状态
```bash
# 测试 API 是否返回正确的认证错误
curl -X GET "http://localhost:3000/api/convert?page=1&limit=10"

# 应该返回: {"error":"Unauthorized"} (401)
# 而不是: 500 错误
```

### 3. 检查环境配置
```bash
# 确认 Clerk 密钥存在
grep -E "CLERK|clerk" .env .env.local
```

必需的环境变量：
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## 常见错误模式

### 模式1: 完全排除 API
```typescript
// ❌ 错误
matcher: ["/((?!api|_next|_static|.*\\..*).*)"
```

### 模式2: 忘记包含需要认证的 API
```typescript
// ❌ 错误：只包含 webhooks，遗漏其他 API
matcher: [
  "/((?!_next|_static|.*\\..*).*)",
  "/api/webhooks(.*)"  // 只包含 webhooks
]
```

### 模式3: 过度匹配
```typescript
// ⚠️ 可能有性能问题：匹配了不需要的静态资源
matcher: ["/(.*)"]]
```

## 最佳实践配置模板

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 定义需要保护的路由
const isProtectedRoute = createRouteMatcher([
  "/:locale/app(.*)",      // 应用页面
  "/:locale/admin(.*)",    // 管理页面
  "/api/convert(.*)",      // 需要认证的 API
  "/api/user(.*)",         // 用户相关 API
]);

// 定义公开路由（不需要认证）
const isPublicRoute = createRouteMatcher([
  "/api/webhooks(.*)",     // Webhook 端点
  "/api/health(.*)",       // 健康检查
]);

export const config = {
  matcher: [
    // 匹配所有页面路由（除了 Next.js 内部路由）
    "/((?!_next|_static|.*\\..*).*)",
    // 明确包含所有 API 路由
    "/api/(.*)"
  ],
};

export default clerkMiddleware(async (auth, req) => {
  // 公开路由直接放行
  if (isPublicRoute(req)) {
    return;
  }
  
  // 保护路由需要认证
  if (isProtectedRoute(req)) {
    auth().protect();
  }
  
  // 其他中间件逻辑...
});
```

## 调试技巧

### 1. 添加调试日志
```typescript
export default clerkMiddleware(async (auth, req) => {
  console.log('🚀 Middleware processing:', req.nextUrl.pathname);
  
  if (req.nextUrl.pathname.startsWith('/api/')) {
    console.log('📡 API request detected');
  }
  
  // ... 其他逻辑
});
```

### 2. 临时测试端点
```typescript
// app/api/test-auth/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ 
      success: true, 
      userId,
      message: 'Auth working correctly' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

## 预防措施

### 1. 项目模板检查清单
使用模板时必须检查：
- [ ] `middleware.ts` 配置是否正确
- [ ] 环境变量是否完整
- [ ] API 路由认证测试
- [ ] 页面路由访问测试

### 2. 开发流程
```bash
# 每次修改 middleware.ts 后执行
npm run dev
curl -X GET "http://localhost:3000/api/test-auth"  # 测试认证
```

### 3. 部署前检查
```bash
# 确保生产环境变量正确
npm run build
npm run start
# 测试所有需要认证的 API 端点
```

## 相关资源
- [Clerk Next.js 文档](https://clerk.com/docs/quickstarts/nextjs)
- [Next.js 中间件文档](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js Matcher 配置](https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher)

---

**记住：90% 的 Clerk 认证问题都是 middleware matcher 配置错误！**