const { Pool } = require("pg");
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Initialize database connection
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'top_users',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432
});

const BASE_URL = 'http://localhost:3000';

// Test data for authentication
const testUsers = [
  {
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'testpass123'
  },
  {
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'testpass456'
  }
];

// Helper function to create test users
async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO "User" (username, email, password) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
        [user.username, user.email, hashedPassword]
      );
      console.log(`✓ Created/ensured user: ${user.username}`);
    } catch (error) {
      console.error(`✗ Error creating user ${user.username}:`, error.message);
    }
  }
}

// Helper function to clean up test users
async function cleanupTestUsers() {
  console.log('Cleaning up test users...');
  
  for (const user of testUsers) {
    try {
      await pool.query('DELETE FROM "User" WHERE username = $1', [user.username]);
      console.log(`✓ Deleted user: ${user.username}`);
    } catch (error) {
      console.error(`✗ Error deleting user ${user.username}:`, error.message);
    }
  }
}

// Test 1: Valid Sign-up
async function testValidSignup() {
  console.log('\n=== Test 1: Valid Sign-up ===');
  
  const newUser = {
    username: 'newuser123',
    email: 'newuser@example.com',
    password: 'newpass123'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/sign-up`, newUser, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    });
    
    console.log('✓ Valid sign-up successful');
    console.log('Response status:', response.status);
    
    // Verify user was created in database
    const { rows } = await pool.query('SELECT * FROM "User" WHERE username = $1', [newUser.username]);
    if (rows.length > 0) {
      console.log('✓ User successfully created in database');
    } else {
      console.log('✗ User not found in database');
    }
    
    // Clean up
    await pool.query('DELETE FROM "User" WHERE username = $1', [newUser.username]);
    
  } catch (error) {
    if (error.response?.status === 302) {
      console.log('✓ Valid sign-up successful (redirected)');
      
      // Verify user was created in database
      try {
        const { rows } = await pool.query('SELECT * FROM "User" WHERE username = $1', [newUser.username]);
        if (rows.length > 0) {
          console.log('✓ User successfully created in database');
          // Clean up
          await pool.query('DELETE FROM "User" WHERE username = $1', [newUser.username]);
        } else {
          console.log('✗ User not found in database');
        }
      } catch (dbError) {
        console.error('✗ Database verification failed:', dbError.message);
      }
    } else {
      console.error('✗ Valid sign-up failed:', error.response?.status || error.message);
    }
  }
}

// Test 2: Invalid Sign-up (missing fields)
async function testInvalidSignup() {
  console.log('\n=== Test 2: Invalid Sign-up (missing fields) ===');
  
  const invalidUsers = [
    { username: '', email: 'test@example.com', password: 'pass123' }, // Missing username
    { username: 'testuser', email: '', password: 'pass123' }, // Missing email
    { username: 'testuser', email: 'test@example.com', password: '' }, // Missing password
    { username: 'testuser', email: 'invalid-email', password: 'pass123' }, // Invalid email
    { username: 'ab', email: 'test@example.com', password: 'pass123' }, // Username too short
    { username: 'testuser', email: 'test@example.com', password: '123' }, // Password too short
  ];
  
  for (let i = 0; i < invalidUsers.length; i++) {
    const user = invalidUsers[i];
    try {
      const response = await axios.post(`${BASE_URL}/sign-up`, user, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 400) {
        console.log(`✓ Invalid sign-up ${i + 1} correctly rejected (status: ${response.status})`);
      } else {
        console.log(`✗ Invalid sign-up ${i + 1} unexpectedly accepted (status: ${response.status})`);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`✓ Invalid sign-up ${i + 1} correctly rejected (status: 400)`);
      } else {
        console.error(`✗ Invalid sign-up ${i + 1} unexpected error:`, error.message);
      }
    }
  }
}

// Test 3: Duplicate User Sign-up
async function testDuplicateSignup() {
  console.log('\n=== Test 3: Duplicate User Sign-up ===');
  
  const duplicateUser = {
    username: testUsers[0].username,
    email: 'different@example.com',
    password: 'differentpass123'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/sign-up`, duplicateUser, {
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 400) {
      console.log('✓ Duplicate username correctly rejected');
    } else {
      console.log('✗ Duplicate username unexpectedly accepted');
    }
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Duplicate username correctly rejected');
    } else {
      console.error('✗ Duplicate username test error:', error.message);
    }
  }
}

// Test 4: Valid Login
async function testValidLogin() {
  console.log('\n=== Test 4: Valid Login ===');
  
  const loginData = {
    username: testUsers[0].username,
    password: testUsers[0].password
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/log-in`, loginData, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      withCredentials: true
    });
    
    console.log('✓ Valid login successful');
    console.log('Response status:', response.status);
    
    // Return cookies for further testing
    return response.headers['set-cookie'];
    
  } catch (error) {
    console.error('✗ Valid login failed:', error.response?.data || error.message);
    return null;
  }
}

// Test 5: Invalid Login
async function testInvalidLogin() {
  console.log('\n=== Test 5: Invalid Login ===');
  
  const invalidLogins = [
    { username: 'nonexistentuser', password: 'somepassword' }, // Non-existent user
    { username: testUsers[0].username, password: 'wrongpassword' }, // Wrong password
    { username: '', password: 'somepassword' }, // Empty username
    { username: 'someuser', password: '' }, // Empty password
  ];
  
  for (let i = 0; i < invalidLogins.length; i++) {
    const login = invalidLogins[i];
    try {
      const response = await axios.post(`${BASE_URL}/log-in`, login, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        withCredentials: true
      });
      
      // Check if redirected to home (failed login)
      if (response.status === 302) {
        console.log(`✓ Invalid login ${i + 1} correctly rejected (redirected)`);
      } else {
        console.log(`✗ Invalid login ${i + 1} unexpectedly accepted (status: ${response.status})`);
      }
    } catch (error) {
      if (error.response?.status === 302) {
        console.log(`✓ Invalid login ${i + 1} correctly rejected (redirected)`);
      } else {
        console.error(`✗ Invalid login ${i + 1} unexpected error:`, error.message);
      }
    }
  }
}

// Test 6: Protected Route Access (without authentication)
async function testProtectedRouteWithoutAuth() {
  console.log('\n=== Test 6: Protected Route Access (without authentication) ===');
  
  const protectedRoutes = [
    '/users',
    '/posts',
    '/comments',
    '/images',
    '/search',
    '/realms',
    '/notifications'
  ];
  
  for (const route of protectedRoutes) {
    try {
      const response = await axios.get(`${BASE_URL}${route}`, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 302 || response.status === 401) {
        console.log(`✓ Protected route ${route} correctly blocked (status: ${response.status})`);
      } else {
        console.log(`✗ Protected route ${route} unexpectedly accessible (status: ${response.status})`);
      }
    } catch (error) {
      if (error.response?.status === 302 || error.response?.status === 401) {
        console.log(`✓ Protected route ${route} correctly blocked (status: ${error.response.status})`);
      } else {
        console.error(`✗ Protected route ${route} test error:`, error.message);
      }
    }
  }
}

// Test 7: Protected Route Access (with authentication)
async function testProtectedRouteWithAuth(cookies) {
  console.log('\n=== Test 7: Protected Route Access (with authentication) ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available, skipping test');
    return;
  }
  
  const protectedRoutes = [
    '/users',
    '/posts'
  ];
  
  for (const route of protectedRoutes) {
    try {
      const response = await axios.get(`${BASE_URL}${route}`, {
        headers: {
          Cookie: cookies.join('; ')
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 200) {
        console.log(`✓ Protected route ${route} accessible with auth (status: ${response.status})`);
      } else {
        console.log(`✗ Protected route ${route} not accessible with auth (status: ${response.status})`);
      }
    } catch (error) {
      console.error(`✗ Protected route ${route} test error:`, error.message);
    }
  }
}

// Test 8: Session Persistence
async function testSessionPersistence(cookies) {
  console.log('\n=== Test 8: Session Persistence ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available, skipping test');
    return;
  }
  
  try {
    // Make multiple requests with the same session
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        axios.get(`${BASE_URL}/users`, {
          headers: {
            Cookie: cookies.join('; ')
          },
          maxRedirects: 0,
          validateStatus: (status) => status < 500
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(response => response.status === 200);
    
    if (allSuccessful) {
      console.log('✓ Session persistence working correctly');
    } else {
      console.log('✗ Session persistence failed');
    }
  } catch (error) {
    console.error('✗ Session persistence test error:', error.message);
  }
}

// Test 9: Logout Functionality
async function testLogout(cookies) {
  console.log('\n=== Test 9: Logout Functionality ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available, skipping test');
    return;
  }
  
  try {
    // First, verify we're authenticated
    const preLogoutResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        Cookie: cookies.join('; ')
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    
    if (preLogoutResponse.status !== 200) {
      console.log('✗ Not authenticated before logout test');
      return;
    }
    
    // Perform logout
    const logoutResponse = await axios.get(`${BASE_URL}/log-out`, {
      headers: {
        Cookie: cookies.join('; ')
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    
    if (logoutResponse.status === 302) {
      console.log('✓ Logout successful (redirected)');
      
      // Try to access protected route after logout
      const postLogoutResponse = await axios.get(`${BASE_URL}/users`, {
        headers: {
          Cookie: cookies.join('; ')
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (postLogoutResponse.status === 302 || postLogoutResponse.status === 401) {
        console.log('✓ Protected route correctly blocked after logout');
      } else {
        console.log('✗ Protected route still accessible after logout');
      }
    } else {
      console.log('✗ Logout failed');
    }
  } catch (error) {
    console.error('✗ Logout test error:', error.message);
  }
}

// Test 10: Password Security
async function testPasswordSecurity() {
  console.log('\n=== Test 10: Password Security ===');
  
  try {
    // Check if passwords are properly hashed in database
    const { rows } = await pool.query('SELECT password FROM "User" WHERE username = $1', [testUsers[0].username]);
    
    if (rows.length > 0) {
      const hashedPassword = rows[0].password;
      
      // Verify password is not stored in plain text
      if (hashedPassword !== testUsers[0].password) {
        console.log('✓ Password properly hashed in database');
        
        // Verify bcrypt can validate the password
        const isValid = await bcrypt.compare(testUsers[0].password, hashedPassword);
        if (isValid) {
          console.log('✓ Password hashing verification successful');
        } else {
          console.log('✗ Password hashing verification failed');
        }
      } else {
        console.log('✗ Password stored in plain text (security risk!)');
      }
    } else {
      console.log('✗ Test user not found in database');
    }
  } catch (error) {
    console.error('✗ Password security test error:', error.message);
  }
}

// Main test runner
async function runAuthenticationTests() {
  console.log('🔐 Starting Comprehensive Authentication Tests...\n');
  
  try {
    // Setup
    await createTestUsers();
    
    // Run all tests
    await testValidSignup();
    await testInvalidSignup();
    await testDuplicateSignup();
    
    const cookies = await testValidLogin();
    
    await testInvalidLogin();
    await testProtectedRouteWithoutAuth();
    await testProtectedRouteWithAuth(cookies);
    await testSessionPersistence(cookies);
    await testLogout(cookies);
    await testPasswordSecurity();
    
    console.log('\n🎉 Authentication tests completed!');
    
  } catch (error) {
    console.error('\n❌ Authentication test suite failed:', error.message);
  } finally {
    // Cleanup
    await cleanupTestUsers();
    await pool.end();
  }
}

// Run the tests
if (require.main === module) {
  runAuthenticationTests();
}

module.exports = {
  runAuthenticationTests
};
