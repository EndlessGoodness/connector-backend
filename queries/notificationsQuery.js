const { Pool } = require('pg');
const { getIO } = require('../utils/socket');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

module.exports = {
    createUserFollowNotification: async (userId, actorId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", type, "sourceType")
                VALUES ($1, $2, 'follow', 'USER')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating user follow notification', error);
            throw new Error('Error creating user follow notification');
        }
    },

    createRealmJoinNotification: async (userId, actorId, realmId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", "realmId", type, "sourceType")
                VALUES ($1, $2, $3, 'realm_join', 'REALM')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId, realmId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating realm join notification', error);
            throw new Error('Error creating realm join notification');
        }
    },

    createPostLikeNotification: async (userId, actorId, postId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", "postId", type, "sourceType")
                VALUES ($1, $2, $3, 'post_like', 'POST')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId, postId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating post like notification', error);
            throw new Error('Error creating post like notification');
        }
    },

    createPostCommentNotification: async (userId, actorId, postId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", "postId", type, "sourceType")
                VALUES ($1, $2, $3, 'post_comment', 'POST')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId, postId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating post comment notification', error);
            throw new Error('Error creating post comment notification');
        }
    },

    createCommentLikeNotification: async (userId, actorId, commentId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", "commentId", type, "sourceType")
                VALUES ($1, $2, $3, 'comment_like', 'COMMENT')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId, commentId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating comment like notification', error);
            throw new Error('Error creating comment like notification');
        }
    },

    createCommentReplyNotification: async (userId, actorId, commentId) => {
        try {
            const query = `
                INSERT INTO "Notification" ("userId", "actorId", "commentId", type, "sourceType")
                VALUES ($1, $2, $3, 'comment_reply', 'COMMENT')
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [userId, actorId, commentId]);
            const notification = rows[0];
            const io = getIO();
            io.to(`notifications_${userId}`).emit('receiveNotification', notification);
            return notification;
        } catch (error) {
            console.error('Error creating comment reply notification', error);
            throw new Error('Error creating comment reply notification');
        }
    },
    getNotifications: async (userId, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const query = `
                SELECT * FROM "Notification"
                WHERE "userId" = $1
                ORDER BY "createdAt" DESC
                OFFSET $2 LIMIT $3;
            `;
            const { rows } = await pool.query(query, [userId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting notifications", error);
            throw new Error("Error getting notifications");
        }
    }
};