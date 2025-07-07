// Script to update all query files with production-ready database configuration
const fs = require('fs');
const path = require('path');

const queryFiles = [
  'searchQuery.js',
  'realmsQuery.js', 
  'notificationsQuery.js',
  'likesQueries.js',
  'joinRealmsQuery.js',
  'imagesQueries.js',
  'followsQuery.js',
  'commentLikesQuery.js'
];

const newDatabaseConfig = `const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});`;

function updateQueryFile(filename) {
  const filePath = path.join(__dirname, '..', 'queries', filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Patterns to match different database configurations
  const patterns = [
    // Pattern 1: connectionString configuration
    /const { Pool } = require\('pg'\);\s*require\('dotenv'\)\.config\(\);\s*const databaseUrl[^;]*;\s*const pool = new Pool\(\{\s*connectionString: databaseUrl[^}]*\}\);/gs,
    
    // Pattern 2: Simple host configuration without SSL
    /const { Pool } = require\('pg'\);\s*const pool = new Pool\(\{\s*host: process\.env\.DB_HOST[^}]*\}\);/gs,
    
    // Pattern 3: Another variation
    /const { Pool } = require\('pg'\);\s*require\('dotenv'\)\.config\(\);\s*const pool = new Pool\(\{\s*host: process\.env\.DB_HOST[^}]*\}\);/gs
  ];
  
  let updated = false;
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, newDatabaseConfig);
      updated = true;
      break;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filename}`);
  } else {
    console.log(`ℹ️  No update needed: ${filename}`);
  }
}

console.log('🔄 Updating query files with production database configuration...\n');

queryFiles.forEach(updateQueryFile);

console.log('\n✅ Database configuration update completed!');
console.log('\n📝 Next steps:');
console.log('1. Commit these changes to git');
console.log('2. Push to your repository'); 
console.log('3. Deploy on Render');
console.log('4. Set environment variables on Render');
console.log('5. Run: node db/setupProduction.js');
