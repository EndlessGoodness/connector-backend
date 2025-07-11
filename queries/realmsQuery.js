
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
    getAllRealms: async (page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const query = `
                SELECT r.*, u.*, 
                    (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                    (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                FROM "Realm" r
                LEFT JOIN "User" u ON r.creatorid = u.id
                OFFSET $1 LIMIT $2
            `;
            const { rows } = await pool.query(query, [offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting all realms", error);
            throw new Error("Error getting all realms");
        }
    },
    getSuggestedRealms: async (id, take) => {
        try {
            // Get user's followers
            const followersRes = await pool.query('SELECT followerId FROM "Follow" WHERE followingId = $1', [id]);
            const userFollowersId = followersRes.rows.map(row => row.followerid);
            // Get joined realms
            const joinedRes = await pool.query('SELECT realmid FROM joinedrealms WHERE joinerid = $1', [id]);
            const joinedRealmIds = joinedRes.rows.map(row => row.realmid);

            // Find mutual realms (joined by user's followers, not already joined by user)
            let mutualRealms = [];
            if (userFollowersId.length > 0) {
                const mutualQuery = `
                    SELECT r.*, u.*, 
                        (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                        (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                    FROM "Realm" r
                    LEFT JOIN "User" u ON r.creatorid = u.id
                    WHERE r.id NOT IN (${joinedRealmIds.length ? joinedRealmIds.map((_,i)=>`$${i+2}`).join(',') : 'NULL'})
                      AND r.id IN (
                        SELECT DISTINCT realmid FROM joinedrealms WHERE joinerid = ANY($1::uuid[])
                    )
                    ORDER BY joined_count DESC
                    LIMIT $${joinedRealmIds.length+2}
                `;
                const params = [userFollowersId, ...joinedRealmIds, take];
                const mutualRes = await pool.query(mutualQuery, params);
                mutualRealms = mutualRes.rows;
            }
            // If not enough, get most popular realms not joined by user
            if (mutualRealms.length < 4) {
                const excludeIds = [...(mutualRealms.map(r=>r.id)), ...joinedRealmIds];
                const popQuery = `
                    SELECT r.*, u.*, 
                        (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                        (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                    FROM "Realm" r
                    LEFT JOIN "User" u ON r.creatorid = u.id
                    WHERE r.id NOT IN (${excludeIds.length ? excludeIds.map((_,i)=>`$${i+1}`).join(',') : 'NULL'})
                    ORDER BY joined_count DESC, posts_count DESC
                    LIMIT $${excludeIds.length+1}
                `;
                const params = [...excludeIds, take - mutualRealms.length];
                const popRes = await pool.query(popQuery, params);
                return [...mutualRealms, ...popRes.rows];
            }
            return mutualRealms;
        } catch (error) {
            console.error('Could not get user suggested realms:', error);
            throw new Error('Error getting user suggested realms');
        }
    },
    getUserJoinedRealms: async (userId, page, limit) => {
        const offset = (page && limit) ? (page - 1) * limit : 0;
        try {
            const query = `
                SELECT r.*, u.*, 
                    (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                    (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                FROM "Realm" r
                LEFT JOIN "User" u ON r.creatorid = u.id
                WHERE r.id IN (
                    SELECT realmid FROM joinedrealms WHERE joinerid = $1
                )
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(query, [userId, offset, limit || 10]);
            return rows;
        } catch (error) {
            console.error("Error getting user joined realms", error);
            throw new Error("Error getting user joined realms");
        }
    },
    getUserCreatedRealms: async (userId, page, limit) => {
        const offset = (page - 1) * limit;
        try {
            const query = `
                SELECT r.*, u.*, 
                    (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                    (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                FROM "Realm" r
                LEFT JOIN "User" u ON r.creatorid = u.id
                WHERE r.creatorid = $1
                OFFSET $2 LIMIT $3
            `;
            const { rows } = await pool.query(query, [userId, offset, limit]);
            return rows;
        } catch (error) {
            console.error("Error getting user created realms", error);
            throw new Error("Error getting user created realms");
        }
    },
    createRealm: async (creatorId, name, description) => {
        try {
            const query = `
                INSERT INTO "Realm" (creatorid, name, description, realmpictureurl, realmpicturepublicid)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const { rows } = await pool.query(query, [
                creatorId,
                name,
                description,
                process.env.DEFAULT_REALM_PICTURE_URL,
                process.env.DEFAULT_REALM_PICTURE_PUBLIC_ID
            ]);
            return rows[0];
        } catch (error) {
            console.error("Error creating realm", error);
            throw new Error("Error creating realm");
        }
    },
    updateRealm: async (id, name, description) => {
        try {
            const query = `
                UPDATE "Realm"
                SET name = $1, description = $2
                WHERE id = $3
                RETURNING *
            `;
            const { rows } = await pool.query(query, [name, description, id]);
            return rows[0];
        } catch (error) {
            console.error('Error updating realm', error);
            throw new Error('Error updating realm');
        }
    },
    deleteRealm: async (id) => {
        try {
            const query = `
                DELETE FROM "Realm"
                WHERE id = $1
                RETURNING *
            `;
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error('Error deleting realm', error);
            throw new Error('Error deleting realm');
        }
    },
    getRealm: async (id) => {
        try {
            const query = `
                SELECT r.*, u.*, 
                    (SELECT COUNT(*) FROM "Post" p WHERE p.realmid = r.id) AS posts_count,
                    (SELECT COUNT(*) FROM joinedrealms j WHERE j.realmid = r.id) AS joined_count
                FROM "Realm" r
                LEFT JOIN "User" u ON r.creatorid = u.id
                WHERE r.id = $1
            `;
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error getting realm", error);
            throw new Error("Error getting realm");
        }
    },
    getRealmPicturePublicId: async (id) => {
        try {
            const query = `SELECT realmpicturepublicid FROM "Realm" WHERE id = $1`;
            const { rows } = await pool.query(query, [id]);
            return rows[0]?.realmPicturePublicId;
        } catch (error) {
            console.error('Error getting realm picture public id', error);
            throw new Error('Error getting realm picture public id');
        }
    },
    updateRealmPicture: async (id, url, public_id) => {
        try {
            const query = `
                UPDATE "Realm"
                SET realmpictureurl = $1, realmpicturepublicid = $2
                WHERE id = $3
                RETURNING *
            `;
            const { rows } = await pool.query(query, [url, public_id, id]);
            return rows[0];
        } catch (error) {
            console.error("Error updating realm picture", error);
            throw new Error("Error updating realm picture");
        }
    },
    existRealm: async (colName, value) => {
        try {
            const query = `SELECT * FROM "Realm" WHERE "${colName}" = $1`;
            const { rows } = await pool.query(query, [value]);
            return rows[0];
        } catch (error) {
            console.error("Error getting realm existing", error);
            throw new Error("Error getting realm existing");
        }
    }
}