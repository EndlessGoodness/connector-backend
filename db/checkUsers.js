require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, username, email FROM "User" LIMIT 5');
    console.log('Users in database:');
    result.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
  } catch (error) {
    console.error('Error checking users:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
