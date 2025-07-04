const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

module.exports = {
    addLike: async (userId, postId) => {
        try {
            const query = `
                INSERT INTO "Like" ("userId", "postId")
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
                WHERE "userId" = $1 AND "postId" = $2
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