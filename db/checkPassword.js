require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function checkPassword() {
  try {
    const result = await pool.query('SELECT password FROM "User" WHERE username = $1', ['johndoe']);
    if (result.rows.length > 0) {
      const hashedPassword = result.rows[0].password;
      console.log('Password hash:', hashedPassword);
      
      const passwords = ['password123', 'password', 'johndoe', 'securepassword123'];
      for (const pwd of passwords) {
        const isValid = await bcrypt.compare(pwd, hashedPassword);
        console.log(`Password "${pwd}" is valid:`, isValid);
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking password:', error.message);
  } finally {
    await pool.end();
  }
}

checkPassword();
