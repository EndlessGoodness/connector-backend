# Comprehensive Backend Testing Suite

This directory contains a comprehensive testing suite for the connector-backend project. The tests cover authentication, API endpoints, and security aspects of the application.

## Test Files Overview

### 1. `testAuthenticationComprehensive.js`
Tests all authentication-related functionality including:
- Valid user sign-up with proper validation
- Invalid sign-up attempts (missing fields, invalid data)
- Duplicate user registration attempts
- Valid and invalid login attempts
- Protected route access (with and without authentication)
- Session persistence across multiple requests
- Logout functionality and session cleanup
- Password security (hashing verification)

### 2. `testAPIEndpointsComprehensive.js`
Tests all API endpoints with proper authentication:
- Users API (GET, PUT operations)
- Posts API (CRUD operations)
- Comments API (creation and retrieval)
- Search API (various search parameters)
- Realms API (creation and retrieval)
- Notifications API (retrieval and updates)
- Unauthorized access attempts
- Error handling for invalid requests

### 3. `testSecurityComprehensive.js`
Security-focused tests including:
- SQL injection attack attempts
- XSS (Cross-Site Scripting) prevention
- Brute force attack simulation
- Session fixation attack detection
- CSRF (Cross-Site Request Forgery) protection
- Race condition handling in user creation
- Password complexity enforcement
- Large data attack prevention
- Concurrent session handling
- Resource exhaustion testing

### 4. `testSocketIO.js`
Comprehensive Socket.io real-time feature tests:
- Basic WebSocket connection establishment
- Room joining and management
- Real-time message sending and receiving
- Database persistence for messages
- Multiple client handling
- Error handling and recovery
- Performance testing

### 5. `testSocketIOAdvanced.js`
Advanced Socket.io testing with real-time features:
- Multi-room messaging with database persistence
- Notification broadcasting system
- Connection recovery and cleanup
- Load testing with multiple clients
- Performance benchmarking
- Error handling and edge cases

### 6. `performanceValidation.js`
Performance testing and optimization validation:
- Database query performance testing
- API response time measurement
- Concurrent request handling
- Memory usage monitoring
- Connection pool stress testing
- Performance recommendations

### 7. `healthMonitor.js`
Comprehensive backend health monitoring:
- Server availability checks
- Database connectivity validation
- Critical table existence verification
- Data integrity checks
- Authentication system validation
- Critical endpoint testing
- System resource monitoring
- Environment variable validation

### 8. `productionReadinessCheck.js`
Production deployment readiness assessment:
- Security configuration validation
- Performance optimization checks
- Reliability and error handling
- Monitoring and logging setup
- Deployment configuration verification
- Production readiness scoring

### 9. `ultimateTestRunner.js`
Master test runner that executes all validation suites:
- Runs all test suites in sequence
- Interactive mode for selective testing
- Quick mode for essential tests only
- Comprehensive reporting
- Success/failure tracking
- Performance timing
- Connection cleanup

### 5. `testSocketIOAdvanced.js`
Advanced real-time feature tests:
- Real-time messaging with database persistence
- Multiple room communication
- Notification broadcasting
- Connection recovery and resilience
- Load testing with concurrent messages

### 6. `testMasterRunner.js`
Master test runner that executes all test suites in sequence with proper reporting.

## Prerequisites

Before running the tests, ensure:

1. **Server is running**: Start the backend server on port 3000
   ```bash
   npm start
   ```

2. **Database is set up**: Ensure your PostgreSQL database is running and contains sample data

## Quick Start Guide

### Run All Tests (Recommended)
```bash
# Run the ultimate test runner for comprehensive validation
node db/ultimateTestRunner.js

# Interactive mode - select which tests to run
node db/ultimateTestRunner.js --interactive

# Quick mode - run essential tests only
node db/ultimateTestRunner.js --quick
```

### Individual Test Suites
```bash
# 1. Database and Schema Validation
node db/testdb.js                    # Basic database connection
node db/checkSchema.js               # Database schema validation
node db/insertSampleData.js          # Populate with sample data
node db/testIntegration.js           # Database integration tests

# 2. Authentication and Security
node db/testAuthenticationComprehensive.js  # Authentication tests
node db/testSecurityComprehensive.js        # Security vulnerability tests

# 3. API and Endpoints
node db/testAPIEndpointsComprehensive.js    # API endpoint tests

# 4. Real-time Features
node db/testSocketIO.js              # Socket.IO basic tests
node db/testSocketIOAdvanced.js      # Socket.IO advanced tests

# 5. Performance and Health
node db/performanceValidation.js     # Performance testing
node db/healthMonitor.js             # Health monitoring
node db/productionReadinessCheck.js  # Production readiness

# 6. Manual Testing
node db/manualTestingGuide.js        # Manual testing guide
```
   ```bash
   node db/populatedb.js
   ```

3. **Environment variables**: Make sure your `.env` file is properly configured

4. **Test user exists**: The tests expect a user with username `john_doe` and password `securepassword123` to exist in the database

## Running the Tests

### Run All Tests
```bash
node db/testMasterRunner.js
```

### Run Individual Test Suites
```bash
# Authentication tests only
node db/testAuthenticationComprehensive.js

# API endpoint tests only
node db/testAPIEndpointsComprehensive.js

# Security tests only
node db/testSecurityComprehensive.js

# Socket.io real-time feature tests
node db/testSocketIO.js

# Advanced Socket.io tests
node db/testSocketIOAdvanced.js
```

## Test Configuration

You can configure which test suites to run by modifying the `TEST_CONFIG` object in `testMasterRunner.js`:

```javascript
const TEST_CONFIG = {
  authentication: true,    // Run authentication tests
  apiEndpoints: true,      // Run API endpoint tests
  security: true,          // Run security tests
  delayBetweenSuites: 2000 // Delay between test suites (ms)
};
```

## Test Results Interpretation

### ✅ Test Passed
- The functionality works as expected
- Security measures are properly implemented
- No issues detected

### ❌ Test Failed
- The functionality is not working correctly
- Security vulnerability detected
- Requires immediate attention

### ⚠️ Test Inconclusive
- The test couldn't determine the result clearly
- May require manual verification
- Could indicate edge cases

## Common Test Scenarios

### Authentication Tests
- **Valid Sign-up**: Creates a new user with valid data
- **Invalid Sign-up**: Tests validation rules for user registration
- **Duplicate User**: Ensures unique usernames and emails
- **Login Security**: Tests password verification and session management
- **Protected Routes**: Ensures authentication is required for sensitive endpoints

### API Endpoint Tests
- **CRUD Operations**: Tests Create, Read, Update, Delete for all entities
- **Data Validation**: Ensures proper validation of input data
- **Error Handling**: Tests response to invalid requests
- **Authorization**: Ensures users can only access their own data

### Security Tests
- **Injection Attacks**: Tests SQL injection and XSS prevention
- **Session Security**: Tests session fixation and CSRF protection
- **Brute Force**: Tests rate limiting and account lockout
- **Data Validation**: Tests input sanitization and size limits

## Troubleshooting

### Server Not Running
If you get "Server is not running" error:
1. Start the server: `npm start`
2. Verify it's accessible at `http://localhost:3000`
3. Check for any startup errors in the console

### Database Connection Issues
If tests fail with database errors:
1. Verify PostgreSQL is running
2. Check your `.env` file database configuration
3. Ensure the database contains sample data

### Test User Not Found
If authentication tests fail:
1. Run the database population script: `node db/populatedb.js`
2. Verify the test user exists in the database
3. Check the password matches the expected value

### Port Already in Use
If you can't start the server:
1. Check if another process is using port 3000
2. Kill the existing process or change the port
3. Update the test configuration accordingly

## Adding New Tests

To add new tests:

1. **For Authentication**: Add test functions to `testAuthenticationComprehensive.js`
2. **For API Endpoints**: Add test functions to `testAPIEndpointsComprehensive.js`
3. **For Security**: Add test functions to `testSecurityComprehensive.js`
4. **For New Categories**: Create a new test file and add it to the master runner

### Test Function Template
```javascript
async function testNewFeature() {
  console.log('\n=== Test: New Feature ===');
  
  try {
    // Test implementation
    const response = await makeRequest();
    
    if (response.status === 200) {
      console.log('✓ New feature test passed');
    } else {
      console.log('✗ New feature test failed');
    }
  } catch (error) {
    console.error('✗ New feature test error:', error.message);
  }
}
```

## Security Considerations

The security tests are designed to:
- **Simulate real attacks** without causing damage
- **Test defensive measures** implemented in the application
- **Identify vulnerabilities** before they can be exploited
- **Verify security best practices** are followed

**Important**: These tests should only be run against your own systems. Never run security tests against systems you don't own or don't have explicit permission to test.

## Continuous Integration

To integrate these tests into your CI/CD pipeline:

1. Add a test script to `package.json`:
   ```json
   {
     "scripts": {
       "test:comprehensive": "node db/testMasterRunner.js"
     }
   }
   ```

2. Configure your CI to run the tests:
   ```yaml
   - name: Run comprehensive tests
     run: npm run test:comprehensive
   ```

3. Set up proper test database and environment variables

## Performance Considerations

- Tests are designed to be run in sequence to avoid conflicts
- Database cleanup is performed automatically
- Test data is isolated to prevent interference
- Resource usage is monitored during stress tests

## Reporting Issues

If you encounter issues with the tests:
1. Check the console output for detailed error messages
2. Verify your environment setup matches the requirements
3. Run individual test suites to isolate the problem
4. Check the database state and logs for additional context

## Future Enhancements

Potential improvements to the test suite:
- Add load testing for high traffic scenarios
- Implement automated test data generation
- Add integration with external security scanning tools
- Create visual test reports and dashboards
- Add test coverage metrics and reporting
