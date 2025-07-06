require("dotenv").config();
const { Pool } = require("pg");

async function testDatabaseIntegration() {
  console.log("Testing database integration with the application...");
  
  // Test the same pool configuration used in the app
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log("✅ Pool connection successful!");
    
    // Test a simple query that the app might use
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM "User"');
    console.log(`📊 Current user count: ${userCountResult.rows[0].count}`);
    
    const postCountResult = await client.query('SELECT COUNT(*) as count FROM "Post"');
    console.log(`📊 Current post count: ${postCountResult.rows[0].count}`);
    
    const realmCountResult = await client.query('SELECT COUNT(*) as count FROM "Realm"');
    console.log(`📊 Current realm count: ${realmCountResult.rows[0].count}`);
    
    // Test a more complex query similar to what the app uses
    const complexQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(p.id) as post_count
      FROM "User" u
      LEFT JOIN "Post" p ON u.id = p.authorid
      GROUP BY u.id, u.username, u.email
      LIMIT 5
    `;
    
    const complexResult = await client.query(complexQuery);
    console.log("\n📋 Sample user data with post counts:");
    complexResult.rows.forEach(row => {
      console.log(`  ${row.username} (${row.email}): ${row.post_count} posts`);
    });
    
    client.release();
    await pool.end();
    
    console.log("\n✅ Database integration test completed successfully!");
    console.log("🎉 The backend should be able to connect to the database without issues!");
    
  } catch (err) {
    console.error("❌ Database integration test failed:", err.message);
    console.error("Stack trace:", err.stack);
  }
}

testDatabaseIntegration();
