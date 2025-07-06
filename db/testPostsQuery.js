require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function testPostsQuery() {
  try {
    console.log("Testing posts query...");
    
    // Test the exact query from postsQuery.js
    const postsQuery = `
        SELECT p.*, 
            r.*, 
            a.*, 
            (SELECT COUNT(*) FROM "Like" l WHERE l.postid = p.id) AS likes_count,
            (SELECT COUNT(*) FROM "Comment" c WHERE c.postid = p.id) AS comments_count
        FROM "Post" p
        LEFT JOIN "Realm" r ON p.realmid = r.id
        LEFT JOIN "User" a ON p.authorid = a.id
        WHERE p.published = true
        ORDER BY p.createdat DESC
        OFFSET 0 LIMIT 10
    `;
    
    console.log("Executing query...");
    const { rows } = await pool.query(postsQuery);
    console.log(`✅ Query successful! Found ${rows.length} posts`);
    
    if (rows.length > 0) {
      console.log("\nFirst post:");
      console.log(`  Title: ${rows[0].title}`);
      console.log(`  Author: ${rows[0].username}`);
      console.log(`  Likes: ${rows[0].likes_count}`);
      console.log(`  Comments: ${rows[0].comments_count}`);
    }
    
  } catch (error) {
    console.error("❌ Query failed:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    await pool.end();
  }
}

testPostsQuery();
