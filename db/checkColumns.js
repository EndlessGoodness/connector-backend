require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function checkColumns() {
  try {
    console.log("Checking column names...");
    
    const postColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Post' 
      ORDER BY ordinal_position
    `);
    console.log("\nPost table columns:");
    postColumns.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    const likeColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Like' 
      ORDER BY ordinal_position
    `);
    console.log("\nLike table columns:");
    likeColumns.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    const commentColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Comment' 
      ORDER BY ordinal_position
    `);
    console.log("\nComment table columns:");
    commentColumns.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
