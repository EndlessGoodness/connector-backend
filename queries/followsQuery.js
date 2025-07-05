
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

module.exports = {
    addFollow: async (followerId, followingId) => {
        try {
            const query = `
                INSERT INTO "Follow" ("followerId", "followingId")
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
                WHERE "followerId" = $1 AND "followingId" = $2
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