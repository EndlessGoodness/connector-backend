require("dotenv").config();
const usersQueries = require("../queries/usersQueries");
const bcrypt = require('bcryptjs');

async function testUserQueries() {
  console.log("Testing user queries...");
  
  try {
    // Test creating a user
    console.log("\n1. Testing user creation...");
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    
    const newUser = await usersQueries.createUser({
      email: "test@example.com",
      username: "testuser",
      password: hashedPassword
    });
    
    console.log("✅ User created successfully:");
    console.log(`  ID: ${newUser.id}`);
    console.log(`  Username: ${newUser.username}`);
    console.log(`  Email: ${newUser.email}`);
    
    // Test getting user by ID
    console.log("\n2. Testing get user by ID...");
    const userById = await usersQueries.getUserById(newUser.id);
    console.log("✅ User retrieved by ID:");
    console.log(`  Username: ${userById.username}`);
    console.log(`  Email: ${userById.email}`);
    
    // Test getting user by username
    console.log("\n3. Testing get user by username...");
    const userByUsername = await usersQueries.getUserByUsername("testuser");
    console.log("✅ User retrieved by username:");
    console.log(`  ID: ${userByUsername.id}`);
    console.log(`  Email: ${userByUsername.email}`);
    
    // Test getting all users
    console.log("\n4. Testing get all users...");
    const allUsers = await usersQueries.getAllUsers();
    console.log(`✅ Total users in database: ${allUsers.length}`);
    
    // Clean up - delete the test user
    console.log("\n5. Cleaning up test data...");
    await usersQueries.deleteUser(newUser.id);
    console.log("✅ Test user deleted successfully");
    
    console.log("\n🎉 All user queries are working correctly!");
    
  } catch (err) {
    console.error("❌ User query test failed:", err.message);
    console.error("Stack trace:", err.stack);
  }
}

testUserQueries();
