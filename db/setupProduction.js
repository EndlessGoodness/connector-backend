// Production Database Setup Script
// Run this on Render to set up your database schema and sample data

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});

console.log('🚀 Production Database Setup');
console.log('============================');

async function setupProductionDatabase() {
  try {
    console.log('📊 Checking database connection...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connected to database at: ${testResult.rows[0].current_time}`);
    
    console.log('\n📋 Creating database schema...');
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        bio TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ User table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Post" (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Post table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Comment" (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "postId" INTEGER REFERENCES "Post"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Comment table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Realm" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        "createdBy" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Realm table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "isRead" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Notification table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Follow" (
        id SERIAL PRIMARY KEY,
        "followerId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "followingId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("followerId", "followingId")
      );
    `);
    console.log('✅ Follow table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Like" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "postId" INTEGER REFERENCES "Post"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "postId")
      );
    `);
    console.log('✅ Like table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CommentLike" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "commentId" INTEGER REFERENCES "Comment"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "commentId")
      );
    `);
    console.log('✅ CommentLike table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "JoinRealm" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "realmId" INTEGER REFERENCES "Realm"(id) ON DELETE CASCADE,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "realmId")
      );
    `);
    console.log('✅ JoinRealm table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        "senderId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "receiverId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Message table created');
    
    console.log('\n🗂️ Creating indexes for better performance...');
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_user ON "Post"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_created ON "Post"("createdAt");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_post ON "Comment"("postId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_user ON "Comment"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follow_follower ON "Follow"("followerId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_follow_following ON "Follow"("followingId");`);
    
    console.log('✅ Database indexes created');
    
    console.log('\n👥 Inserting sample data...');
    
    // Check if data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM "User"');
    
    if (parseInt(userCount.rows[0].count) === 0) {
      // Insert sample users
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const users = [
        ['johndoe', 'john@example.com', hashedPassword, 'Software developer and tech enthusiast'],
        ['janedoe', 'jane@example.com', hashedPassword, 'UI/UX designer with a passion for user experience'],
        ['bobsmith', 'bob@example.com', hashedPassword, 'Product manager and startup advisor'],
        ['alicejohnson', 'alice@example.com', hashedPassword, 'Data scientist and machine learning researcher'],
        ['charliewilson', 'charlie@example.com', hashedPassword, 'Full-stack developer and open source contributor']
      ];
      
      for (const [username, email, password, bio] of users) {
        await pool.query(
          'INSERT INTO "User" (username, email, password, bio) VALUES ($1, $2, $3, $4)',
          [username, email, password, bio]
        );
      }
      console.log('✅ Sample users created');
      
      // Insert sample posts
      const posts = [
        [1, 'Welcome to Connector!', 'This is my first post on this amazing platform. Looking forward to connecting with everyone!'],
        [2, 'UI/UX Best Practices', 'Here are some essential UI/UX principles that every designer should know...'],
        [1, 'Learning Node.js', 'Just finished building a REST API with Express. The learning curve was worth it!'],
        [3, 'Product Management Tips', 'Sharing some insights from my experience in product management and team leadership.'],
        [4, 'Data Science Trends', 'Machine learning and AI are revolutionizing how we analyze and interpret data.'],
        [5, 'Open Source Contribution', 'Contributing to open source projects has been an amazing journey for learning and growth.'],
        [2, 'Design Systems', 'Building consistent design systems is crucial for scaling products effectively.'],
        [1, 'Backend Development', 'Working with databases and APIs has taught me so much about software architecture.']
      ];
      
      for (const [userId, title, content] of posts) {
        await pool.query(
          'INSERT INTO "Post" (title, content, "userId") VALUES ($1, $2, $3)',
          [title, content, userId]
        );
      }
      console.log('✅ Sample posts created');
      
      // Insert sample realms
      const realms = [
        ['Tech Talk', 'Discussions about technology and programming', 1],
        ['Design Hub', 'UI/UX design discussions and feedback', 2],
        ['Startup Corner', 'Entrepreneurship and startup discussions', 3],
        ['Data Science', 'Data analysis, ML, and AI discussions', 4],
        ['Open Source', 'Open source projects and contributions', 5]
      ];
      
      for (const [name, description, createdBy] of realms) {
        await pool.query(
          'INSERT INTO "Realm" (name, description, "createdBy") VALUES ($1, $2, $3)',
          [name, description, createdBy]
        );
      }
      console.log('✅ Sample realms created');
      
      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('ℹ️ Sample data already exists, skipping insertion');
    }
    
    console.log('\n🎉 Production database setup completed successfully!');
    console.log('\n📊 Database Statistics:');
    
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "User"'),
      pool.query('SELECT COUNT(*) FROM "Post"'),
      pool.query('SELECT COUNT(*) FROM "Realm"')
    ]);
    
    console.log(`   Users: ${stats[0].rows[0].count}`);
    console.log(`   Posts: ${stats[1].rows[0].count}`);
    console.log(`   Realms: ${stats[2].rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your environment variables');
    console.log('   2. Ensure your PostgreSQL database is running');
    console.log('   3. Verify SSL settings for Render PostgreSQL');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };
