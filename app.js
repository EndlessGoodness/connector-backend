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