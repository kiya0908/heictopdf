// 运行数据库迁移的脚本
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 确保使用 .env.local 中的环境变量
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.log('No .env.local file found, using environment variables from process');
}

try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('Database migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}