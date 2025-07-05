const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: databaseUrl,
});

module.exports = {
    getAllPosts: async (page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p.published = true
                ${orderClause}
                OFFSET $1 LIMIT $2
            `;
            const { rows } = await pool.query(postsQuery, [offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting all posts", error);
            throw new Error("Error getting all posts");
        }
    },
    getFeed: async (followingUserIds, joinedRealmIds, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT DISTINCT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p.published = true
                  AND (
                    p."authorId" = ANY($1::uuid[])
                    OR p."realmId" = ANY($2::uuid[])
                  )
                ${orderClause}
                OFFSET $3 LIMIT $4
            `;
            const { rows } = await pool.query(postsQuery, [followingUserIds, joinedRealmIds, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting feed", error);
            throw new Error("Error getting feed");
        }
    },
    getUserPosts: async (authorId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p."authorId" = $1 AND p.published = true
                ${orderClause}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(postsQuery, [authorId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users posts", error);
            throw new Error("Error getting users posts");
        }
    },
    getUserDrafts: async (authorId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const draftsQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p."authorId" = $1 AND p.published = false
                ${orderClause}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(draftsQuery, [authorId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users drafts", error);
            throw new Error("Error getting users draft");
        }
    },
    getUserLikedPosts: async (userId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p.published = true
                  AND p.id IN (
                    SELECT l."postId" FROM likes l WHERE l."userId" = $1
                  )
                ${orderClause}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(postsQuery, [userId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users liked posts", error);
            throw new Error("Error getting users liked posts");
        }
    },
    getUserCommentedPosts: async (userId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT DISTINCT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p.published = true
                  AND (
                    p.id IN (SELECT c."postId" FROM comments c WHERE c."userId" = $1)
                    OR p.id IN (
                        SELECT c2."postId" FROM comments c2
                        WHERE c2.id IN (
                            SELECT nc."parentId" FROM comments nc WHERE nc."userId" = $1 AND nc."parentId" IS NOT NULL
                        )
                    )
                  )
                ${orderClause}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(postsQuery, [userId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users commented posts", error);
            throw new Error("Error getting users commented posts");
        }
    },
    getRealmPosts: async (realmId, page, limit, sortField, sortOrder) => {
        const offset = (page - 1) * limit;
        let orderClause = '';
        if (sortField === 'comments' || sortField === 'likes') {
            orderClause = `ORDER BY ${sortField}_count ${sortOrder.toUpperCase()}`;
        } else {
            orderClause = `ORDER BY "${sortField}" ${sortOrder.toUpperCase()}`;
        }
        try {
            const postsQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."postId" = p.id) AS comments_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p."realmId" = $1 AND p.published = true
                ${orderClause}
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(postsQuery, [realmId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting realms posts", error);
            throw new Error("Error getting realms posts");
        }
    },
    getPost: async (id) => {
        try {
            const postQuery = `
                SELECT p.*, 
                    r.*, 
                    a.*, 
                    (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) AS likes_count
                FROM post p
                LEFT JOIN realm r ON p."realmId" = r.id
                LEFT JOIN "user" a ON p."authorId" = a.id
                WHERE p.id = $1
            `;
            const { rows } = await pool.query(postQuery, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error getting post", error);
            throw new Error("Error getting post");
        }
    },
    createPost: async (postData) => {
        // postData: { title, content, authorId, realmId, published, ... }
        const fields = Object.keys(postData);
        const values = Object.values(postData);
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
        try {
            const insertQuery = `
                INSERT INTO post (${fields.map(f => `"${f}"`).join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;
            const { rows } = await pool.query(insertQuery, values);
            return rows[0];
        } catch (error) {
            console.error("Error creating post", error);
            throw new Error("Error creating post");
        }
    },
    updatePost: async (id, updatedPostData) => {
        // updatedPostData: { title, content, ... }
        const fields = Object.keys(updatedPostData);
        const values = Object.values(updatedPostData);
        const setClause = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
        try {
            const updateQuery = `
                UPDATE post
                SET ${setClause}
                WHERE id = $${fields.length + 1}
                RETURNING *
            `;
            const { rows } = await pool.query(updateQuery, [...values, id]);
            return rows[0];
        } catch (error) {
            console.error("Error updating post", error);
            throw new Error("Error updating post");
        }
    },
    deletePost: async (id) => {
        try {
            const deleteQuery = `
                DELETE FROM post
                WHERE id = $1
                RETURNING *
            `;
            const { rows } = await pool.query(deleteQuery, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error deleting post", error);
            throw new Error("Error deleting post");
        }
    },
}