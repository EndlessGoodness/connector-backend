require("dotenv").config();
const bcrypt = require('bcryptjs');
const path = require("node:path");
const http = require('http');

const { Pool } = require("pg");

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const cors = require("cors");

// Import Routes
const usersRoutes = require("./routes/userRoute");
const postsRoutes = require("./routes/postRoute");
const commentsRoutes = require("./routes/commentRoute");
const imagesRoutes = require("./routes/imagesRoute");
const searchRoutes = require('./routes/searchRoute');
const realmsRoutes = require("./routes/realmRoute");

const { validateUser } = require('./utils/validator');
const { validationResult } = require('express-validator');
const notificationRoutes = require('./routes/notificationRoute');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const app = express();

const server = http.createServer(app);
// --- SOCKET.IO SETUP ---
const socketSetup = require('./utils/socket');
socketSetup(server);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: process.env.SESSION_SECRET || "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());

const FRONTEND_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173';

// Configure CORS
app.use(cors({
    origin: FRONTEND_URL, // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Adjust based on your needs
    credentials: true, // Allow credentials
  }));

  console.log("using frontendurl:", FRONTEND_URL);

// Body parsing middleware
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For application/x-www-form-urlencoded form-data

app.get("/", (req, res) =>{
    res.render("index",{user:req.user});
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post(
  "/sign-up",
  validateUser,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("sign-up-form", {
        errors: errors.array(),
        user: req.user,
        formData: req.body
      });
    }
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await pool.query(
        "INSERT INTO \"User\" (email, username, password) VALUES ($1, $2, $3)",
        [req.body.email, req.body.username, hashedPassword]
      );
      res.redirect("/");
    } catch (err) {
      return next(err);
    }
  }
);

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query("SELECT * FROM \"User\" WHERE username = $1", [username]);
      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM \"User\" WHERE id = $1", [id]);
    const user = rows[0];

    done(null, user);
  } catch(err) {
    done(err);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })
);
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Check if it's an API request (JSON) or a web request
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.redirect('/'); // For web requests
}
app.use('/users', ensureAuthenticated, usersRoutes);
app.use('/posts', ensureAuthenticated, postsRoutes);
app.use('/comments', ensureAuthenticated, commentsRoutes);
app.use('/images', ensureAuthenticated, imagesRoutes);
app.use('/search', ensureAuthenticated, searchRoutes);
app.use('/realms', ensureAuthenticated, realmsRoutes);
app.use('/notifications', ensureAuthenticated, notificationRoutes);

// Special database setup endpoint for production deployment
app.get("/setup-database", async (req, res) => {
  try {
    console.log('🚀 Starting database setup...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connected to database at: ${testResult.rows[0].current_time}`);
    
    let setupLog = [`✅ Connected to database at: ${testResult.rows[0].current_time}`];
    
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
    setupLog.push('✅ User table created');
    
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
    setupLog.push('✅ Post table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Comment" (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "postId" INTEGER REFERENCES "Post"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    setupLog.push('✅ Comment table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Realm" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        "createdBy" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    setupLog.push('✅ Realm table created');
    
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
    setupLog.push('✅ Notification table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Follow" (
        id SERIAL PRIMARY KEY,
        "followerId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "followingId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("followerId", "followingId")
      );
    `);
    setupLog.push('✅ Follow table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Like" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "postId" INTEGER REFERENCES "Post"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "postId")
      );
    `);
    setupLog.push('✅ Like table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CommentLike" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "commentId" INTEGER REFERENCES "Comment"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "commentId")
      );
    `);
    setupLog.push('✅ CommentLike table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "JoinRealm" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "realmId" INTEGER REFERENCES "Realm"(id) ON DELETE CASCADE,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "realmId")
      );
    `);
    setupLog.push('✅ JoinRealm table created');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        "senderId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "receiverId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    setupLog.push('✅ Message table created');
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_username ON "User"(username);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_user ON "Post"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_post_created ON "Post"("createdAt");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_post ON "Comment"("postId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_user ON "Comment"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");`);
    setupLog.push('✅ Database indexes created');
    
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
      setupLog.push('✅ Sample users created');
      
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
      setupLog.push('✅ Sample posts created');
      
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
      setupLog.push('✅ Sample realms created');
      setupLog.push('✅ Sample data inserted successfully');
    } else {
      setupLog.push('ℹ️ Sample data already exists, skipping insertion');
    }
    
    // Get final statistics
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) FROM "User"'),
      pool.query('SELECT COUNT(*) FROM "Post"'),
      pool.query('SELECT COUNT(*) FROM "Realm"')
    ]);
    
    setupLog.push('🎉 Production database setup completed successfully!');
    setupLog.push(`📊 Users: ${stats[0].rows[0].count}, Posts: ${stats[1].rows[0].count}, Realms: ${stats[2].rows[0].count}`);
    
    // Return success response
    res.json({
      success: true,
      message: 'Database setup completed successfully!',
      log: setupLog,
      statistics: {
        users: parseInt(stats[0].rows[0].count),
        posts: parseInt(stats[1].rows[0].count),
        realms: parseInt(stats[2].rows[0].count)
      }
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database setup failed',
      error: error.message
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack to the console
  
    // Determine the status code
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
    // Send JSON response with error details
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
});  

server.listen(3000, () => console.log('app listening on port 3000!'));