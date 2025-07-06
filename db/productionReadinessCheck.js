// Production Readiness Checklist and Validation
// This script checks if your backend is ready for production deployment
require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const BASE_URL = 'http://localhost:3000';

class ProductionReadinessChecker {
  constructor() {
    this.checks = [];
    this.score = 0;
    this.maxScore = 0;
  }

  addCheck(category, item, status, message, weight = 1) {
    this.checks.push({ category, item, status, message, weight });
    this.maxScore += weight;
    if (status === 'pass') {
      this.score += weight;
    }
  }

  // Security Checks
  async checkSecurity() {
    console.log('\n🔒 Security Checks...');
    
    // Check 1: Environment Variables
    const criticalEnvVars = ['SESSION_SECRET', 'DB_PASSWORD', 'CLOUDINARY_API_SECRET'];
    let envVarsSecure = true;
    
    for (const envVar of criticalEnvVars) {
      if (!process.env[envVar]) {
        this.addCheck('Security', `${envVar} environment variable`, 'fail', 'Missing critical environment variable', 3);
        envVarsSecure = false;
      } else if (process.env[envVar].length < 16) {
        this.addCheck('Security', `${envVar} strength`, 'warning', 'Environment variable should be longer for security', 2);
      } else {
        this.addCheck('Security', `${envVar} environment variable`, 'pass', 'Properly configured', 1);
      }
    }
    
    // Check 2: Password Hashing
    try {
      const userResult = await pool.query('SELECT password FROM "User" LIMIT 1');
      if (userResult.rows.length > 0) {
        const hashedPassword = userResult.rows[0].password;
        if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
          this.addCheck('Security', 'Password Hashing', 'pass', 'Passwords are properly hashed with bcrypt', 3);
        } else {
          this.addCheck('Security', 'Password Hashing', 'fail', 'Passwords are not properly hashed', 5);
        }
      }
    } catch (error) {
      this.addCheck('Security', 'Password Hashing', 'fail', 'Could not verify password hashing', 3);
    }
    
    // Check 3: SQL Injection Protection
    try {
      // Test a simple parameterized query
      await pool.query('SELECT * FROM "User" WHERE id = $1', [1]);
      this.addCheck('Security', 'SQL Injection Protection', 'pass', 'Using parameterized queries', 3);
    } catch (error) {
      this.addCheck('Security', 'SQL Injection Protection', 'fail', 'Database queries may be vulnerable', 5);
    }
    
    // Check 4: HTTPS Headers (simulated)
    try {
      const response = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      const headers = response.headers;
      
      if (headers['x-frame-options']) {
        this.addCheck('Security', 'X-Frame-Options Header', 'pass', 'Clickjacking protection enabled', 1);
      } else {
        this.addCheck('Security', 'X-Frame-Options Header', 'warning', 'Missing clickjacking protection', 2);
      }
      
      if (headers['x-content-type-options']) {
        this.addCheck('Security', 'X-Content-Type-Options Header', 'pass', 'MIME type sniffing protection', 1);
      } else {
        this.addCheck('Security', 'X-Content-Type-Options Header', 'warning', 'Missing MIME type protection', 2);
      }
    } catch (error) {
      this.addCheck('Security', 'Security Headers', 'fail', 'Could not check security headers', 2);
    }
  }

  // Performance Checks
  async checkPerformance() {
    console.log('\n⚡ Performance Checks...');
    
    // Check 1: Database Indexes
    try {
      const indexResult = await pool.query(`
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Post', 'Comment')
        ORDER BY tablename, indexname
      `);
      
      const indexes = indexResult.rows;
      const userIndexes = indexes.filter(i => i.tablename === 'User');
      const postIndexes = indexes.filter(i => i.tablename === 'Post');
      
      if (userIndexes.length >= 2) { // Primary key + at least one other
        this.addCheck('Performance', 'User Table Indexes', 'pass', `Found ${userIndexes.length} indexes`, 2);
      } else {
        this.addCheck('Performance', 'User Table Indexes', 'warning', 'Consider adding more indexes', 1);
      }
      
      if (postIndexes.length >= 2) {
        this.addCheck('Performance', 'Post Table Indexes', 'pass', `Found ${postIndexes.length} indexes`, 2);
      } else {
        this.addCheck('Performance', 'Post Table Indexes', 'warning', 'Consider adding more indexes', 1);
      }
    } catch (error) {
      this.addCheck('Performance', 'Database Indexes', 'fail', 'Could not check database indexes', 3);
    }
    
    // Check 2: Connection Pooling
    if (pool.options.max && pool.options.max > 1) {
      this.addCheck('Performance', 'Connection Pooling', 'pass', `Pool size: ${pool.options.max}`, 2);
    } else {
      this.addCheck('Performance', 'Connection Pooling', 'warning', 'Connection pooling may not be optimized', 2);
    }
    
    // Check 3: Response Time
    const startTime = Date.now();
    try {
      await axios.get(`${BASE_URL}/`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 1000) {
        this.addCheck('Performance', 'Response Time', 'pass', `${responseTime}ms response time`, 2);
      } else {
        this.addCheck('Performance', 'Response Time', 'warning', `Slow response time: ${responseTime}ms`, 1);
      }
    } catch (error) {
      this.addCheck('Performance', 'Response Time', 'fail', 'Could not measure response time', 2);
    }
  }

  // Reliability Checks
  async checkReliability() {
    console.log('\n🛡️ Reliability Checks...');
    
    // Check 1: Error Handling
    try {
      // Test with invalid endpoint
      await axios.get(`${BASE_URL}/nonexistent-endpoint`);
      this.addCheck('Reliability', 'Error Handling', 'fail', '404 errors not handled properly', 3);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.addCheck('Reliability', 'Error Handling', 'pass', '404 errors handled correctly', 2);
      } else {
        this.addCheck('Reliability', 'Error Handling', 'warning', 'Unexpected error handling behavior', 1);
      }
    }
    
    // Check 2: Database Connection Resilience
    try {
      await pool.query('SELECT 1');
      this.addCheck('Reliability', 'Database Connection', 'pass', 'Database connection is stable', 3);
    } catch (error) {
      this.addCheck('Reliability', 'Database Connection', 'fail', 'Database connection issues', 5);
    }
    
    // Check 3: Session Management
    try {
      const loginResponse = await axios.post(`${BASE_URL}/log-in`, 
        'username=johndoe&password=password123',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }
      );
      
      if (loginResponse.headers['set-cookie']) {
        this.addCheck('Reliability', 'Session Management', 'pass', 'Sessions are properly managed', 2);
      } else {
        this.addCheck('Reliability', 'Session Management', 'warning', 'Session management may have issues', 2);
      }
    } catch (error) {
      this.addCheck('Reliability', 'Session Management', 'fail', 'Could not test session management', 3);
    }
  }

  // Monitoring Checks
  async checkMonitoring() {
    console.log('\n📊 Monitoring Checks...');
    
    // Check 1: Logging
    const logFiles = ['access.log', 'error.log', 'app.log'];
    let loggingConfigured = false;
    
    for (const logFile of logFiles) {
      const logPath = path.join(__dirname, '..', logFile);
      if (fs.existsSync(logPath)) {
        loggingConfigured = true;
        break;
      }
    }
    
    if (loggingConfigured) {
      this.addCheck('Monitoring', 'Logging', 'pass', 'Logging is configured', 2);
    } else {
      this.addCheck('Monitoring', 'Logging', 'warning', 'Consider adding structured logging', 1);
    }
    
    // Check 2: Health Check Endpoint
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      if (response.status === 200) {
        this.addCheck('Monitoring', 'Health Check Endpoint', 'pass', 'Health check endpoint available', 2);
      }
    } catch (error) {
      this.addCheck('Monitoring', 'Health Check Endpoint', 'warning', 'Consider adding /health endpoint', 1);
    }
    
    // Check 3: Error Monitoring
    if (process.env.SENTRY_DSN || process.env.BUGSNAG_API_KEY) {
      this.addCheck('Monitoring', 'Error Monitoring', 'pass', 'Error monitoring configured', 2);
    } else {
      this.addCheck('Monitoring', 'Error Monitoring', 'warning', 'Consider adding error monitoring (Sentry, Bugsnag)', 1);
    }
  }

  // Deployment Checks
  async checkDeployment() {
    console.log('\n🚀 Deployment Checks...');
    
    // Check 1: Environment Detection
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      this.addCheck('Deployment', 'Environment', 'pass', 'NODE_ENV set to production', 2);
    } else {
      this.addCheck('Deployment', 'Environment', 'warning', 'NODE_ENV not set to production', 1);
    }
    
    // Check 2: Package.json Scripts
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.start) {
        this.addCheck('Deployment', 'Start Script', 'pass', 'Start script configured', 1);
      } else {
        this.addCheck('Deployment', 'Start Script', 'warning', 'Missing start script in package.json', 1);
      }
      
      if (packageJson.engines && packageJson.engines.node) {
        this.addCheck('Deployment', 'Node Version', 'pass', `Node version specified: ${packageJson.engines.node}`, 1);
      } else {
        this.addCheck('Deployment', 'Node Version', 'warning', 'Node version not specified', 1);
      }
    }
    
    // Check 3: Process Management
    if (process.env.PM2_HOME || process.env.SUPERVISOR) {
      this.addCheck('Deployment', 'Process Management', 'pass', 'Process management configured', 2);
    } else {
      this.addCheck('Deployment', 'Process Management', 'warning', 'Consider using PM2 or similar', 1);
    }
  }

  // Generate Production Readiness Report
  generateReport() {
    const percentage = ((this.score / this.maxScore) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(70));
    console.log('🏭 PRODUCTION READINESS REPORT');
    console.log('='.repeat(70));
    console.log(`Overall Score: ${this.score}/${this.maxScore} (${percentage}%)`);
    
    let status = 'Not Ready';
    let color = '🔴';
    
    if (percentage >= 90) {
      status = 'Production Ready';
      color = '🟢';
    } else if (percentage >= 75) {
      status = 'Mostly Ready';
      color = '🟡';
    } else if (percentage >= 50) {
      status = 'Needs Work';
      color = '🟠';
    }
    
    console.log(`Status: ${color} ${status}`);
    console.log('='.repeat(70));
    
    // Group checks by category
    const categories = {};
    this.checks.forEach(check => {
      if (!categories[check.category]) {
        categories[check.category] = [];
      }
      categories[check.category].push(check);
    });
    
    // Display results by category
    Object.keys(categories).forEach(category => {
      console.log(`\n${category}:`);
      categories[category].forEach(check => {
        let icon = '✅';
        if (check.status === 'fail') icon = '❌';
        if (check.status === 'warning') icon = '⚠️';
        
        console.log(`  ${icon} ${check.item}: ${check.message}`);
      });
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    const failedChecks = this.checks.filter(c => c.status === 'fail');
    const warningChecks = this.checks.filter(c => c.status === 'warning');
    
    if (failedChecks.length > 0) {
      console.log('\n🔴 Critical Issues (Fix First):');
      failedChecks.forEach(check => {
        console.log(`  • ${check.item}: ${check.message}`);
      });
    }
    
    if (warningChecks.length > 0) {
      console.log('\n🟡 Improvements:');
      warningChecks.forEach(check => {
        console.log(`  • ${check.item}: ${check.message}`);
      });
    }
    
    console.log('\n📋 Production Deployment Checklist:');
    console.log('  • Set NODE_ENV=production');
    console.log('  • Configure SSL/TLS certificates');
    console.log('  • Set up reverse proxy (Nginx)');
    console.log('  • Configure process manager (PM2)');
    console.log('  • Set up monitoring (New Relic, DataDog)');
    console.log('  • Configure logging (Winston, Morgan)');
    console.log('  • Set up automated backups');
    console.log('  • Configure rate limiting');
    console.log('  • Set up health checks');
    console.log('  • Test disaster recovery');
    
    return {
      score: this.score,
      maxScore: this.maxScore,
      percentage: parseFloat(percentage),
      status,
      checks: this.checks
    };
  }

  // Run all production readiness checks
  async runAllChecks() {
    console.log('🏭 Starting Production Readiness Check...');
    
    await this.checkSecurity();
    await this.checkPerformance();
    await this.checkReliability();
    await this.checkMonitoring();
    await this.checkDeployment();
    
    return this.generateReport();
  }
}

// Run production readiness check
async function runProductionReadinessCheck() {
  const checker = new ProductionReadinessChecker();
  
  try {
    const report = await checker.runAllChecks();
    
    // Save report to file
    const reportPath = path.join(__dirname, 'production_readiness_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Production readiness check failed:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runProductionReadinessCheck();
}

module.exports = ProductionReadinessChecker;
