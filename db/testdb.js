require("dotenv").config();
const { Client } = require("pg");

async function testConnection() {
  console.log("Testing database connection...");
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  
  try {
    await client.connect();
    console.log("✅ Database connection successful!");
    
    const result = await client.query('SELECT current_database()');
    console.log("Connected to database:", result.rows[0].current_database);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log("\nExisting tables:");
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    await client.end();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

testConnection();
