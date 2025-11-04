<a href="https://heic-to-pdf.pro">
  <img alt="HEIC to PDF Converter" src="/favicon-32x32.png">
  <h1 align="center">HEIC to PDF Converter</h1>
</a>

<p align="center">
  The fastest and most reliable way to convert HEIC images to PDF documents. Simple, secure, and efficient.
</p>

<p align="center">
  <a href="https://github.com/kiya0908/heictopdf">
    <img src="https://img.shields.io/github/stars/kiya0908/heictopdf?style=social" alt="GitHub stars" />
  </a>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#usage"><strong>Usage</strong></a> ·
  <a href="#contributing"><strong>Contributing</strong></a>
</p>
<br/>

## Introduction

HEIC to PDF Converter is a modern web application built with Next.js 14 that allows users to convert Apple's HEIC image format to universally compatible PDF documents. The application features batch processing, high-quality preservation, and a user-friendly interface.

### Key Features

- **Batch Conversion**: Convert multiple HEIC images to PDF in one go
- **High Quality**: Maintains original image quality during conversion
- **Cross-Platform**: Works on all devices and operating systems
- **Secure**: Files are automatically deleted after conversion
- **Fast Processing**: Optimized conversion engine for quick results
- **Multi-language Support**: Available in multiple languages

## Installation

Clone this repository locally:

```bash
git clone https://github.com/kiya0908/heictopdf.git
cd heictopdf
```

1. Install dependencies using pnpm:

```sh
pnpm install
```

2. Copy `.env.example` to `.env.local` and update the variables.

```sh
cp .env.example .env.local
```

3. Start the development server:

```sh
pnpm run dev
```

> [!NOTE]  
> I use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) package for update this project.
>
> Use this command for update your project: `ncu -i --format group`

> [!WARNING]  
> You need update `.react-email` folder before use `pnpm run email`. Check the link [here](https://github.com/resend/react-email/issues/868#issuecomment-1828411325) if you have the error : `renderToReadableStream not found`
>

### Tech Stack

- [Next.js 14](https://nextjs.org/) – React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) – Type-safe development
- [Prisma](https://www.prisma.io/) – Database ORM
- [Clerk Auth](https://clerk.com/) – Authentication and user management
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) – Modern UI components
- [Next-intl](https://next-intl-docs.vercel.app/) – Internationalization

### Platforms

- [Vercel](https://vercel.com/) – Deployment and hosting
- [Supabase](https://supabase.com/) – Database and storage

### UI

- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework for rapid UI development
- [Shadcn/ui](https://ui.shadcn.com/) – Re-usable components built using Radix UI and Tailwind CSS
- [Framer Motion](https://framer.com/motion) – Motion library for React to animate components with ease
- [Lucide](https://lucide.dev/) – Beautifully simple, pixel-perfect icons
- [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) – Optimize custom fonts and remove external network requests for improved performance
- [`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response) – Generate dynamic Open Graph images at the edge

### Hooks and Utilities

- `useIntersectionObserver` – React hook to observe when an element enters or leaves the viewport
- `useLocalStorage` – Persist data in the browser's local storage
- `useScroll` – React hook to observe scroll position ([example](https://github.com/mickasmt/precedent/blob/main/components/layout/navbar.tsx#L12))
- `nFormatter` – Format numbers with suffixes like `1.2k` or `1.2M`
- `capitalize` – Capitalize the first letter of a string
- `truncate` – Truncate a string to a specified length
- [`use-debounce`](https://www.npmjs.com/package/use-debounce) – Debounce a function call / state update

### Code Quality

- [TypeScript](https://www.typescriptlang.org/) – Static type checker for end-to-end typesafety
- [Prettier](https://prettier.io/) – Opinionated code formatter for consistent code style
- [ESLint](https://eslint.org/) – Pluggable linter for Next.js and TypeScript

### Miscellaneous

- [Vercel Analytics](https://vercel.com/analytics) – Track unique visitors, pageviews, and more in a privacy-friendly way

## Credits

This project was inspired by shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy), Steven Tey’s [Precedent](https://github.com/steven-tey/precedent), and Antonio Erdeljac's [Next 13 AI SaaS](https://github.com/AntonioErdeljac/next13-ai-saas).

- Shadcn ([@shadcn](https://twitter.com/shadcn))
- Steven Tey ([@steventey](https://twitter.com/steventey))
- Antonio Erdeljac ([@YTCodeAntonio](https://twitter.com/AntonioErdeljac))
- Next SaaS Stripe Starter([@miickasmt](https://github.com/mickasmt/next-saas-stripe-starter))


## Features

### Core Functionality
- **HEIC to PDF Conversion**: Convert Apple's HEIC format to universal PDF
- **Batch Processing**: Handle multiple files simultaneously
- **Quality Preservation**: Maintain original image quality
- **File Security**: Automatic cleanup after conversion

### User Experience
- **Drag & Drop Interface**: Easy file upload
- **Progress Tracking**: Real-time conversion status
- **Multi-language Support**: Available in 10+ languages
- **Responsive Design**: Works on all devices

### Technical Features
- **Fast Processing**: Optimized conversion algorithms
- **Cloud Storage Integration**: Support for major cloud providers
- **API Access**: RESTful API for developers
- **Rate Limiting**: Fair usage policies

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project
4. Add environment variables
5. Deploy

### Docker

```bash
# Build the image
docker build -t heictopdf .

# Run the container
docker run -p 3000:3000 heictopdf
```

## Performance

- **Conversion Speed**: Average 2-5 seconds per file
- **File Size Limit**: Up to 50MB per file (configurable)
- **Concurrent Users**: Supports 1000+ simultaneous users
- **Uptime**: 99.9% availability

## Security

- **File Encryption**: All uploads encrypted in transit
- **Automatic Cleanup**: Files deleted after 24 hours
- **No Data Storage**: No permanent file storage
- **Privacy First**: No tracking or analytics on file content

## Roadmap

- [ ] OCR text extraction from images
- [ ] Watermark addition options
- [ ] Advanced compression settings
- [ ] API rate limiting dashboard
- [ ] Mobile app development
- [ ] Enterprise features

## FAQ

**Q: What is HEIC format?**
A: HEIC (High Efficiency Image Container) is Apple's modern image format that saves storage space while maintaining quality.

**Q: Is my data secure?**
A: Yes, all files are encrypted during upload and automatically deleted after conversion.

**Q: Are there file size limits?**
A: Free users can convert files up to 10MB each. Premium users get higher limits.

## Changelog

### v1.2.0 (Latest)
- Added batch conversion support
- Improved conversion speed by 40%
- Added multi-language support
- Enhanced security measures

### v1.1.0
- Added drag & drop interface
- Implemented progress tracking
- Fixed memory leaks
- Added API documentation

### v1.0.0
- Initial release
- Basic HEIC to PDF conversion
- Web interface
- File upload/download

## SEO 配置

### 搜索引擎优化
本项目已正确配置SEO元数据，包括：
- 自动生成sitemap.xml
- 配置robots.txt
- 设置正确的meta标签
- 支持多语言SEO

### 环境变量配置
确保在`.env.local`文件中设置以下变量：
```bash
NEXT_PUBLIC_APP_URL=https://heic-to-pdf.pro
```


## 运行环境

- Node.js ≥ 20.10.0（与项目 `engines` 一致）
- pnpm 9（项目使用 `pnpm@9.7.1`）

> 若使用 Docker 或 CI 构建并希望跳过本地环境校验，可在构建命令前加入环境变量：`SKIP_ENV_VALIDATION=1`

## 常用脚本（Scripts）

在项目根目录执行：

```bash
pnpm run dev           # 本地开发（Next.js）
pnpm run turbo         # 使用 Turbo 模式的 dev（更快的 HMR）
pnpm run build         # 生产构建（含预构建校验）
pnpm start             # 启动生产服务
pnpm lint              # 代码规范检查

# 数据库/Prisma
pnpm db:generate       # 生成 Prisma Client
pnpm db:push           # 同步 schema 至数据库（开发环境推荐）
pnpm db:pull           # 从数据库拉取 schema

# 邮件预览（本地）
pnpm email             # 启动 react-email 预览（需先更新 .react-email）

# 其他
pnpm prettier          # 执行 Prettier 代码格式化
pnpm validate-middleware  # 校验中间件配置
pnpm validate-all         # 校验中间件并测试 API 路由匹配
```

## 环境变量清单

以下变量由 `env.mjs` 校验与注入（生产或 Vercel 构建时可跳过校验）：

- 服务器侧（必填）
  - `DATABASE_URL`：数据库连接串（PostgreSQL/Supabase 等）
  - `HASHID_SALT`：短链/ID 混淆的盐值
  - `CLERK_SECRET_KEY`：Clerk 服务端密钥
  - `CONVERTAPI_SECRET`：ConvertAPI 用于 HEIC 转换的秘钥

- 客户端侧（必填）
  - `NEXT_PUBLIC_APP_URL`：站点访问地址，默认 `http://localhost:3000`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`：Clerk 前端可公开的密钥

- 客户端侧（可选）
  - `NEXT_PUBLIC_UMAMI_DATA_ID`：Umami 统计 ID（可选）
  - `NEXT_PUBLIC_GA_ID`：Google Analytics ID（可选）

> 建议在本地复制 `.env.example` 为 `.env.local` 并逐项填写。生产环境中，请在 Vercel/Cloud 提供商的环境变量面板进行配置。

## 数据库与 Prisma 初始化

1. 配置数据库环境变量 `DATABASE_URL`
2. 生成 Prisma Client：
   ```bash
   pnpm db:generate
   ```
3. 将 schema 同步到数据库（开发环境推荐）：
   ```bash
   pnpm db:push
   ```
4. 如需种子数据，项目已在 `package.json` 中配置：
   ```bash
   npx prisma db seed
   # 或根据你的包管理器：pnpm prisma db seed
   ```

## 国际化（next-intl）与认证（Clerk）及中间件

- 使用 `next-intl` 提供多语言能力，默认与受支持语言在 `app/[locale]` 下组织路由。
- 使用 `@clerk/nextjs` 进行用户认证与会话管理。
- 中间件 `middleware.ts`：
  - 通过 `matcher` 同时匹配页面与 `api` 路由。
  - 通过 `createRouteMatcher` 定义公共路由（无需登录）。
  - 对非公共路由使用 `auth().protect()` 强制登录。
  - 所有请求均交由 `next-intl` 中间件处理语言解析。

> 若遇到中间件相关问题，可运行 `pnpm validate-middleware` 快速自检。

## 部署与配置

### Vercel

- 项目内置 `vercel.json`，`app/api/**/*.ts` 的函数 `maxDuration` 为 30 秒。
- Rewrites 已在 `next.config.mjs` 与 `vercel.json` 同步配置 `/feed`、`/rss`、`/rss.xml` 到 `feed.xml`。
- 构建命令：`npm run build`（Vercel 会自动识别）。

### Cloudflare Pages（可选）

- 项目包含 `@cloudflare/next-on-pages` 与 `wrangler` 依赖，可按需迁移。
- 如使用 Cloudflare，请遵循官方指引配置构建命令与环境变量。

## 性能与文件处理

- HEIC/HEIF 文件在 `next.config.mjs` 中通过 webpack 自定义 `file-loader` 规则进行处理（输出到 `static/files/`）。
- 使用 `sharp` 进行图像处理与转换，确保在服务器环境（如 Vercel）具备相应二进制支持。

## 故障排查与安全

- 构建/部署常见错误与解决方案：见 `BUILD_ERROR_SOLUTION.md` 与 `doc/TROUBLESHOOTING.md`
- 安全策略与中间件保护：见 `doc/SECURITY.md` 与 `doc/MIDDLEWARE-PROTECTION.md`
- 若支付/第三方集成出现异常，可参考 `doc/paypal-*`、`doc/creem-*` 文档

---

以上章节补充了运行环境、脚本、环境变量、数据库初始化、国际化与中间件、部署与故障排查等要点，便于零基础开发者快速完成本地运行与上线。
