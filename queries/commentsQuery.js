
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


// Recursive query function using SQL (CTE)
const getFullNestedCommentsCount = async function getFullNestedCommentsCount(commentId) {
    try {
        const query = `
            WITH RECURSIVE nested_comments AS (
                SELECT id FROM "Comment" WHERE parentId = $1
                UNION ALL
                SELECT c.id FROM "Comment" c
                INNER JOIN nested_comments nc ON c.parentId = nc.id
            )
            SELECT COUNT(*) FROM nested_comments;
        `;
        const { rows } = await pool.query(query, [commentId]);
        return parseInt(rows[0].count, 10);
    } catch (error) {
        console.error("Error counting nested comments", error);
        throw new Error("Error counting nested comments");
    }
};

module.exports = {
    getAllComments: async () => {
        try {
            const query = 'SELECT * FROM "Comment"';
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error("Error getting all comments", error);
            throw new Error("Error getting all comments");
        }
    },
    getComment: async (id) => {
        try {
            const query = 'SELECT * FROM "Comment" WHERE id = $1';
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error getting comment by id", error);
            throw new Error("Error getting comment by id");
        }
    },
    getPostRootComments: async (postId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        const orderBy = sortField ? `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}` : '';
        try {
            const query = `
                SELECT * FROM "Comment"
                WHERE postid = $1 AND parentid IS NULL
                ${orderBy}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(query, [postId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting post root comments", error);
            throw new Error("Error getting post root comments");
        }
    },
    addRootComment: async (userId, postId, commentContent) => {
        try {
            const query = `
                INSERT INTO "Comment" (comment, userid, postid)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [commentContent, userId, postId]);
            return rows[0];
        } catch (error) {
            console.error("Error adding comment", error);
            throw new Error("Error adding comment");
        }
    },
    updateCommentContent: async (id, commentContent) => {
        try {
            const query = `
                UPDATE "Comment"
                SET comment = $1
                WHERE id = $2
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [commentContent, id]);
            return rows[0];
        } catch (error) {
            console.error("Error editing comment", error);
            throw new Error("Error editing comment");
        }
    },
    deleteComment: async (id) => {
        try {
            const query = 'DELETE FROM "Comment" WHERE id = $1 RETURNING *;';
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error deleting comment", error);
            throw new Error("Error deleting comment");
        }
    },
    getNestedComments: async (id, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        const orderBy = sortField ? `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}` : '';
        try {
            const query = `
                SELECT * FROM "Comment"
                WHERE parentid = $1
                ${orderBy}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(query, [id, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting nested comments", error);
            throw new Error("Error getting nested comments");
        }
    },
    addNestedComment: async (userId, postId, commentContent, parentId) => {
        try {
            const query = `
                INSERT INTO "Comment" (comment, userid, postid, parentid)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [commentContent, userId, postId, parentId]);
            return rows[0];
        } catch (error) {
            console.error("Error adding nested comment", error);
            throw new Error("Error adding nested comment");
        }
    },
    getPostCommentCount: async (postId) => {
        try {
            const query = `
                SELECT COUNT(*) FROM "Comment" WHERE postid = $1;
            `;
            const { rows } = await pool.query(query, [postId]);
            return parseInt(rows[0].count, 10);
        } catch (error) {
            console.error("Error getting post comment count", error);
            throw new Error("Error getting post comment count");
        }
    },
    getFullNestedCommentsCount
};