require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function insertSampleData() {
  console.log("🚀 Inserting sample data...");
  
  try {
    // Sample users
    const sampleUsers = [
      {
        email: "john.doe@example.com",
        username: "johndoe",
        password: await bcrypt.hash("password123", 10),
        bio: "Software developer passionate about web technologies",
        profilePictureUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=JD"
      },
      {
        email: "jane.smith@example.com",
        username: "janesmith",
        password: await bcrypt.hash("password123", 10),
        bio: "UI/UX designer creating beautiful digital experiences",
        profilePictureUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=JS"
      },
      {
        email: "mike.johnson@example.com",
        username: "mikejohnson",
        password: await bcrypt.hash("password123", 10),
        bio: "Tech enthusiast and startup founder",
        profilePictureUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=MJ"
      },
      {
        email: "sarah.wilson@example.com",
        username: "sarahwilson",
        password: await bcrypt.hash("password123", 10),
        bio: "Data scientist exploring AI and machine learning",
        profilePictureUrl: "https://via.placeholder.com/150/FFFF00/000000?text=SW"
      },
      {
        email: "alex.brown@example.com",
        username: "alexbrown",
        password: await bcrypt.hash("password123", 10),
        bio: "Full-stack developer building scalable applications",
        profilePictureUrl: "https://via.placeholder.com/150/FF00FF/FFFFFF?text=AB"
      }
    ];

    // Insert users
    console.log("👥 Creating users...");
    const userIds = [];
    for (const user of sampleUsers) {
      const result = await pool.query(
        `INSERT INTO "User" (email, username, password, bio, profilepictureurl) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [user.email, user.username, user.password, user.bio, user.profilePictureUrl]
      );
      userIds.push(result.rows[0].id);
      console.log(`✅ Created user: ${user.username}`);
    }

    // Sample realms
    const sampleRealms = [
      {
        name: "WebDev",
        description: "Everything about web development - HTML, CSS, JavaScript, and modern frameworks",
        realmPictureUrl: "https://via.placeholder.com/300/4CAF50/FFFFFF?text=WebDev",
        creatorId: userIds[0]
      },
      {
        name: "Design",
        description: "UI/UX design, graphic design, and creative inspiration",
        realmPictureUrl: "https://via.placeholder.com/300/E91E63/FFFFFF?text=Design",
        creatorId: userIds[1]
      },
      {
        name: "Startups",
        description: "Entrepreneurship, startup stories, and business insights",
        realmPictureUrl: "https://via.placeholder.com/300/2196F3/FFFFFF?text=Startups",
        creatorId: userIds[2]
      },
      {
        name: "DataScience",
        description: "Data analysis, machine learning, and AI discussions",
        realmPictureUrl: "https://via.placeholder.com/300/FF9800/FFFFFF?text=DataSci",
        creatorId: userIds[3]
      },
      {
        name: "Technology",
        description: "Latest tech trends, gadgets, and innovation",
        realmPictureUrl: "https://via.placeholder.com/300/9C27B0/FFFFFF?text=Tech",
        creatorId: userIds[4]
      }
    ];

    // Insert realms
    console.log("🏰 Creating realms...");
    const realmIds = [];
    for (const realm of sampleRealms) {
      const result = await pool.query(
        `INSERT INTO "Realm" (name, description, realmpictureurl, creatorid) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [realm.name, realm.description, realm.realmPictureUrl, realm.creatorId]
      );
      realmIds.push(result.rows[0].id);
      console.log(`✅ Created realm: ${realm.name}`);
    }

    // Sample posts
    const samplePosts = [
      {
        title: "Getting Started with React Hooks",
        text: "React Hooks have revolutionized how we write React components. Here's a comprehensive guide to useState, useEffect, and custom hooks. #React #JavaScript #WebDev",
        published: true,
        authorId: userIds[0],
        realmId: realmIds[0]
      },
      {
        title: "Design System Best Practices",
        text: "Building a consistent design system is crucial for scalable applications. Here are the key principles I follow when creating design systems. #Design #UX #UI",
        published: true,
        authorId: userIds[1],
        realmId: realmIds[1]
      },
      {
        title: "From Idea to MVP in 30 Days",
        text: "Just launched my SaaS product after 30 days of intense development. Here's my journey, challenges faced, and lessons learned. #Startup #MVP #Entrepreneur",
        published: true,
        authorId: userIds[2],
        realmId: realmIds[2]
      },
      {
        title: "Machine Learning in Production",
        text: "Deploying ML models to production is challenging. Here's my experience with MLOps, monitoring, and maintaining model performance. #MachineLearning #AI #DataScience",
        published: true,
        authorId: userIds[3],
        realmId: realmIds[3]
      },
      {
        title: "The Future of Web Development",
        text: "Web3, serverless, and edge computing are changing how we build web applications. What's your take on these emerging technologies? #WebDev #Technology #Future",
        published: true,
        authorId: userIds[4],
        realmId: realmIds[4]
      },
      {
        title: "CSS Grid vs Flexbox",
        text: "When to use CSS Grid vs Flexbox? Here's a practical comparison with real-world examples. Both are powerful, but serve different purposes. #CSS #WebDev #Frontend",
        published: true,
        authorId: userIds[0],
        realmId: realmIds[0]
      },
      {
        title: "User Research Methods",
        text: "Conducting effective user research is the foundation of good design. Here are my favorite methods for understanding user needs and behaviors. #UX #Research #Design",
        published: true,
        authorId: userIds[1],
        realmId: realmIds[1]
      },
      {
        title: "Fundraising Tips for Startups",
        text: "Just closed our seed round! Here are the key lessons I learned during the fundraising process. Happy to answer questions in the comments. #Startup #Funding #Entrepreneur",
        published: true,
        authorId: userIds[2],
        realmId: realmIds[2]
      }
    ];

    // Insert posts
    console.log("📝 Creating posts...");
    const postIds = [];
    for (const post of samplePosts) {
      const result = await pool.query(
        `INSERT INTO "Post" (title, text, published, authorid, realmid) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [post.title, post.text, post.published, post.authorId, post.realmId]
      );
      postIds.push(result.rows[0].id);
      console.log(`✅ Created post: ${post.title}`);
    }

    // Create some follows
    console.log("🤝 Creating follows...");
    const follows = [
      { followerId: userIds[0], followingId: userIds[1] },
      { followerId: userIds[0], followingId: userIds[2] },
      { followerId: userIds[1], followingId: userIds[0] },
      { followerId: userIds[1], followingId: userIds[3] },
      { followerId: userIds[2], followingId: userIds[1] },
      { followerId: userIds[2], followingId: userIds[4] },
      { followerId: userIds[3], followingId: userIds[0] },
      { followerId: userIds[3], followingId: userIds[4] },
      { followerId: userIds[4], followingId: userIds[2] },
      { followerId: userIds[4], followingId: userIds[3] }
    ];

    for (const follow of follows) {
      await pool.query(
        `INSERT INTO "Follow" (followerid, followingid) VALUES ($1, $2)`,
        [follow.followerId, follow.followingId]
      );
    }
    console.log(`✅ Created ${follows.length} follow relationships`);

    // Join users to realms
    console.log("🏰 Joining users to realms...");
    const joinRealms = [
      { joinerId: userIds[0], realmId: realmIds[0] }, // johndoe joins WebDev
      { joinerId: userIds[0], realmId: realmIds[1] }, // johndoe joins Design
      { joinerId: userIds[1], realmId: realmIds[0] }, // janesmith joins WebDev
      { joinerId: userIds[1], realmId: realmIds[1] }, // janesmith joins Design
      { joinerId: userIds[2], realmId: realmIds[2] }, // mikejohnson joins Startups
      { joinerId: userIds[2], realmId: realmIds[4] }, // mikejohnson joins Technology
      { joinerId: userIds[3], realmId: realmIds[3] }, // sarahwilson joins DataScience
      { joinerId: userIds[3], realmId: realmIds[4] }, // sarahwilson joins Technology
      { joinerId: userIds[4], realmId: realmIds[0] }, // alexbrown joins WebDev
      { joinerId: userIds[4], realmId: realmIds[4] }  // alexbrown joins Technology
    ];

    for (const join of joinRealms) {
      await pool.query(
        `INSERT INTO "JoinRealm" (joinerid, realmid) VALUES ($1, $2)`,
        [join.joinerId, join.realmId]
      );
    }
    console.log(`✅ Created ${joinRealms.length} realm memberships`);

    // Create some likes
    console.log("❤️ Creating likes...");
    const likes = [
      { userId: userIds[1], postId: postIds[0] }, // janesmith likes johndoe's React post
      { userId: userIds[2], postId: postIds[0] }, // mikejohnson likes johndoe's React post
      { userId: userIds[3], postId: postIds[0] }, // sarahwilson likes johndoe's React post
      { userId: userIds[0], postId: postIds[1] }, // johndoe likes janesmith's Design post
      { userId: userIds[2], postId: postIds[1] }, // mikejohnson likes janesmith's Design post
      { userId: userIds[0], postId: postIds[2] }, // johndoe likes mikejohnson's Startup post
      { userId: userIds[1], postId: postIds[2] }, // janesmith likes mikejohnson's Startup post
      { userId: userIds[4], postId: postIds[3] }, // alexbrown likes sarahwilson's ML post
      { userId: userIds[0], postId: postIds[4] }, // johndoe likes alexbrown's Future post
      { userId: userIds[3], postId: postIds[4] }  // sarahwilson likes alexbrown's Future post
    ];

    for (const like of likes) {
      await pool.query(
        `INSERT INTO "Like" (userid, postid) VALUES ($1, $2)`,
        [like.userId, like.postId]
      );
    }
    console.log(`✅ Created ${likes.length} post likes`);

    // Create some comments
    console.log("💬 Creating comments...");
    const comments = [
      {
        comment: "Great explanation of React Hooks! The useState example really helped me understand the concept better.",
        userId: userIds[1],
        postId: postIds[0]
      },
      {
        comment: "I've been struggling with useEffect cleanup. Do you have any tips for avoiding memory leaks?",
        userId: userIds[2],
        postId: postIds[0]
      },
      {
        comment: "This is exactly what I needed for my design system project. Thank you for sharing!",
        userId: userIds[0],
        postId: postIds[1]
      },
      {
        comment: "Congratulations on the launch! Your journey is inspiring. What was the biggest challenge you faced?",
        userId: userIds[1],
        postId: postIds[2]
      },
      {
        comment: "MLOps is so important but often overlooked. Have you tried any specific monitoring tools?",
        userId: userIds[4],
        postId: postIds[3]
      },
      {
        comment: "Web3 is definitely interesting, but I'm still skeptical about mass adoption. What's your take?",
        userId: userIds[3],
        postId: postIds[4]
      }
    ];

    const commentIds = [];
    for (const comment of comments) {
      const result = await pool.query(
        `INSERT INTO "Comment" (comment, userid, postid) VALUES ($1, $2, $3) RETURNING id`,
        [comment.comment, comment.userId, comment.postId]
      );
      commentIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${comments.length} comments`);

    // Create some comment likes
    console.log("👍 Creating comment likes...");
    const commentLikes = [
      { userId: userIds[0], commentId: commentIds[0] }, // johndoe likes janesmith's comment
      { userId: userIds[3], commentId: commentIds[0] }, // sarahwilson likes janesmith's comment
      { userId: userIds[0], commentId: commentIds[1] }, // johndoe likes mikejohnson's comment
      { userId: userIds[1], commentId: commentIds[2] }, // janesmith likes johndoe's comment
      { userId: userIds[2], commentId: commentIds[3] }, // mikejohnson likes janesmith's comment
      { userId: userIds[0], commentId: commentIds[4] }  // johndoe likes alexbrown's comment
    ];

    for (const commentLike of commentLikes) {
      await pool.query(
        `INSERT INTO "CommentLike" (userid, commentid) VALUES ($1, $2)`,
        [commentLike.userId, commentLike.commentId]
      );
    }
    console.log(`✅ Created ${commentLikes.length} comment likes`);

    // Create some notifications
    console.log("🔔 Creating notifications...");
    const notifications = [
      {
        userId: userIds[0], // johndoe receives notification
        actorId: userIds[1], // janesmith is the actor
        type: "like",
        sourceType: "POST",
        postId: postIds[0] // about johndoe's React post
      },
      {
        userId: userIds[0], // johndoe receives notification
        actorId: userIds[2], // mikejohnson is the actor
        type: "comment",
        sourceType: "POST",
        postId: postIds[0] // about johndoe's React post
      },
      {
        userId: userIds[1], // janesmith receives notification
        actorId: userIds[0], // johndoe is the actor
        type: "follow",
        sourceType: "USER"
      },
      {
        userId: userIds[2], // mikejohnson receives notification
        actorId: userIds[1], // janesmith is the actor
        type: "like",
        sourceType: "POST",
        postId: postIds[2] // about mikejohnson's Startup post
      }
    ];

    for (const notification of notifications) {
      await pool.query(
        `INSERT INTO "Notification" (userid, actorid, type, sourcetype, postid) 
         VALUES ($1, $2, $3, $4, $5)`,
        [notification.userId, notification.actorId, notification.type, notification.sourceType, notification.postId]
      );
    }
    console.log(`✅ Created ${notifications.length} notifications`);

    // Display summary
    console.log("\n📊 SAMPLE DATA SUMMARY");
    console.log("=======================");
    
    const userCount = await pool.query('SELECT COUNT(*) FROM "User"');
    const realmCount = await pool.query('SELECT COUNT(*) FROM "Realm"');
    const postCount = await pool.query('SELECT COUNT(*) FROM "Post"');
    const followCount = await pool.query('SELECT COUNT(*) FROM "Follow"');
    const likeCount = await pool.query('SELECT COUNT(*) FROM "Like"');
    const commentCount = await pool.query('SELECT COUNT(*) FROM "Comment"');
    const notificationCount = await pool.query('SELECT COUNT(*) FROM "Notification"');

    console.log(`👥 Users: ${userCount.rows[0].count}`);
    console.log(`🏰 Realms: ${realmCount.rows[0].count}`);
    console.log(`📝 Posts: ${postCount.rows[0].count}`);
    console.log(`🤝 Follows: ${followCount.rows[0].count}`);
    console.log(`❤️ Likes: ${likeCount.rows[0].count}`);
    console.log(`💬 Comments: ${commentCount.rows[0].count}`);
    console.log(`🔔 Notifications: ${notificationCount.rows[0].count}`);

    console.log("\n🎉 Sample data insertion completed successfully!");
    console.log("You can now test the application with realistic data.");
    console.log("\nSample login credentials:");
    console.log("Username: johndoe, Password: password123");
    console.log("Username: janesmith, Password: password123");
    console.log("Username: mikejohnson, Password: password123");
    console.log("Username: sarahwilson, Password: password123");
    console.log("Username: alexbrown, Password: password123");

  } catch (error) {
    console.error("❌ Error inserting sample data:", error);
  } finally {
    await pool.end();
  }
}

insertSampleData();
