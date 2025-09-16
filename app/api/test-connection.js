const postgres = require('postgres');

// ！！！ 在这里粘贴你从 Supabase 连接池页面复制的完整 URL ！！！
const DATABASE_URL = "postgresql://postgres.atsvyuqjntoufzmnxqtp:supabasecode01@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function testConnection() {
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