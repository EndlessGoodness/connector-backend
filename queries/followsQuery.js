
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
    addFollow: async (followerId, followingId) => {
        try {
            const query = `
                INSERT INTO "Follow" (followerid, followingid)
                VALUES ($1, $2)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [followerId, followingId]);
            return rows[0];
        } catch (error) {
            console.error("Error adding follow entry", error);
            throw new Error("Error adding follow entry");
        }
    },
    removeFollow: async (followerId, followingId) => {
        try {
            const query = `
                DELETE FROM "Follow"
                WHERE followerid = $1 AND followingid = $2
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [followerId, followingId]);
            return rows[0];
        } catch (error) {
            console.error("Error removing follow entry", error);
            throw new Error("Error removing follow entry");
        }
    },
};