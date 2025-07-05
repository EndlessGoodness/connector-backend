const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  database: "top_users",
  password: "1234",
  port: 5432
});

module.exports={
    getAllposts: async()=>{
        const { rows } = await pool.query("SELECT * FROM posts");
        
    }
}