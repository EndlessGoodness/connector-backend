
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
    addCommentLike: async (userId, commentId) => {
        try {
            const insertQuery = `
                INSERT INTO "CommentLike" (userId, commentId)
                VALUES ($1, $2)
                RETURNING *;
            `;
            const { rows } = await pool.query(insertQuery, [userId, commentId]);
            // Optionally fetch the comment as well if needed
            return rows[0];
        } catch (error) {
            console.error("Error adding like to comment", error);
            throw new Error("Error adding like to comment");
        }
    },
    removeCommentLike: async (userId, commentId) => {
        try {
            const deleteQuery = `
                DELETE FROM "CommentLike"
                WHERE userId = $1 AND commentId = $2
                RETURNING *;
            `;
            const { rows } = await pool.query(deleteQuery, [userId, commentId]);
            return rows[0];
        } catch (error) {
            console.error("Error removing like to comment", error);
            throw new Error("Error removing like to comment");
        }
    }
};