require("dotenv").config();
const path = require("node:path");

const { Pool } = require("pg");

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;

// Import Routes
const usersRoutes = require("./routes/userRoute");
const postsRoutes = require("./routes/postRoute");
const commentsRoutes = require("./routes/commentRoute");
const imagesRoutes = require("./routes/imagesRoute");
const searchRoutes = require('./routes/searchRoutes');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) =>{
    res.render("index",{user:req.user});
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
      req.body.username,
      hashedPassword,
    ]);
    res.redirect("/");
  } catch(err) {
    return next(err);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
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
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
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
  res.redirect('/'); // or res.status(401).json({ message: 'Unauthorized' });
}
app.use('/users', ensureAuthenticated, usersRoutes);
app.use('/posts', ensureAuthenticated, postsRoutes);
app.use('/comments', ensureAuthenticated, commentsRoutes);
app.use('/images', ensureAuthenticated, imagesRoutes);
app.use('/search', ensureAuthenticated, searchRoutes);

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

app.listen(3000, () => console.log("app listening on port 3000!"));