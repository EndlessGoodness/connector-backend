
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
    uploadImage: async (imageData) => {
        try {
            const query = `
                INSERT INTO "Image" (url, publicid, ownerid, postid)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const values = [
                imageData.url,
                imageData.publicId || null,
                imageData.ownerId || null,
                imageData.postId || null
            ];
            const { rows } = await pool.query(query, values);
            return rows[0];
        } catch (error) {
            console.error("Error adding image", error);
            throw new Error("Error adding image");
        }
    },
    getImage: async (id) => {
        try {
            const query = 'SELECT * FROM "Image" WHERE id = $1';
            const { rows } = await pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            console.error("Error finding images", error);
            throw new Error("Error finding images");
        }
    },
    deleteImagesArray: async (deleteIds) => {
        try {
            const query = `
                DELETE FROM "Image"
                WHERE id = ANY($1::uuid[])
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [deleteIds]);
            return rows;
        } catch (error) {
            console.error("Error deleting images", error);
            throw new Error("Error deleting images");
        }
    },
};