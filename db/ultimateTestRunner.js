// Ultimate Backend Testing Suite - Run All Tests
// This is the master script that runs all validation tests in sequence
require('dotenv').config();
const path = require('path');
const { spawn } = require('child_process');

const testSuites = [
  {
    name: 'Database Health Check',
    script: 'testdb.js',
    description: 'Verifies database connection and basic functionality'
  },
  {
    name: 'Schema Validation',
    script: 'checkSchema.js',
    description: 'Validates database schema and table structures'
  },
  {
    name: 'Sample Data Population',
    script: 'insertSampleData.js',
    description: 'Populates database with comprehensive sample data'
  },
  {
    name: 'Database Integration Tests',
    script: 'testIntegration.js',
    description: 'Tests database queries and data integrity'
  },
  {
    name: 'Authentication Tests',
    script: 'testAuthenticationComprehensive.js',
    description: 'Comprehensive authentication and session testing'
  },
  {
    name: 'API Endpoint Tests',
    script: 'testAPIEndpointsComprehensive.js',
    description: 'Tests all API endpoints with proper authentication'
  },
  {
    name: 'Security Tests',
    script: 'testSecurityComprehensive.js',
    description: 'Security vulnerability testing (SQL injection, XSS, etc.)'
  },
  {
    name: 'Socket.IO Tests',
    script: 'testSocketIO.js',
    description: 'Real-time WebSocket functionality testing'
  },
  {
    name: 'Socket.IO Advanced Tests',
    script: 'testSocketIOAdvanced.js',
    description: 'Advanced Socket.IO features and performance testing'
  },
  {
    name: 'Performance Validation',
    script: 'performanceValidation.js',
    description: 'Performance testing and optimization validation'
  },
  {
    name: 'Health Monitor',
    script: 'healthMonitor.js',
    description: 'Comprehensive backend health monitoring'
  },
  {
    name: 'Production Readiness Check',
    script: 'productionReadinessCheck.js',
    description: 'Production deployment readiness assessment'
  }
];

class UltimateTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runScript(scriptPath, scriptName) {
    return new Promise((resolve) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Running: ${scriptName}`);
      console.log(`${'='.repeat(80)}`);
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        shell: true
      });

      const startTime = Date.now();
      
      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        const result = {
          name: scriptName,
          script: scriptPath,
          success: code === 0,
          duration: duration,
          exitCode: code
        };
        
        this.results.push(result);
        
        if (code === 0) {
          console.log(`✅ ${scriptName} completed successfully (${duration}s)`);
        } else {
          console.log(`❌ ${scriptName} failed with exit code ${code} (${duration}s)`);
        }
        
        resolve(result);
      });

      child.on('error', (error) => {
        console.error(`❌ Error running ${scriptName}:`, error.message);
        this.results.push({
          name: scriptName,
          script: scriptPath,
          success: false,
          duration: 0,
          error: error.message
        });
        resolve({ success: false, error: error.message });
      });
    });
  }

  async runAllTests() {
    console.log('🚀 ULTIMATE BACKEND TESTING SUITE');
    console.log('==================================');
    console.log(`Starting comprehensive backend validation...`);
    console.log(`Total test suites: ${testSuites.length}`);
    console.log(`Started at: ${new Date().toLocaleString()}`);
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const suite of testSuites) {
      const scriptPath = path.join(__dirname, suite.script);
      
      try {
        console.log(`\n📋 Next: ${suite.name}`);
        console.log(`   Description: ${suite.description}`);
        console.log(`   Script: ${suite.script}`);
        
        const result = await this.runScript(scriptPath, suite.name);
        
        if (result.success) {
          passedTests++;
        } else {
          failedTests++;
        }
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to run ${suite.name}:`, error.message);
        failedTests++;
      }
    }
    
    this.generateFinalReport(passedTests, failedTests);
  }

  generateFinalReport(passedTests, failedTests) {
    const endTime = Date.now();
    const totalDuration = ((endTime - this.startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL TESTING REPORT');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${totalDuration} minutes`);
    console.log(`Tests Passed: ${passedTests}`);
    console.log(`Tests Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    
    console.log('\n📊 Test Results Summary:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.name} (${result.duration}s)`);
    });
    
    if (failedTests > 0) {
      console.log('\n🔴 Failed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.error || 'Exit code ' + result.exitCode}`);
      });
    }
    
    console.log('\n🎉 Testing Complete!');
    
    if (failedTests === 0) {
      console.log('🟢 All tests passed! Your backend is fully validated.');
      console.log('\n✨ Your backend is ready for:');
      console.log('   • Production deployment');
      console.log('   • Real-world usage');
      console.log('   • Further development');
    } else {
      console.log('🟡 Some tests failed. Please review the results above.');
      console.log('\n🔧 Next steps:');
      console.log('   • Fix failing tests');
      console.log('   • Re-run specific test suites');
      console.log('   • Check logs for detailed error information');
    }
    
    console.log('\n📚 Additional Resources:');
    console.log('   • Manual testing guide: node db/manualTestingGuide.js');
    console.log('   • Documentation: db/TESTING_README.md');
    console.log('   • Socket.IO results: db/SOCKETIO_TEST_RESULTS.md');
    console.log('   • Health reports: db/health_report.json');
    console.log('   • Production report: db/production_readiness_report.json');
  }
}

// Interactive mode - let user select which tests to run
async function runInteractiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🎮 INTERACTIVE TEST MODE');
  console.log('========================');
  console.log('Select tests to run:');
  console.log('0. Run all tests');
  
  testSuites.forEach((suite, index) => {
    console.log(`${index + 1}. ${suite.name}`);
  });
  
  rl.question('\nEnter your choice (0 for all, or comma-separated numbers): ', async (answer) => {
    const runner = new UltimateTestRunner();
    
    if (answer.trim() === '0') {
      await runner.runAllTests();
    } else {
      const choices = answer.split(',').map(n => parseInt(n.trim()) - 1);
      const selectedSuites = choices.filter(i => i >= 0 && i < testSuites.length).map(i => testSuites[i]);
      
      if (selectedSuites.length === 0) {
        console.log('❌ No valid tests selected');
        process.exit(1);
      }
      
      console.log(`\nRunning ${selectedSuites.length} selected test(s)...`);
      
      for (const suite of selectedSuites) {
        const scriptPath = path.join(__dirname, suite.script);
        await runner.runScript(scriptPath, suite.name);
      }
      
      runner.generateFinalReport(
        runner.results.filter(r => r.success).length,
        runner.results.filter(r => !r.success).length
      );
    }
    
    rl.close();
  });
}

// Quick test mode - run essential tests only
async function runQuickMode() {
  const essentialTests = [
    'testdb.js',
    'checkSchema.js',
    'testIntegration.js',
    'testAuthenticationComprehensive.js',
    'healthMonitor.js'
  ];
  
  console.log('⚡ QUICK TEST MODE');
  console.log('==================');
  console.log('Running essential tests only...');
  
  const runner = new UltimateTestRunner();
  
  for (const scriptName of essentialTests) {
    const suite = testSuites.find(s => s.script === scriptName);
    if (suite) {
      const scriptPath = path.join(__dirname, suite.script);
      await runner.runScript(scriptPath, suite.name);
    }
  }
  
  runner.generateFinalReport(
    runner.results.filter(r => r.success).length,
    runner.results.filter(r => !r.success).length
  );
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractiveMode();
  } else if (args.includes('--quick') || args.includes('-q')) {
    await runQuickMode();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🧪 Ultimate Backend Testing Suite');
    console.log('=================================');
    console.log('Usage: node db/ultimateTestRunner.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --interactive, -i    Run in interactive mode (select tests)');
    console.log('  --quick, -q         Run essential tests only');
    console.log('  --help, -h          Show this help message');
    console.log('  (no options)        Run all tests');
    console.log('');
    console.log('Available test suites:');
    testSuites.forEach(suite => {
      console.log(`  • ${suite.name}: ${suite.description}`);
    });
  } else {
    // Default: run all tests
    const runner = new UltimateTestRunner();
    await runner.runAllTests();
  }
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = UltimateTestRunner;
