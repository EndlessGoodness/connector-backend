require("dotenv").config();
const fs = require('fs');
const path = require('path');

// Define the column name mappings
const columnReplacements = [
  // Post table columns
  { from: '"postId"', to: 'postid' },
  { from: '"authorId"', to: 'authorid' },
  { from: '"realmId"', to: 'realmid' },
  { from: '"createdAt"', to: 'createdat' },
  { from: '"updatedAt"', to: 'updatedat' },
  
  // User table columns
  { from: '"userId"', to: 'userid' },
  { from: '"profilePictureUrl"', to: 'profilepictureurl' },
  { from: '"profilePicturePublicId"', to: 'profilepicturepublicid' },
  
  // Realm table columns
  { from: '"creatorId"', to: 'creatorid' },
  { from: '"realmPictureUrl"', to: 'realmpictureurl' },
  { from: '"realmPicturePublicId"', to: 'realmpicturepublicid' },
  
  // Follow table columns
  { from: '"followerId"', to: 'followerid' },
  { from: '"followingId"', to: 'followingid' },
  
  // JoinRealm table columns
  { from: '"joinerId"', to: 'joinerid' },
  
  // Comment table columns
  { from: '"commentId"', to: 'commentid' },
  { from: '"parentId"', to: 'parentid' },
  
  // Notification table columns
  { from: '"actorId"', to: 'actorid' },
  { from: '"sourceType"', to: 'sourcetype' },
  { from: '"isRead"', to: 'isread' },
  
  // Image table columns
  { from: '"ownerId"', to: 'ownerid' },
  { from: '"publicId"', to: 'publicid' },
  
  // Message table columns
  { from: '"senderId"', to: 'senderid' },
  { from: '"receiverId"', to: 'receiverid' },
  { from: '"imageUrl"', to: 'imageurl' }
];

async function fixColumnNames() {
  console.log("🔧 Fixing column names in query files...");
  
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
      
      for (const replacement of columnReplacements) {
        const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, replacement.to);
          fileChanges += matches.length;
        }
      }
      
      if (fileChanges > 0) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Fixed ${fileChanges} column names in ${file}`);
        totalChanges += fileChanges;
      } else {
        console.log(`ℹ️ No column changes needed in ${file}`);
      }
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  }
  
  console.log(`\n🎉 Total column name changes made: ${totalChanges}`);
  console.log("Column name fixes completed!");
}

fixColumnNames();
