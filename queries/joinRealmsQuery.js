
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

module.exports = {
    joinRealm: async (joinerId, realmId) => {
        try {
            const query = `
                INSERT INTO "JoinRealm" (joinerid, realmid)
                VALUES ($1, $2)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [joinerId, realmId]);
            return rows[0];
        } catch (error) {
            console.error("Error creating joinRealm entry", error);
            throw new Error("Error creating joinRealm entry");
        }
    },
    leaveRealm: async (joinerId, realmId) => {
        try {
            const query = `
                DELETE FROM "JoinRealm"
                WHERE joinerid = $1 AND realmid = $2
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [joinerId, realmId]);
            return rows[0];
        } catch (error) {
            console.error("Error deleting joinRealm entry", error);
            throw new Error("Error deleting joinRealm entry");
        }
    },
};