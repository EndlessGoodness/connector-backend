require('dotenv').config();
const { runAuthenticationTests } = require('./testAuthenticationComprehensive');
const { runAPIEndpointTests } = require('./testAPIEndpointsComprehensive');
const { runSecurityTests } = require('./testSecurityComprehensive');

// Test configuration
const TEST_CONFIG = {
  authentication: true,
  apiEndpoints: true,
  security: true,
  delayBetweenSuites: 2000 // 2 seconds delay between test suites
};

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to check if server is running
async function checkServerStatus() {
  const axios = require('axios');
  try {
    await axios.get('http://localhost:3000/', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Backend Testing Suite...\n');
  console.log('=' .repeat(80));
  
  // Check if server is running
  console.log('Checking server status...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.error('Please start the server with "npm start" before running tests.');
    process.exit(1);
  }
  
  console.log('✅ Server is running and accessible');
  console.log('=' .repeat(80));
  
  const startTime = Date.now();
  const results = {
    authentication: null,
    apiEndpoints: null,
    security: null,
    totalDuration: 0
  };
  
  try {
    // Run Authentication Tests
    if (TEST_CONFIG.authentication) {
      console.log('\n🔐 AUTHENTICATION TESTS');
      console.log('=' .repeat(50));
      
      try {
        await runAuthenticationTests();
        results.authentication = 'PASSED';
        console.log('✅ Authentication tests completed successfully');
      } catch (error) {
        results.authentication = 'FAILED';
        console.error('❌ Authentication tests failed:', error.message);
      }
      
      if (TEST_CONFIG.delayBetweenSuites) {
        console.log(`\nWaiting ${TEST_CONFIG.delayBetweenSuites}ms before next test suite...`);
        await wait(TEST_CONFIG.delayBetweenSuites);
      }
    }
    
    // Run API Endpoint Tests
    if (TEST_CONFIG.apiEndpoints) {
      console.log('\n🔗 API ENDPOINT TESTS');
      console.log('=' .repeat(50));
      
      try {
        await runAPIEndpointTests();
        results.apiEndpoints = 'PASSED';
        console.log('✅ API endpoint tests completed successfully');
      } catch (error) {
        results.apiEndpoints = 'FAILED';
        console.error('❌ API endpoint tests failed:', error.message);
      }
      
      if (TEST_CONFIG.delayBetweenSuites) {
        console.log(`\nWaiting ${TEST_CONFIG.delayBetweenSuites}ms before next test suite...`);
        await wait(TEST_CONFIG.delayBetweenSuites);
      }
    }
    
    // Run Security Tests
    if (TEST_CONFIG.security) {
      console.log('\n🛡️ SECURITY TESTS');
      console.log('=' .repeat(50));
      
      try {
        await runSecurityTests();
        results.security = 'PASSED';
        console.log('✅ Security tests completed successfully');
      } catch (error) {
        results.security = 'FAILED';
        console.error('❌ Security tests failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error.message);
  }
  
  const endTime = Date.now();
  results.totalDuration = endTime - startTime;
  
  // Print final results
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(80));
  
  console.log('\n📊 Test Suite Results:');
  console.log(`   Authentication Tests: ${results.authentication || 'SKIPPED'}`);
  console.log(`   API Endpoint Tests:   ${results.apiEndpoints || 'SKIPPED'}`);
  console.log(`   Security Tests:       ${results.security || 'SKIPPED'}`);
  
  console.log(`\n⏱️  Total Duration: ${results.totalDuration}ms (${(results.totalDuration / 1000).toFixed(2)}s)`);
  
  const passedTests = Object.values(results).filter(result => result === 'PASSED').length;
  const totalTests = Object.values(results).filter(result => result !== null && result !== 0).length;
  
  console.log(`\n🎉 Overall Result: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests && totalTests > 0) {
    console.log('✅ ALL TESTS PASSED! Your backend is working correctly.');
  } else if (passedTests > 0) {
    console.log('⚠️  Some tests failed. Please review the output above.');
  } else {
    console.log('❌ All tests failed. Please check your server configuration.');
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🔍 Next Steps:');
  console.log('   1. Review any failed tests above');
  console.log('   2. Fix identified issues');
  console.log('   3. Re-run tests to verify fixes');
  console.log('   4. Consider adding more specific tests for your use case');
  console.log('   5. Integrate with CI/CD pipeline for automated testing');
  console.log('=' .repeat(80));
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test execution interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  TEST_CONFIG
};
