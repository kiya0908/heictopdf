#!/usr/bin/env node

/**
 * Cloudflare Pages 部署脚本
 * 自动处理环境变量和构建配置
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 Cloudflare Pages 部署流程...\n');

// 设置 Cloudflare 环境变量
process.env.CF_PAGES = '1';
process.env.CLOUDFLARE_ENV = 'production';

try {
  // 1. 验证中间件配置
  console.log('1️⃣ 验证中间件配置...');
  execSync('node scripts/validate-middleware.js', { stdio: 'inherit' });
  
  // 2. 生成 Prisma 客户端
  console.log('\n2️⃣ 生成 Prisma 客户端...');
  execSync('pnpm run db:generate', { stdio: 'inherit' });
  
  // 3. Next.js 构建
  console.log('\n3️⃣ 构建 Next.js 应用...');
  execSync('pnpm run build', { stdio: 'inherit' });
  
  // 4. Cloudflare Pages 适配
  console.log('\n4️⃣ 适配 Cloudflare Pages...');
  execSync('pnpm run build:cloudflare', { stdio: 'inherit' });
  
  // 5. 检查构建输出
  const outputDir = '.vercel/output/static';
  if (!fs.existsSync(outputDir)) {
    throw new Error(`构建输出目录不存在: ${outputDir}`);
  }
  
  console.log('\n✅ 构建完成！');
  console.log(`📁 构建输出位置: ${outputDir}`);
  console.log('\n🎯 接下来你可以：');
  console.log('  • 运行 `pnpm run preview` 本地预览');
  console.log('  • 运行 `pnpm run deploy` 部署到 Cloudflare Pages');
  console.log('  • 或使用 Cloudflare Dashboard 连接 GitHub 自动部署');
  
} catch (error) {
  console.error('\n❌ 构建失败：', error.message);
  process.exit(1);
}