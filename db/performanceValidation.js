// Performance and Load Testing Validation
require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const { performance } = require('perf_hooks');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const BASE_URL = 'http://localhost:3000';

// Performance Test 1: Database Query Performance
async function testDatabaseQueryPerformance() {
  console.log('\n=== Database Query Performance Test ===');
  
  const queries = [
    { name: 'Select All Users', query: 'SELECT * FROM "User" LIMIT 100' },
    { name: 'Select Posts with User', query: 'SELECT p.*, u.username FROM "Post" p JOIN "User" u ON p."userId" = u.id LIMIT 50' },
    { name: 'Count Users', query: 'SELECT COUNT(*) FROM "User"' },
    { name: 'Recent Posts', query: 'SELECT * FROM "Post" ORDER BY "createdAt" DESC LIMIT 20' },
    { name: 'User with Most Posts', query: 'SELECT u.username, COUNT(p.id) as post_count FROM "User" u LEFT JOIN "Post" p ON u.id = p."userId" GROUP BY u.id, u.username ORDER BY post_count DESC LIMIT 10' }
  ];
  
  for (const queryTest of queries) {
    const start = performance.now();
    try {
      const result = await pool.query(queryTest.query);
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      
      console.log(`✓ ${queryTest.name}: ${duration}ms (${result.rowCount} rows)`);
      
      if (duration > 1000) {
        console.log(`  ⚠️  Slow query detected (>1s)`);
      }
    } catch (error) {
      console.log(`✗ ${queryTest.name}: Error - ${error.message}`);
    }
  }
}

// Performance Test 2: API Response Time Testing
async function testAPIResponseTimes() {
  console.log('\n=== API Response Time Test ===');
  
  // First, login to get session
  const loginResponse = await axios.post(`${BASE_URL}/log-in`, 
    'username=johndoe&password=password123',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }
  );
  
  const cookies = loginResponse.headers['set-cookie'];
  
  const endpoints = [
    { name: 'Home Page', url: '/' },
    { name: 'Users List', url: '/users' },
    { name: 'Posts List', url: '/posts' },
    { name: 'Search API', url: '/search?q=test' },
    { name: 'Notifications', url: '/notifications' },
    { name: 'Realms', url: '/realms' }
  ];
  
  for (const endpoint of endpoints) {
    const start = performance.now();
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, {
        headers: { Cookie: cookies?.join('; ') },
        timeout: 10000
      });
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      
      console.log(`✓ ${endpoint.name}: ${duration}ms (${response.status})`);
      
      if (duration > 2000) {
        console.log(`  ⚠️  Slow response detected (>2s)`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint.name}: Error - ${error.message}`);
    }
  }
}

// Performance Test 3: Concurrent Request Testing
async function testConcurrentRequests() {
  console.log('\n=== Concurrent Request Test ===');
  
  const concurrentRequests = 10;
  const testUrl = `${BASE_URL}/`;
  
  console.log(`Testing ${concurrentRequests} concurrent requests...`);
  
  const promises = [];
  const start = performance.now();
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(
      axios.get(testUrl, { timeout: 15000 })
        .then(response => ({ success: true, status: response.status, requestId: i }))
        .catch(error => ({ success: false, error: error.message, requestId: i }))
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const end = performance.now();
    const totalTime = (end - start).toFixed(2);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✓ Completed ${concurrentRequests} concurrent requests in ${totalTime}ms`);
    console.log(`  Successful: ${successful}, Failed: ${failed}`);
    console.log(`  Average time per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);
    
    if (failed > 0) {
      console.log(`  ⚠️  ${failed} requests failed`);
    }
  } catch (error) {
    console.log(`✗ Concurrent request test failed: ${error.message}`);
  }
}

// Performance Test 4: Memory Usage Monitoring
async function testMemoryUsage() {
  console.log('\n=== Memory Usage Test ===');
  
  const initialMemory = process.memoryUsage();
  console.log('Initial Memory Usage:');
  console.log(`  RSS: ${(initialMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  
  // Simulate some work
  console.log('\nPerforming multiple database queries...');
  for (let i = 0; i < 50; i++) {
    await pool.query('SELECT COUNT(*) FROM "User"');
  }
  
  const finalMemory = process.memoryUsage();
  console.log('\nFinal Memory Usage:');
  console.log(`  RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  
  const rssDiff = (finalMemory.rss - initialMemory.rss) / 1024 / 1024;
  const heapDiff = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
  
  console.log('\nMemory Difference:');
  console.log(`  RSS Change: ${rssDiff.toFixed(2)} MB`);
  console.log(`  Heap Change: ${heapDiff.toFixed(2)} MB`);
  
  if (rssDiff > 50) {
    console.log(`  ⚠️  Significant memory increase detected`);
  }
}

// Performance Test 5: Connection Pool Stress Test
async function testConnectionPoolStress() {
  console.log('\n=== Connection Pool Stress Test ===');
  
  const maxConcurrentConnections = 20;
  const queriesPerConnection = 5;
  
  console.log(`Testing ${maxConcurrentConnections} concurrent connections with ${queriesPerConnection} queries each...`);
  
  const promises = [];
  const start = performance.now();
  
  for (let i = 0; i < maxConcurrentConnections; i++) {
    promises.push(
      (async () => {
        const queries = [];
        for (let j = 0; j < queriesPerConnection; j++) {
          queries.push(pool.query('SELECT $1::text as connection_id, $2::int as query_num', [i, j]));
        }
        try {
          await Promise.all(queries);
          return { success: true, connectionId: i };
        } catch (error) {
          return { success: false, connectionId: i, error: error.message };
        }
      })()
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const end = performance.now();
    const totalTime = (end - start).toFixed(2);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✓ Completed connection pool stress test in ${totalTime}ms`);
    console.log(`  Successful connections: ${successful}`);
    console.log(`  Failed connections: ${failed}`);
    console.log(`  Total queries executed: ${successful * queriesPerConnection}`);
    
    if (failed > 0) {
      console.log(`  ⚠️  ${failed} connections failed`);
    }
  } catch (error) {
    console.log(`✗ Connection pool stress test failed: ${error.message}`);
  }
}

// Run all performance tests
async function runAllPerformanceTests() {
  console.log('🚀 PERFORMANCE VALIDATION SUITE');
  console.log('================================');
  
  const startTime = performance.now();
  
  await testDatabaseQueryPerformance();
  await testAPIResponseTimes();
  await testConcurrentRequests();
  await testMemoryUsage();
  await testConnectionPoolStress();
  
  const endTime = performance.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n🎯 Performance validation completed in ${totalTime} seconds`);
  console.log('💡 Tips for optimization:');
  console.log('   - Add database indexes for slow queries');
  console.log('   - Implement query result caching');
  console.log('   - Use connection pooling efficiently');
  console.log('   - Monitor memory usage in production');
  console.log('   - Consider implementing rate limiting');
  
  await pool.end();
}

// Run the tests
if (require.main === module) {
  runAllPerformanceTests().catch(console.error);
}

module.exports = {
  testDatabaseQueryPerformance,
  testAPIResponseTimes,
  testConcurrentRequests,
  testMemoryUsage,
  testConnectionPoolStress
};
