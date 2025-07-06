// Comprehensive Backend Health Monitor
// This script provides continuous monitoring and validation of your backend
require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const BASE_URL = 'http://localhost:3000';

// Health Check Class
class BackendHealthMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Test 1: Server Availability
  async testServerAvailability() {
    this.log('Testing server availability...', 'info');
    
    try {
      const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      if (response.status === 200) {
        this.log(`Server is responding (HTTP ${response.status})`, 'success');
        return true;
      } else {
        this.log(`Server returned unexpected status: ${response.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Server is not responding: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 2: Database Connectivity
  async testDatabaseConnectivity() {
    this.log('Testing database connectivity...', 'info');
    
    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      this.log(`Database connected successfully (PostgreSQL)`, 'success');
      this.log(`Database time: ${result.rows[0].current_time}`, 'info');
      return true;
    } catch (error) {
      this.log(`Database connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 3: Critical Tables Existence
  async testCriticalTables() {
    this.log('Checking critical database tables...', 'info');
    
    const criticalTables = ['User', 'Post', 'Comment', 'Realm', 'Notification'];
    let allTablesExist = true;
    
    for (const table of criticalTables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          this.log(`Table "${table}" exists`, 'success');
        } else {
          this.log(`Table "${table}" is missing`, 'error');
          allTablesExist = false;
        }
      } catch (error) {
        this.log(`Error checking table "${table}": ${error.message}`, 'error');
        allTablesExist = false;
      }
    }
    
    return allTablesExist;
  }

  // Test 4: Data Integrity
  async testDataIntegrity() {
    this.log('Checking data integrity...', 'info');
    
    try {
      // Check if there are users
      const userCount = await pool.query('SELECT COUNT(*) FROM "User"');
      const userCountValue = parseInt(userCount.rows[0].count);
      
      if (userCountValue > 0) {
        this.log(`Found ${userCountValue} users in database`, 'success');
      } else {
        this.log('No users found in database', 'warning');
      }
      
      // Check if there are posts
      const postCount = await pool.query('SELECT COUNT(*) FROM "Post"');
      const postCountValue = parseInt(postCount.rows[0].count);
      
      if (postCountValue > 0) {
        this.log(`Found ${postCountValue} posts in database`, 'success');
      } else {
        this.log('No posts found in database', 'warning');
      }
      
      // Check for orphaned records
      const orphanedPosts = await pool.query(`
        SELECT COUNT(*) FROM "Post" p 
        LEFT JOIN "User" u ON p."userId" = u.id 
        WHERE u.id IS NULL
      `);
      
      const orphanedCount = parseInt(orphanedPosts.rows[0].count);
      if (orphanedCount === 0) {
        this.log('No orphaned posts found', 'success');
      } else {
        this.log(`Found ${orphanedCount} orphaned posts`, 'warning');
      }
      
      return true;
    } catch (error) {
      this.log(`Data integrity check failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 5: Authentication System
  async testAuthenticationSystem() {
    this.log('Testing authentication system...', 'info');
    
    try {
      // Test login endpoint
      const loginResponse = await axios.post(`${BASE_URL}/log-in`, 
        'username=johndoe&password=password123',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
          timeout: 10000
        }
      );
      
      if (loginResponse.status === 200 || loginResponse.status === 302) {
        this.log('Authentication system is working', 'success');
        return true;
      } else {
        this.log(`Authentication returned unexpected status: ${loginResponse.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Authentication test failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 6: Critical Endpoints
  async testCriticalEndpoints() {
    this.log('Testing critical endpoints...', 'info');
    
    // Login first
    let cookies = '';
    try {
      const loginResponse = await axios.post(`${BASE_URL}/log-in`, 
        'username=johndoe&password=password123',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }
      );
      cookies = loginResponse.headers['set-cookie']?.join('; ') || '';
    } catch (error) {
      this.log('Failed to login for endpoint testing', 'error');
      return false;
    }
    
    const endpoints = [
      { name: 'Home', path: '/', expectedStatus: 200 },
      { name: 'Users', path: '/users', expectedStatus: 200 },
      { name: 'Posts', path: '/posts', expectedStatus: 200 },
      { name: 'Search', path: '/search?q=test', expectedStatus: 200 },
      { name: 'Notifications', path: '/notifications', expectedStatus: 200 }
    ];
    
    let allEndpointsWorking = true;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          headers: { Cookie: cookies },
          timeout: 10000
        });
        
        if (response.status === endpoint.expectedStatus) {
          this.log(`Endpoint ${endpoint.name} is working`, 'success');
        } else {
          this.log(`Endpoint ${endpoint.name} returned status ${response.status}`, 'warning');
          allEndpointsWorking = false;
        }
      } catch (error) {
        this.log(`Endpoint ${endpoint.name} failed: ${error.message}`, 'error');
        allEndpointsWorking = false;
      }
    }
    
    return allEndpointsWorking;
  }

  // Test 7: System Resources
  async testSystemResources() {
    this.log('Checking system resources...', 'info');
    
    try {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
      const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      
      this.log(`Process memory: ${rss} MB RSS, ${heapUsed} MB Heap`, 'info');
      
      // System memory
      const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      
      this.log(`System memory: ${freeMemory} GB free of ${totalMemory} GB total`, 'info');
      
      // CPU usage
      const loadAverage = os.loadavg();
      this.log(`CPU load average: ${loadAverage[0].toFixed(2)}`, 'info');
      
      // Database connections
      this.log(`Database pool: ${pool.totalCount} total, ${pool.idleCount} idle`, 'info');
      
      return true;
    } catch (error) {
      this.log(`System resource check failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Test 8: Environment Variables
  async testEnvironmentVariables() {
    this.log('Checking environment variables...', 'info');
    
    const requiredEnvVars = [
      'DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT',
      'SESSION_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY'
    ];
    
    let allEnvVarsPresent = true;
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.log(`Environment variable ${envVar} is set`, 'success');
      } else {
        this.log(`Environment variable ${envVar} is missing`, 'error');
        allEnvVarsPresent = false;
      }
    }
    
    return allEnvVarsPresent;
  }

  // Generate Health Report
  generateHealthReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    const successCount = this.results.filter(r => r.type === 'success').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        total: this.results.length,
        success: successCount,
        warnings: warningCount,
        errors: errorCount
      },
      health_score: ((successCount / (successCount + warningCount + errorCount)) * 100).toFixed(1),
      details: this.results
    };
    
    return report;
  }

  // Run all health checks
  async runAllHealthChecks() {
    this.log('Starting comprehensive backend health check...', 'info');
    
    const tests = [
      { name: 'Server Availability', fn: this.testServerAvailability },
      { name: 'Database Connectivity', fn: this.testDatabaseConnectivity },
      { name: 'Critical Tables', fn: this.testCriticalTables },
      { name: 'Data Integrity', fn: this.testDataIntegrity },
      { name: 'Authentication System', fn: this.testAuthenticationSystem },
      { name: 'Critical Endpoints', fn: this.testCriticalEndpoints },
      { name: 'System Resources', fn: this.testSystemResources },
      { name: 'Environment Variables', fn: this.testEnvironmentVariables }
    ];
    
    const results = {};
    
    for (const test of tests) {
      this.log(`Running ${test.name} test...`, 'info');
      try {
        results[test.name] = await test.fn.call(this);
      } catch (error) {
        this.log(`Test ${test.name} threw an error: ${error.message}`, 'error');
        results[test.name] = false;
      }
    }
    
    // Generate final report
    const report = this.generateHealthReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏥 BACKEND HEALTH REPORT');
    console.log('='.repeat(60));
    console.log(`Duration: ${report.duration}`);
    console.log(`Health Score: ${report.health_score}%`);
    console.log(`Success: ${report.summary.success}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log('='.repeat(60));
    
    // Save report to file
    const reportPath = path.join(__dirname, 'health_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Health report saved to ${reportPath}`, 'info');
    
    return report;
  }
}

// Run health check
async function runHealthCheck() {
  const monitor = new BackendHealthMonitor();
  
  try {
    const report = await monitor.runAllHealthChecks();
    
    // Provide recommendations based on results
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (report.summary.errors > 0) {
      console.log('🔴 Critical issues found - address errors immediately');
    } else if (report.summary.warnings > 0) {
      console.log('🟡 Some warnings detected - consider investigating');
    } else {
      console.log('🟢 All systems healthy!');
    }
    
    console.log('\nNext steps:');
    console.log('- Run performance tests: node db/performanceValidation.js');
    console.log('- Check Socket.io: node db/testSocketIO.js');
    console.log('- Review logs: check health_report.json');
    console.log('- Monitor in production: set up continuous health checks');
    
  } catch (error) {
    console.error('Health check failed:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runHealthCheck();
}

module.exports = BackendHealthMonitor;
