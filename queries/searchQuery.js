
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
    getSearchResults: async (search, type, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            if (type === 'users') {
                const usersQuery = `
                    SELECT * FROM "User"
                    WHERE username ILIKE $1 OR bio ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(usersQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'realms') {
                const realmsQuery = `
                    SELECT * FROM "Realm"
                    WHERE name ILIKE $1 OR description ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(realmsQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'posts') {
                const postsQuery = `
                    SELECT p.*, u.*, i.*
                    FROM "Post" p
                    LEFT JOIN "User" u ON p.authorid = u.id
                    LEFT JOIN images i ON i.postid = p.id
                    WHERE p.title ILIKE $1 OR p.text ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(postsQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'all') {
                // Users
                const usersQuery = `SELECT * FROM "User" WHERE username ILIKE $1 OR bio ILIKE $1 LIMIT $2`;
                const realmsQuery = `SELECT * FROM "Realm" WHERE name ILIKE $1 OR description ILIKE $1 LIMIT $2`;
                const postsQuery = `
                    SELECT p.*, u.*, i.*
                    FROM "Post" p
                    LEFT JOIN "User" u ON p.authorid = u.id
                    LEFT JOIN images i ON i.postid = p.id
                    WHERE p.title ILIKE $1 OR p.text ILIKE $1
                    LIMIT $2
                `;
                const [usersRes, realmsRes, postsRes] = await Promise.all([
                    pool.query(usersQuery, [`%${search}%`, limit]),
                    pool.query(realmsQuery, [`%${search}%`, limit]),
                    pool.query(postsQuery, [`%${search}%`, limit])
                ]);
                // Combine and paginate
                const combined = [...usersRes.rows, ...realmsRes.rows, ...postsRes.rows];
                const paginated = combined.slice(offset, offset + limit);
                return paginated;
            }
        } catch (error) {
            console.error('Error getting search results:', error);
            throw new Error('Error getting search results');
        }
    }
}