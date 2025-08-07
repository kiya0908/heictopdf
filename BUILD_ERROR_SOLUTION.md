# 构建错误解决方案

## 问题描述

运行 `npm run build` 时出现以下错误：

1. **Upstash Redis配置缺失**
```
[Upstash Redis] The 'url' property is missing or undefined in your Redis config.
[Upstash Redis] The 'token' property is missing or undefined in your Redis config.
```

2. **Invalid URL错误**
```
TypeError: Invalid URL
    at new URL (node:internal/url:818:25)
```

## 错误原因

1. **环境变量缺失**：项目缺少必需的环境变量配置
2. **URL构造函数错误**：`siteConfig.url`为`undefined`，导致`new URL()`失败

## 解决方案

### 第一步：创建环境配置文件

在项目根目录创建 `.env.local` 文件，包含以下内容：

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/heictopdf"

# 加密盐值
HASHID_SALT="your-secret-salt-here"

# Clerk认证配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# ConvertAPI配置
CONVERTAPI_SECRET="your-convertapi-secret"

# 网站URL配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Upstash Redis配置（可选）
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 第二步：获取必需的服务配置

#### 1. Clerk认证服务
- 访问 https://clerk.com/
- 创建新项目
- 获取Publishable Key和Secret Key

#### 2. ConvertAPI服务
- 访问 https://www.convertapi.com/
- 注册账户并获取API密钥

#### 3. 数据库配置
- 可以使用本地PostgreSQL或云服务如Supabase

#### 4. Upstash Redis（可选）
- 访问 https://upstash.com/
- 创建Redis数据库

### 第三步：验证修复

1. 确保所有环境变量都已正确设置
2. 重新运行构建命令：
```bash
npm run build
```

## 注意事项

- `.env.local` 文件已被添加到 `.gitignore` 中，不会被提交到版本控制
- 生产环境部署时，需要在部署平台（如Vercel）中设置相应的环境变量
- 如果不需要Redis功能，可以注释掉相关配置

## 常见问题

**Q: 如何获取Clerk密钥？**
A: 注册Clerk账户后，在项目设置中找到API密钥部分。

**Q: 如何获取ConvertAPI密钥？**
A: 注册ConvertAPI账户后，在控制面板中找到API密钥。

**Q: 数据库URL格式是什么？**
A: 格式为：`postgresql://username:password@host:port/database` 