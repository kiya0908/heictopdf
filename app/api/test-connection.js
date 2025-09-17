const postgres = require('postgres');

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL;

async function testConnection() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL 环境变量未设置！");
    console.log("请在 .env.local 文件中设置 DATABASE_URL");
    return;
  }

  console.log("Attempting to connect to the database...");

  try {
    const sql = postgres(DATABASE_URL, {
      ssl: 'require', // Supabase 需要 SSL 连接
    });

    // 执行一个非常简单的查询来验证连接
    const result = await sql`SELECT NOW()`;
    console.log("✅ Connection Successful!");
    console.log("Current time from database:", result[0].now);

    await sql.end(); // 关闭连接
  } catch (error) {
    console.error("❌ Connection Failed!");
    console.error(error);
  }
}

testConnection();