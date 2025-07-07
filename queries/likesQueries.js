const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = {
    addLike: async (userId, postId) => {
        try {
            const query = `
                INSERT INTO "Like" (userid, postid)
                VALUES ($1, $2)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, postId]);
            return rows[0];
        } catch (error) {
            console.error("Error adding like to post", error);
            throw new Error("Error adding like to post");
        }
    },
    removeLike: async (userId, postId) => {
        try {
            const query = `
                DELETE FROM "Like"
                WHERE userid = $1 AND postid = $2
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, postId]);
            return rows[0];
        } catch (error) {
            console.error("Error removing like to post", error);
            throw new Error("Error removing like to post");
        }
    }
};