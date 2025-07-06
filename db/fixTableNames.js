require("dotenv").config();
const fs = require('fs');
const path = require('path');

// Define the table name mappings
const tableReplacements = [
  { from: 'FROM post', to: 'FROM "Post"' },
  { from: 'FROM realm', to: 'FROM "Realm"' },
  { from: 'FROM user', to: 'FROM "User"' },
  { from: 'FROM likes', to: 'FROM "Like"' },
  { from: 'FROM comments', to: 'FROM "Comment"' },
  { from: 'FROM follows', to: 'FROM "Follow"' },
  { from: 'FROM "post"', to: 'FROM "Post"' },
  { from: 'FROM "realm"', to: 'FROM "Realm"' },
  { from: 'FROM "user"', to: 'FROM "User"' },
  { from: 'FROM "likes"', to: 'FROM "Like"' },
  { from: 'FROM "comments"', to: 'FROM "Comment"' },
  { from: 'FROM "follows"', to: 'FROM "Follow"' },
  { from: 'JOIN post', to: 'JOIN "Post"' },
  { from: 'JOIN realm', to: 'JOIN "Realm"' },
  { from: 'JOIN user', to: 'JOIN "User"' },
  { from: 'JOIN likes', to: 'JOIN "Like"' },
  { from: 'JOIN comments', to: 'JOIN "Comment"' },
  { from: 'JOIN follows', to: 'JOIN "Follow"' },
  { from: 'JOIN "post"', to: 'JOIN "Post"' },
  { from: 'JOIN "realm"', to: 'JOIN "Realm"' },
  { from: 'JOIN "user"', to: 'JOIN "User"' },
  { from: 'JOIN "likes"', to: 'JOIN "Like"' },
  { from: 'JOIN "comments"', to: 'JOIN "Comment"' },
  { from: 'JOIN "follows"', to: 'JOIN "Follow"' },
  { from: 'LEFT JOIN post', to: 'LEFT JOIN "Post"' },
  { from: 'LEFT JOIN realm', to: 'LEFT JOIN "Realm"' },
  { from: 'LEFT JOIN user', to: 'LEFT JOIN "User"' },
  { from: 'LEFT JOIN likes', to: 'LEFT JOIN "Like"' },
  { from: 'LEFT JOIN comments', to: 'LEFT JOIN "Comment"' },
  { from: 'LEFT JOIN follows', to: 'LEFT JOIN "Follow"' },
  { from: 'LEFT JOIN "post"', to: 'LEFT JOIN "Post"' },
  { from: 'LEFT JOIN "realm"', to: 'LEFT JOIN "Realm"' },
  { from: 'LEFT JOIN "user"', to: 'LEFT JOIN "User"' },
  { from: 'LEFT JOIN "likes"', to: 'LEFT JOIN "Like"' },
  { from: 'LEFT JOIN "comments"', to: 'LEFT JOIN "Comment"' },
  { from: 'LEFT JOIN "follows"', to: 'LEFT JOIN "Follow"' },
  { from: 'INTO post', to: 'INTO "Post"' },
  { from: 'INTO realm', to: 'INTO "Realm"' },
  { from: 'INTO user', to: 'INTO "User"' },
  { from: 'INTO likes', to: 'INTO "Like"' },
  { from: 'INTO comments', to: 'INTO "Comment"' },
  { from: 'INTO follows', to: 'INTO "Follow"' },
  { from: 'INTO "post"', to: 'INTO "Post"' },
  { from: 'INTO "realm"', to: 'INTO "Realm"' },
  { from: 'INTO "user"', to: 'INTO "User"' },
  { from: 'INTO "likes"', to: 'INTO "Like"' },
  { from: 'INTO "comments"', to: 'INTO "Comment"' },
  { from: 'INTO "follows"', to: 'INTO "Follow"' },
  { from: 'UPDATE post', to: 'UPDATE "Post"' },
  { from: 'UPDATE realm', to: 'UPDATE "Realm"' },
  { from: 'UPDATE user', to: 'UPDATE "User"' },
  { from: 'UPDATE likes', to: 'UPDATE "Like"' },
  { from: 'UPDATE comments', to: 'UPDATE "Comment"' },
  { from: 'UPDATE follows', to: 'UPDATE "Follow"' },
  { from: 'UPDATE "post"', to: 'UPDATE "Post"' },
  { from: 'UPDATE "realm"', to: 'UPDATE "Realm"' },
  { from: 'UPDATE "user"', to: 'UPDATE "User"' },
  { from: 'UPDATE "likes"', to: 'UPDATE "Like"' },
  { from: 'UPDATE "comments"', to: 'UPDATE "Comment"' },
  { from: 'UPDATE "follows"', to: 'UPDATE "Follow"' },
  { from: 'DELETE FROM post', to: 'DELETE FROM "Post"' },
  { from: 'DELETE FROM realm', to: 'DELETE FROM "Realm"' },
  { from: 'DELETE FROM user', to: 'DELETE FROM "User"' },
  { from: 'DELETE FROM likes', to: 'DELETE FROM "Like"' },
  { from: 'DELETE FROM comments', to: 'DELETE FROM "Comment"' },
  { from: 'DELETE FROM follows', to: 'DELETE FROM "Follow"' },
  { from: 'DELETE FROM "post"', to: 'DELETE FROM "Post"' },
  { from: 'DELETE FROM "realm"', to: 'DELETE FROM "Realm"' },
  { from: 'DELETE FROM "user"', to: 'DELETE FROM "User"' },
  { from: 'DELETE FROM "likes"', to: 'DELETE FROM "Like"' },
  { from: 'DELETE FROM "comments"', to: 'DELETE FROM "Comment"' },
  { from: 'DELETE FROM "follows"', to: 'DELETE FROM "Follow"' }
];

async function fixTableNames() {
  console.log("🔧 Fixing table names in query files...");
  
  const queryFiles = [
    'queries/postsQuery.js',
    'queries/usersQueries.js',
    'queries/realmsQuery.js',
    'queries/searchQuery.js',
    'queries/followsQuery.js',
    'queries/commentsQuery.js',
    'queries/likesQueries.js',
    'queries/commentLikesQuery.js',
    'queries/joinRealmsQuery.js',
    'queries/notificationsQuery.js',
    'queries/imagesQueries.js'
  ];
  
  let totalChanges = 0;
  
  for (const file of queryFiles) {
    const fullPath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let fileChanges = 0;
      
      for (const replacement of tableReplacements) {
        const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, replacement.to);
          fileChanges += matches.length;
        }
      }
      
      if (fileChanges > 0) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed ${fileChanges} table names in ${file}`);
        totalChanges += fileChanges;
      } else {
        console.log(`ℹ️ No changes needed in ${file}`);
      }
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  }
  
  console.log(`\n🎉 Total changes made: ${totalChanges}`);
  console.log("Table name fixes completed!");
}

fixTableNames();
