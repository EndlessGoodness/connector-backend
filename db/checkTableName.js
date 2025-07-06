require("dotenv").config();
const { Client } = require("pg");

async function checkTableName() {
  console.log("Checking table name case sensitivity...");
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  
  try {
    await client.connect();
    
    // Test User with capital U
    try {
      const userResult = await client.query('SELECT COUNT(*) FROM "User"');
      console.log('✅ "User" table (capital U) exists. Count:', userResult.rows[0].count);
    } catch (err) {
      console.log('❌ "User" table (capital U) does not exist:', err.message);
    }
    
    // Test user with lowercase u
    try {
      const userResult = await client.query('SELECT COUNT(*) FROM "user"');
      console.log('✅ "user" table (lowercase u) exists. Count:', userResult.rows[0].count);
    } catch (err) {
      console.log('❌ "user" table (lowercase u) does not exist:', err.message);
    }
    
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

checkTableName();
