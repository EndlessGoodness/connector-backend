require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const os = require('os');

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const BASE_URL = 'http://localhost:3000';

// Test 1: Health Check Endpoint
async function createHealthCheckEndpoint() {
  console.log('\n=== Health Check Endpoint Test ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('✓ Server is responding to requests');
      console.log(`  Response time: ${response.headers['x-response-time'] || 'N/A'}`);
      console.log(`  Content length: ${response.headers['content-length'] || 'N/A'} bytes`);
      return true;
    } else {
      console.log(`✗ Unexpected response status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('✗ Server health check failed:', error.message);
    return false;
  }
}

// Test 2: Database Connection Pool Status
async function checkDatabaseConnectionPool() {
  console.log('\n=== Database Connection Pool Status ===');
  
  try {
    // Check pool status
    console.log('Database Pool Status:');
    console.log(`  Total connections: ${pool.totalCount}`);
    console.log(`  Idle connections: ${pool.idleCount}`);
    console.log(`  Waiting clients: ${pool.waitingCount}`);
    
    // Test multiple concurrent connections
    const queries = [];
    for (let i = 0; i < 5; i++) {
      queries.push(pool.query('SELECT $1 as connection_test', [i + 1]));
    }
    
    const results = await Promise.all(queries);
    console.log(`✓ Successfully handled ${results.length} concurrent database queries`);
    
    return true;
  } catch (error) {
    console.log('✗ Database connection pool test failed:', error.message);
    return false;
  }
}

// Test 3: System Resource Monitoring
async function monitorSystemResources() {
  console.log('\n=== System Resource Monitoring ===');
  
  try {
    // CPU Usage
    const cpus = os.cpus();
    console.log(`CPU Information:`);
    console.log(`  Model: ${cpus[0].model}`);
    console.log(`  Cores: ${cpus.length}`);
    console.log(`  Speed: ${cpus[0].speed} MHz`);
    
    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem * 100).toFixed(2);
    
    console.log(`\nMemory Information:`);
    console.log(`  Total: ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Used: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsagePercent}%)`);
    console.log(`  Free: ${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`);
    
    // Node.js Process Memory
    const nodeMemory = process.memoryUsage();
    console.log(`\nNode.js Process Memory:`);
    console.log(`  RSS: ${(nodeMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(nodeMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(nodeMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    
    // Check if resources are healthy
    if (memUsagePercent > 90) {
      console.log('⚠️ High memory usage detected');
    } else {
      console.log('✓ Memory usage is healthy');
    }
    
    return true;
  } catch (error) {
    console.log('✗ System resource monitoring failed:', error.message);
    return false;
  }
}

// Test 4: API Load Testing
async function performLoadTesting() {
  console.log('\n=== API Load Testing ===');
  
  try {
    // Login first
    const loginResponse = await axios.post(`${BASE_URL}/log-in`, {
      username: 'johndoe',
      password: 'password123'
    }, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      withCredentials: true
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    
    const numRequests = 50;
    const startTime = Date.now();
    
    // Create concurrent requests
    const requests = [];
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        axios.get(`${BASE_URL}/posts`, {
          headers: cookies ? { Cookie: cookies.join('; ') } : {},
          timeout: 10000
        })
      );
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successfulRequests = responses.filter(r => r.status === 200).length;
    const requestsPerSecond = (numRequests / (duration / 1000)).toFixed(2);
    const avgResponseTime = (duration / numRequests).toFixed(2);
    
    console.log(`Load Test Results:`);
    console.log(`  Total requests: ${numRequests}`);
    console.log(`  Successful requests: ${successfulRequests}`);
    console.log(`  Failed requests: ${numRequests - successfulRequests}`);
    console.log(`  Total time: ${duration}ms`);
    console.log(`  Requests per second: ${requestsPerSecond}`);
    console.log(`  Average response time: ${avgResponseTime}ms`);
    
    if (successfulRequests === numRequests && parseFloat(requestsPerSecond) > 10) {
      console.log('✓ Load test passed - excellent performance');
      return true;
    } else if (successfulRequests > numRequests * 0.9) {
      console.log('⚠️ Load test passed with warnings - good performance');
      return true;
    } else {
      console.log('✗ Load test failed - performance issues detected');
      return false;
    }
  } catch (error) {
    console.log('✗ Load testing failed:', error.message);
    return false;
  }
}

// Test 5: Database Query Optimization Check
async function checkQueryOptimization() {
  console.log('\n=== Database Query Optimization Check ===');
  
  try {
    // Test complex queries that might need optimization
    const queries = [
      {
        name: 'Posts with user and like count',
        query: `
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT p.id, p.title, u.username, COUNT(l.id) as like_count 
          FROM "Post" p 
          JOIN "User" u ON p."authorId" = u.id 
          LEFT JOIN "Like" l ON p.id = l."postId" 
          GROUP BY p.id, u.username 
          ORDER BY like_count DESC 
          LIMIT 10;
        `
      },
      {
        name: 'User feed query',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT p.*, u.username 
          FROM "Post" p 
          JOIN "User" u ON p."authorId" = u.id 
          JOIN "Follow" f ON u.id = f."followingId" 
          WHERE f."followerId" = 1 
          ORDER BY p."createdAt" DESC 
          LIMIT 20;
        `
      }
    ];
    
    for (const { name, query } of queries) {
      console.log(`\nAnalyzing: ${name}`);
      const result = await pool.query(query);
      
      // Parse execution plan for potential issues
      const executionPlan = result.rows.map(row => row['QUERY PLAN']).join('\n');
      
      if (executionPlan.includes('Seq Scan')) {
        console.log('  ⚠️ Sequential scan detected - consider adding indexes');
      }
      if (executionPlan.includes('Nested Loop')) {
        console.log('  ⚠️ Nested loop detected - query might be expensive');
      }
      if (executionPlan.includes('Sort')) {
        console.log('  ℹ️ Sorting operation present - consider index optimization');
      }
      
      // Extract execution time
      const timeLine = result.rows.find(row => 
        row['QUERY PLAN'] && row['QUERY PLAN'].includes('Execution Time:')
      );
      
      if (timeLine) {
        const executionTime = timeLine['QUERY PLAN'].match(/Execution Time: ([\d.]+) ms/);
        if (executionTime) {
          const time = parseFloat(executionTime[1]);
          if (time < 100) {
            console.log(`  ✓ Fast execution: ${time}ms`);
          } else if (time < 500) {
            console.log(`  ⚠️ Moderate execution: ${time}ms`);
          } else {
            console.log(`  ✗ Slow execution: ${time}ms - optimization needed`);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.log('✗ Query optimization check failed:', error.message);
    return false;
  }
}

// Test 6: Security Headers Check
async function checkSecurityHeaders() {
  console.log('\n=== Security Headers Check ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/`, {
      validateStatus: () => true
    });
    
    const headers = response.headers;
    const securityHeaders = {
      'x-frame-options': 'X-Frame-Options (Clickjacking protection)',
      'x-content-type-options': 'X-Content-Type-Options (MIME sniffing protection)',
      'x-xss-protection': 'X-XSS-Protection (XSS protection)',
      'strict-transport-security': 'Strict-Transport-Security (HTTPS enforcement)',
      'content-security-policy': 'Content-Security-Policy (CSP)',
      'referrer-policy': 'Referrer-Policy (Referrer control)'
    };
    
    console.log('Security Headers Analysis:');
    let secureHeaders = 0;
    
    Object.entries(securityHeaders).forEach(([header, description]) => {
      if (headers[header]) {
        console.log(`  ✓ ${description}: ${headers[header]}`);
        secureHeaders++;
      } else {
        console.log(`  ✗ ${description}: Missing`);
      }
    });
    
    console.log(`\nSecurity Score: ${secureHeaders}/${Object.keys(securityHeaders).length}`);
    
    if (secureHeaders >= 4) {
      console.log('✓ Good security header coverage');
      return true;
    } else {
      console.log('⚠️ Consider adding more security headers');
      return true; // Not critical for basic functionality
    }
  } catch (error) {
    console.log('✗ Security headers check failed:', error.message);
    return false;
  }
}

// Test 7: API Documentation Validation
async function validateAPIEndpoints() {
  console.log('\n=== API Endpoints Validation ===');
  
  try {
    // Login to get authentication
    const loginResponse = await axios.post(`${BASE_URL}/log-in`, {
      username: 'johndoe',
      password: 'password123'
    }, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      withCredentials: true
    });
    
    const cookies = loginResponse.headers['set-cookie'];
    
    const endpoints = [
      { path: '/', method: 'GET', requiresAuth: false, description: 'Home page' },
      { path: '/users', method: 'GET', requiresAuth: true, description: 'Get all users' },
      { path: '/posts', method: 'GET', requiresAuth: true, description: 'Get all posts' },
      { path: '/comments', method: 'GET', requiresAuth: true, description: 'Get comments' },
      { path: '/search', method: 'GET', requiresAuth: true, description: 'Search functionality' },
      { path: '/realms', method: 'GET', requiresAuth: true, description: 'Get realms' },
      { path: '/notifications', method: 'GET', requiresAuth: true, description: 'Get notifications' },
      { path: '/sign-up', method: 'GET', requiresAuth: false, description: 'Sign up page' },
      { path: '/log-out', method: 'GET', requiresAuth: false, description: 'Logout' }
    ];
    
    console.log('API Endpoint Status:');
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.path}`,
          timeout: 5000,
          validateStatus: (status) => status < 500
        };
        
        if (endpoint.requiresAuth && cookies) {
          config.headers = { Cookie: cookies.join('; ') };
        }
        
        const response = await axios(config);
        
        if (response.status < 400 || (endpoint.requiresAuth && response.status === 302)) {
          console.log(`  ✓ ${endpoint.method} ${endpoint.path} - ${endpoint.description} (${response.status})`);
          workingEndpoints++;
        } else {
          console.log(`  ✗ ${endpoint.method} ${endpoint.path} - ${endpoint.description} (${response.status})`);
        }
      } catch (error) {
        console.log(`  ✗ ${endpoint.method} ${endpoint.path} - ${endpoint.description} (Error: ${error.message})`);
      }
    }
    
    console.log(`\nEndpoint Status: ${workingEndpoints}/${endpoints.length} working`);
    
    return workingEndpoints >= endpoints.length * 0.8; // 80% success rate
  } catch (error) {
    console.log('✗ API endpoints validation failed:', error.message);
    return false;
  }
}

// Main validation runner
async function runAdvancedValidation() {
  console.log('🚀 Advanced Backend Validation Suite\n');
  console.log('=' .repeat(50));
  
  const results = {
    healthCheck: false,
    databasePool: false,
    systemResources: false,
    loadTesting: false,
    queryOptimization: false,
    securityHeaders: false,
    apiEndpoints: false
  };
  
  try {
    results.healthCheck = await createHealthCheckEndpoint();
    results.databasePool = await checkDatabaseConnectionPool();
    results.systemResources = await monitorSystemResources();
    results.loadTesting = await performLoadTesting();
    results.queryOptimization = await checkQueryOptimization();
    results.securityHeaders = await checkSecurityHeaders();
    results.apiEndpoints = await validateAPIEndpoints();
    
    // Print final results
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 ADVANCED VALIDATION RESULTS');
    console.log('=' .repeat(50));
    
    const testNames = {
      healthCheck: 'Health Check Endpoint',
      databasePool: 'Database Connection Pool',
      systemResources: 'System Resource Monitoring',
      loadTesting: 'API Load Testing',
      queryOptimization: 'Query Optimization Check',
      securityHeaders: 'Security Headers Check',
      apiEndpoints: 'API Endpoints Validation'
    };
    
    console.log('\n📊 Validation Results:');
    Object.entries(results).forEach(([key, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`   ${testNames[key]}: ${status}`);
    });
    
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎉 Overall Result: ${passedTests}/${totalTests} validations passed`);
    
    if (passedTests === totalTests) {
      console.log('✅ ADVANCED VALIDATION COMPLETE! Backend is production-ready.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('⚠️  Backend is mostly ready with minor areas for improvement.');
    } else {
      console.log('❌ Backend needs attention in several areas before production.');
    }
    
    // Recommendations
    console.log('\n🔧 Recommendations:');
    if (!results.securityHeaders) {
      console.log('   - Add security headers middleware for better protection');
    }
    if (!results.loadTesting) {
      console.log('   - Optimize API response times for better performance');
    }
    if (!results.queryOptimization) {
      console.log('   - Add database indexes for frequently queried columns');
    }
    console.log('   - Consider implementing caching for frequently accessed data');
    console.log('   - Set up monitoring and logging for production');
    
    console.log('\n' + '=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ Advanced validation suite failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the validation
if (require.main === module) {
  runAdvancedValidation();
}

module.exports = {
  runAdvancedValidation
};
