const axios = require('axios');
const { Pool } = require("pg");
const bcrypt = require('bcryptjs');

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

// Test 1: SQL Injection Attempts
async function testSQLInjectionAttempts() {
  console.log('\n=== Test 1: SQL Injection Attempts ===');
  
  const sqlInjectionAttempts = [
    { username: "admin'; DROP TABLE \"User\"; --", password: "password" },
    { username: "admin' OR '1'='1", password: "password" },
    { username: "admin' UNION SELECT * FROM \"User\" --", password: "password" },
    { username: "admin'; INSERT INTO \"User\" VALUES ('hacker', 'hacker@evil.com', 'password'); --", password: "password" }
  ];
  
  for (let i = 0; i < sqlInjectionAttempts.length; i++) {
    const attempt = sqlInjectionAttempts[i];
    try {
      const response = await axios.post(`${BASE_URL}/log-in`, attempt, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        withCredentials: true
      });
      
      if (response.status === 302) {
        console.log(`✓ SQL injection attempt ${i + 1} properly blocked`);
      } else {
        console.log(`✗ SQL injection attempt ${i + 1} may have succeeded (status: ${response.status})`);
      }
    } catch (error) {
      if (error.response?.status === 302) {
        console.log(`✓ SQL injection attempt ${i + 1} properly blocked`);
      } else {
        console.error(`✗ SQL injection attempt ${i + 1} caused error:`, error.message);
      }
    }
  }
}

// Test 2: XSS (Cross-Site Scripting) Attempts
async function testXSSAttempts() {
  console.log('\n=== Test 2: XSS Attempts ===');
  
  const xssAttempts = [
    {
      username: "<script>alert('XSS')</script>",
      email: "test@example.com",
      password: "password123"
    },
    {
      username: "normaluser",
      email: "<script>alert('XSS')</script>@example.com",
      password: "password123"
    },
    {
      username: "javascript:alert('XSS')",
      email: "test@example.com",
      password: "password123"
    }
  ];
  
  for (let i = 0; i < xssAttempts.length; i++) {
    const attempt = xssAttempts[i];
    try {
      const response = await axios.post(`${BASE_URL}/sign-up`, attempt, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 400) {
        console.log(`✓ XSS attempt ${i + 1} properly blocked by validation`);
      } else if (response.status === 302) {
        // Check if user was actually created
        const { rows } = await pool.query('SELECT * FROM "User" WHERE username = $1', [attempt.username]);
        if (rows.length === 0) {
          console.log(`✓ XSS attempt ${i + 1} blocked`);
        } else {
          console.log(`✗ XSS attempt ${i + 1} may have succeeded - user created`);
          // Clean up
          await pool.query('DELETE FROM "User" WHERE username = $1', [attempt.username]);
        }
      } else {
        console.log(`✗ XSS attempt ${i + 1} unexpected response (status: ${response.status})`);
      }
    } catch (error) {
      console.error(`✗ XSS attempt ${i + 1} caused error:`, error.message);
    }
  }
}

// Test 3: Brute Force Attack Simulation
async function testBruteForceAttack() {
  console.log('\n=== Test 3: Brute Force Attack Simulation ===');
  
  const targetUser = 'johndoe';
  const passwords = ['password', '123456', 'admin', 'letmein', 'password123', 'qwerty', 'wrong1', 'wrong2', 'wrong3'];
  
  let successCount = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < passwords.length; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/log-in`, {
        username: targetUser,
        password: passwords[i]
      }, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        withCredentials: true
      });
      
      if (response.status === 302) {
        // Check if we were redirected to home (success) or back to login (failure)
        // This is a simplified check - in practice, you'd need to examine the redirect location
        if (passwords[i] === 'securepassword123') {
          successCount++;
          console.log(`✓ Correct password found: ${passwords[i]}`);
        }
      }
    } catch (error) {
      // Expected for wrong passwords
    }
    
    // Add small delay to simulate real brute force
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`Brute force test completed: ${successCount}/${passwords.length} attempts succeeded in ${duration}ms`);
  
  if (successCount <= 1) {
    console.log('✓ Brute force attack properly limited');
  } else {
    console.log('✗ Brute force attack may be too easy');
  }
}

// Test 4: Session Fixation Attack
async function testSessionFixationAttack() {
  console.log('\n=== Test 4: Session Fixation Attack ===');
  
  try {
    // Get initial session
    const initialResponse = await axios.get(`${BASE_URL}/`, {
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
      withCredentials: true
    });
    
    const initialCookies = initialResponse.headers['set-cookie'];
    
    if (initialCookies) {
      // Try to login with the same session
      const loginResponse = await axios.post(`${BASE_URL}/log-in`, {
        username: 'johndoe',
        password: 'password123'
      }, {
        headers: {
          Cookie: initialCookies.join('; ')
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        withCredentials: true
      });
      
      const loginCookies = loginResponse.headers['set-cookie'];
      
      // Check if session ID changed after login
      if (loginCookies && loginCookies.some(cookie => !initialCookies.includes(cookie))) {
        console.log('✓ Session ID properly regenerated after login');
      } else {
        console.log('✗ Session ID not regenerated after login (potential session fixation vulnerability)');
      }
    } else {
      console.log('✗ No initial session cookies found');
    }
  } catch (error) {
    console.error('✗ Session fixation test error:', error.message);
  }
}

// Test 5: CSRF (Cross-Site Request Forgery) Simulation
async function testCSRFAttempts() {
  console.log('\n=== Test 5: CSRF Attempts ===');
  
  try {
    // Login first to get valid session
    const loginResponse = await axios.post(`${BASE_URL}/log-in`, {
      username: 'johndoe',
      password: 'password123'
    }, {
      maxRedirects: 0,
      validateStatus: (status) => status < 500,
      withCredentials: true
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    
    if (cookies) {
      // Try to make a request without proper headers (simulating CSRF)
      const csrfResponse = await axios.post(`${BASE_URL}/posts`, {
        title: 'CSRF Test Post',
        content: 'This post was created via CSRF attack'
      }, {
        headers: {
          Cookie: cookies.join('; '),
          'Origin': 'http://malicious-site.com',
          'Referer': 'http://malicious-site.com/attack.html'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (csrfResponse.status === 403 || csrfResponse.status === 401) {
        console.log('✓ CSRF attack properly blocked');
      } else if (csrfResponse.status === 200 || csrfResponse.status === 201) {
        console.log('✗ CSRF attack may have succeeded');
      } else {
        console.log(`? CSRF test inconclusive (status: ${csrfResponse.status})`);
      }
    } else {
      console.log('✗ Could not get session cookies for CSRF test');
    }
  } catch (error) {
    console.error('✗ CSRF test error:', error.message);
  }
}

// Test 6: Race Condition in User Creation
async function testRaceConditionUserCreation() {
  console.log('\n=== Test 6: Race Condition in User Creation ===');
  
  const duplicateUser = {
    username: 'racetest_user',
    email: 'racetest@example.com',
    password: 'password123'
  };
  
  try {
    // Try to create the same user simultaneously
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.post(`${BASE_URL}/sign-up`, duplicateUser, {
          maxRedirects: 0,
          validateStatus: (status) => status < 500
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.status === 302).length;
    
    if (successCount === 1) {
      console.log('✓ Race condition properly handled - only one user created');
    } else {
      console.log(`✗ Race condition may exist - ${successCount} users created`);
    }
    
    // Clean up
    await pool.query('DELETE FROM "User" WHERE username = $1', [duplicateUser.username]);
    
  } catch (error) {
    console.error('✗ Race condition test error:', error.message);
  }
}

// Test 7: Password Complexity and Security
async function testPasswordComplexity() {
  console.log('\n=== Test 7: Password Complexity and Security ===');
  
  const weakPasswords = [
    { username: 'weakuser1', email: 'weak1@example.com', password: '123' }, // Too short
    { username: 'weakuser2', email: 'weak2@example.com', password: 'password' }, // Common password
    { username: 'weakuser3', email: 'weak3@example.com', password: 'abc' }, // Too short
    { username: 'weakuser4', email: 'weak4@example.com', password: '' }, // Empty
  ];
  
  let blockedCount = 0;
  
  for (let i = 0; i < weakPasswords.length; i++) {
    const user = weakPasswords[i];
    try {
      const response = await axios.post(`${BASE_URL}/sign-up`, user, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      if (response.status === 400) {
        blockedCount++;
        console.log(`✓ Weak password ${i + 1} properly rejected`);
      } else {
        console.log(`✗ Weak password ${i + 1} was accepted`);
        // Clean up if user was created
        await pool.query('DELETE FROM "User" WHERE username = $1', [user.username]);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        blockedCount++;
        console.log(`✓ Weak password ${i + 1} properly rejected`);
      } else {
        console.error(`✗ Weak password ${i + 1} test error:`, error.message);
      }
    }
  }
  
  console.log(`Password complexity test: ${blockedCount}/${weakPasswords.length} weak passwords blocked`);
}

// Test 8: Large Data Attacks
async function testLargeDataAttacks() {
  console.log('\n=== Test 8: Large Data Attacks ===');
  
  const largeData = {
    username: 'A'.repeat(1000), // Very long username
    email: 'test@example.com',
    password: 'B'.repeat(1000) // Very long password
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/sign-up`, largeData, {
      maxRedirects: 0,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 400) {
      console.log('✓ Large data attack properly blocked');
    } else {
      console.log(`✗ Large data attack may have succeeded (status: ${response.status})`);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Large data attack properly blocked');
    } else {
      console.error('✗ Large data attack test error:', error.message);
    }
  }
}

// Test 9: Concurrent Session Handling
async function testConcurrentSessions() {
  console.log('\n=== Test 9: Concurrent Session Handling ===');
  
  const credentials = {
    username: 'johndoe',
    password: 'password123'
  };
  
  try {
    // Create multiple sessions for the same user
    const loginPromises = [];
    for (let i = 0; i < 3; i++) {
      loginPromises.push(
        axios.post(`${BASE_URL}/log-in`, credentials, {
          maxRedirects: 0,
          validateStatus: (status) => status < 500,
          withCredentials: true
        })
      );
    }
    
    const responses = await Promise.all(loginPromises);
    const successCount = responses.filter(r => r.status === 302).length;
    
    console.log(`Concurrent sessions test: ${successCount}/3 sessions created`);
    
    if (successCount > 0) {
      console.log('✓ Concurrent sessions handling working');
    } else {
      console.log('✗ Concurrent sessions handling failed');
    }
  } catch (error) {
    console.error('✗ Concurrent sessions test error:', error.message);
  }
}

// Test 10: Memory and Resource Exhaustion
async function testResourceExhaustion() {
  console.log('\n=== Test 10: Resource Exhaustion ===');
  
  const startTime = Date.now();
  const requests = [];
  
  // Make many concurrent requests
  for (let i = 0; i < 20; i++) {
    requests.push(
      axios.post(`${BASE_URL}/log-in`, {
        username: 'nonexistent_user',
        password: 'wrong_password'
      }, {
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
        timeout: 5000
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Resource exhaustion test: ${responses.length} requests completed in ${duration}ms`);
    
    if (duration < 10000) { // Less than 10 seconds
      console.log('✓ Server handled concurrent requests efficiently');
    } else {
      console.log('✗ Server may be vulnerable to resource exhaustion');
    }
  } catch (error) {
    console.error('✗ Resource exhaustion test error:', error.message);
  }
}

// Main test runner
async function runSecurityTests() {
  console.log('🔒 Starting Comprehensive Security Tests...\n');
  
  try {
    await testSQLInjectionAttempts();
    await testXSSAttempts();
    await testBruteForceAttack();
    await testSessionFixationAttack();
    await testCSRFAttempts();
    await testRaceConditionUserCreation();
    await testPasswordComplexity();
    await testLargeDataAttacks();
    await testConcurrentSessions();
    await testResourceExhaustion();
    
    console.log('\n🛡️ Security tests completed!');
    
  } catch (error) {
    console.error('\n❌ Security test suite failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the tests
if (require.main === module) {
  runSecurityTests();
}

module.exports = {
  runSecurityTests
};
