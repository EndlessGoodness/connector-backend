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
            const { rows } = await pool.query('SELECT * FROM "User"');
            return rows;
        } catch (error) {
            console.error('Error getting users:', error);
            throw new Error('Error getting users');
        }
    },
    existUser: async (colName, query) => {
        try {
            const sql = `SELECT * FROM "User" WHERE "${colName}" = $1`;
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
            const followersRes = await pool.query('SELECT followerId FROM "Follow" WHERE followingId = $1', [id]);
            const followingRes = await pool.query('SELECT followingId FROM "Follow" WHERE followerId = $1', [id]);
            const userFollowersIds = followersRes.rows.map(row => row.followerid);
            const userFollowingIds = followingRes.rows.map(row => row.followingid);

            // Step 1: Find users with mutual followers
            let suggestedUsers = [];
            if (userFollowersIds.length > 0 || userFollowingIds.length > 0) {
                const mutualQuery = `
                    SELECT u.*, 
                        (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                        (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                        (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                        (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                        (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                    FROM "User" u
                    WHERE u.id != $1
                      AND u.id NOT IN (${userFollowingIds.length ? userFollowingIds.map((_,i)=>`$${i+2}`).join(',') : 'NULL'})
                      AND (
                        u.id IN (SELECT f.followingid FROM "Follow" f WHERE f.followerid = ANY($2::uuid[]))
                        OR u.id IN (SELECT f.followingid FROM "Follow" f WHERE f.followerid = ANY($3::uuid[]))
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
                        (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                        (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                        (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                        (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                        (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                    FROM "User" u
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
                (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM "User" u WHERE u."${colName}" = $1`;
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
                INSERT INTO "User" (email, username, password, profilepictureurl, profilepicturepublicid)
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
                UPDATE "User"
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
            const sql = `DELETE FROM "User" WHERE id = $1 RETURNING *`;
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
                    (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM "Follow" f
                JOIN "User" u ON f.followerid = u.id
                WHERE f.followingid = $1
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
                    (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM "Follow" f
                JOIN "User" u ON f.followingid = u.id
                WHERE f.followerid = $1
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
                    (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM "Like" l
                JOIN "User" u ON l.userid = u.id
                WHERE l.postid = $1
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
                    (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM commentlikes cl
                JOIN "User" u ON cl.userid = u.id
                WHERE cl.commentid = $1
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
                    (SELECT COUNT(*) FROM "Post" p WHERE p.authorid = u.id AND p.published = true) AS posts_count,
                    (SELECT COUNT(*) FROM "Like" l WHERE l.userid = u.id) AS likes_count,
                    (SELECT COUNT(*) FROM "Comment" c WHERE c.userid = u.id) AS comments_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followingid = u.id) AS followers_count,
                    (SELECT COUNT(*) FROM "Follow" f WHERE f.followerid = u.id) AS following_count
                FROM joinedrealms jr
                JOIN "User" u ON jr.joinerid = u.id
                WHERE jr.realmid = $1
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
            const sql = 'SELECT profilepicturepublicid FROM "User" WHERE id = $1';
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
                UPDATE "User"
                SET profilepictureurl = $1, profilepicturepublicid = $2
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