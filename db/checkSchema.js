require("dotenv").config();
const { Client } = require("pg");

async function checkSchema() {
  console.log("Checking database schema...");
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  
  try {
    await client.connect();
    
    // Check User table structure
    console.log("\n📋 User table structure:");
    const userColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    userColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
    });
    
    // Check Post table structure
    console.log("\n📋 Post table structure:");
    const postColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Post' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    postColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
    });
    
    // Check for enum types
    console.log("\n📋 Custom enum types:");
    const enumTypes = await client.query(`
      SELECT typname, typtype
      FROM pg_type 
      WHERE typtype = 'e'
    `);
    enumTypes.rows.forEach(row => {
      console.log(`  ${row.typname}: ${row.typtype}`);
    });
    
    // Check for foreign key constraints
    console.log("\n📋 Foreign key constraints:");
    const fkConstraints = await client.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    fkConstraints.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    await client.end();
    console.log("\n✅ Database schema check completed!");
  } catch (err) {
    console.error("❌ Schema check failed:", err.message);
  }
}

checkSchema();
