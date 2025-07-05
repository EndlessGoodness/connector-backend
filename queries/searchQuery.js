
const { Pool } = require('pg');
require('dotenv').config();
const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });

module.exports = {
    getSearchResults: async (search, type, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            if (type === 'users') {
                const usersQuery = `
                    SELECT * FROM "user"
                    WHERE username ILIKE $1 OR bio ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(usersQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'realms') {
                const realmsQuery = `
                    SELECT * FROM realm
                    WHERE name ILIKE $1 OR description ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(realmsQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'posts') {
                const postsQuery = `
                    SELECT p.*, u.*, i.*
                    FROM post p
                    LEFT JOIN "user" u ON p."authorId" = u.id
                    LEFT JOIN images i ON i."postId" = p.id
                    WHERE p.title ILIKE $1 OR p.text ILIKE $1
                    OFFSET $2 LIMIT $3
                `;
                const { rows } = await pool.query(postsQuery, [`%${search}%`, offset, limit]);
                return rows;
            } else if (type === 'all') {
                // Users
                const usersQuery = `SELECT * FROM "user" WHERE username ILIKE $1 OR bio ILIKE $1 LIMIT $2`;
                const realmsQuery = `SELECT * FROM realm WHERE name ILIKE $1 OR description ILIKE $1 LIMIT $2`;
                const postsQuery = `
                    SELECT p.*, u.*, i.*
                    FROM post p
                    LEFT JOIN "user" u ON p."authorId" = u.id
                    LEFT JOIN images i ON i."postId" = p.id
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