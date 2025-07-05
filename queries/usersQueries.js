const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });

module.exports = {
    getAllUsers: async () => {
        try {
            const { rows } = await pool.query('SELECT * FROM "user"');
            return rows;
        } catch (error) {
            console.error('Error getting users:', error);
            throw new Error('Error getting users');
        }
    },
    existUser: async (colName, query) => {
        try {
            const sql = `SELECT * FROM "user" WHERE "${colName}" = $1`;
            const { rows } = await pool.query(sql, [query]);
            return rows[0];
        } catch (error) {
            console.error('Could not find user:', error);
            throw new Error('Error finding user');
        }
    },
    getSuggestedUsers: async (id, take) => {
        try {
            // Get user's followers and following
            const followersRes = await pool.query('SELECT followerId FROM follows WHERE followingId = $1', [id]);
            const followingRes = await pool.query('SELECT followingId FROM follows WHERE followerId = $1', [id]);
            const userFollowersIds = followersRes.rows.map(row => row.followerid);
            const userFollowingIds = followingRes.rows.map(row => row.followingid);

            // Step 1: Find users with mutual followers
            let suggestedUsers = [];
            if (userFollowersIds.length > 0 || userFollowingIds.length > 0) {
                const mutualQuery = `
                    SELECT u.*, 
                        (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                        (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                        (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                        (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                        (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                    FROM "user" u
                    WHERE u.id != $1
                      AND u.id NOT IN (${userFollowingIds.length ? userFollowingIds.map((_,i)=>`$${i+2}`).join(',') : 'NULL'})
                      AND (
                        u.id IN (SELECT f."followingId" FROM follows f WHERE f."followerId" = ANY($2::uuid[]))
                        OR u.id IN (SELECT f."followingId" FROM follows f WHERE f."followerId" = ANY($3::uuid[]))
                      )
                    ORDER BY followers_count DESC
                    LIMIT $${userFollowingIds.length+4}
                `;
                const params = [id, userFollowersIds, userFollowingIds, take, ...userFollowingIds];
                const mutualRes = await pool.query(mutualQuery, params);
                suggestedUsers = mutualRes.rows;
            }
            // Step 2: If not enough, get the most popular users
            if (suggestedUsers.length < 4) {
                const excludeIds = [id, ...suggestedUsers.map(u=>u.id), ...userFollowingIds];
                const popQuery = `
                    SELECT u.*, 
                        (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                        (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                        (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                        (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                        (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                    FROM "user" u
                    WHERE u.id NOT IN (${excludeIds.map((_,i)=>`$${i+1}`).join(',')})
                    ORDER BY followers_count DESC
                    LIMIT $${excludeIds.length+1}
                `;
                const params = [...excludeIds, take - suggestedUsers.length];
                const popRes = await pool.query(popQuery, params);
                return [...suggestedUsers, ...popRes.rows];
            }
            return suggestedUsers;
        } catch (error) {
            console.error('Could not get user suggested users:', error);
            throw new Error('Error getting user suggested users');
        }
    },
    getUser: async (colName, query) => {
        try {
            const sql = `SELECT u.*, 
                (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM "user" u WHERE u."${colName}" = $1`;
            const { rows } = await pool.query(sql, [query]);
            return rows[0];
        } catch (error) {
            console.error('Error finding user:', error);
            throw new Error('Error finding user');
        }
    },
    addUser: async (email, username, password) => {
        try {
            const hashedPassword = await new Promise((resolve, reject) => {
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) return reject(err);
                    resolve(hashedPassword);
                });
            });
            const sql = `
                INSERT INTO "user" (email, username, password, "profilePictureUrl", "profilePicturePublicId")
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const { rows } = await pool.query(sql, [
                email,
                username,
                hashedPassword,
                process.env.DEFAULT_PROFILE_PICTURE_URL,
                process.env.DEFAULT_PROFILE_PICTURE_PUBLIC_ID
            ]);
            return rows[0];
        } catch (error) {
            console.error('Error adding user', error);
            throw new Error('Error adding user');
        }
    },
    updateUser: async (id, username, bio) => {
        try {
            const sql = `
                UPDATE "user"
                SET username = $1, bio = $2
                WHERE id = $3
                RETURNING *
            `;
            const { rows } = await pool.query(sql, [username, bio, id]);
            return rows[0];
        } catch (error) {
            console.error('Error updating user', error);
            throw new Error('Error updating user');
        }
    },
    deleteUser: async (id) => {
        try {
            const sql = `DELETE FROM "user" WHERE id = $1 RETURNING *`;
            const { rows } = await pool.query(sql, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error deleting user", error);
            throw new Error("Error deleting user");
        }
    },
    getUserFollowers: async (id, page, limit) => {
        const offset = (page && limit) ? (page - 1) * limit : 0;
        try {
            const sql = `
                SELECT u.*, 
                    (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM follows f
                JOIN "user" u ON f."followerId" = u.id
                WHERE f."followingId" = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(sql, [id, offset, limit || 10]);
            return rows;
        } catch (error) {
            console.error("Error getting user's followers", error);
            throw new Error("Error getting user's followers");
        }
    },
    getUserFollowing: async (id, page, limit) => {
        const offset = (page && limit) ? (page - 1) * limit : 0;
        try {
            const sql = `
                SELECT u.*, 
                    (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM follows f
                JOIN "user" u ON f."followingId" = u.id
                WHERE f."followerId" = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(sql, [id, offset, limit || 10]);
            return rows;
        } catch (error) {
            console.error("Error getting user's following", error);
            throw new Error("Error getting user's following");
        }
    },
    getUsersWhoLikedPost: async (postId, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const sql = `
                SELECT u.*, 
                    (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM likes l
                JOIN "user" u ON l."userId" = u.id
                WHERE l."postId" = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(sql, [postId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users who liked post", error);
            throw new Error("Error getting users who liked post");
        }
    },
    getUsersWhoLikedComment: async (commentId, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const sql = `
                SELECT u.*, 
                    (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM commentlikes cl
                JOIN "user" u ON cl."userId" = u.id
                WHERE cl."commentId" = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(sql, [commentId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting users who liked comment", error);
            throw new Error("Error getting users who liked comment");
        }
    },
    getRealmJoiners: async (realmId, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const sql = `
                SELECT u.*, 
                    (SELECT COUNT(*) FROM post p WHERE p."authorId" = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM likes l WHERE l."userId" = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c."userId" = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followingId" = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM follows f WHERE f."followerId" = u.id) AS following_count
                FROM joinedrealms jr
                JOIN "user" u ON jr."joinerId" = u.id
                WHERE jr."realmId" = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(sql, [realmId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting realm's joined users", error);
            throw new Error("Error getting realm's joined users");
        }
    },
    getUserProfilePicturePublicId: async (id) => {
        try {
            const sql = 'SELECT "profilePicturePublicId" FROM "user" WHERE id = $1';
            const { rows } = await pool.query(sql, [id]);
            return rows[0]?.profilePicturePublicId;
        } catch (error) {
            console.error('Error getting user profile picture public id', error);
            throw new Error('Error getting user profile picture public id');
        }
    },
    updateUserProfilePicture: async (id, url, public_id) => {
        try {
            const sql = `
                UPDATE "user"
                SET "profilePictureUrl" = $1, "profilePicturePublicId" = $2
                WHERE id = $3
                RETURNING *
            `;
            const { rows } = await pool.query(sql, [url, public_id, id]);
            return rows[0];
        } catch (error) {
            console.error("Error updating user profile photo", error);
            throw new Error("Error updating user profile photo");
        }
    },
}