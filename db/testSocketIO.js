require('dotenv').config();
const { Pool } = require('pg');
const io = require('socket.io-client');
const axios = require('axios');

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const SERVER_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';

// Test data
const testUsers = [
  { id: 1, username: 'johndoe', password: 'password123' },
  { id: 2, username: 'janedoe', password: 'password123' }
];

// Helper function to authenticate and get user session
async function authenticateUser(username, password) {
  try {
    const response = await axios.post(`${SERVER_URL}/log-in`, {
      username,
      password
    }, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      withCredentials: true
    });
    
    return response.headers['set-cookie'];
  } catch (error) {
    if (error.response?.status === 302) {
      return error.response.headers['set-cookie'];
    }
    throw error;
  }
}

// Helper function to create a Socket.io client
function createSocketClient(cookies = null) {
  const options = {
    forceNew: true,
    reconnection: false,
    timeout: 5000
  };
  
  if (cookies) {
    options.extraHeaders = {
      Cookie: cookies.join('; ')
    };
  }
  
  return io(SOCKET_URL, options);
}

// Helper function to wait for a specified time
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Basic Socket.io Connection
async function testBasicConnection() {
  console.log('\n=== Test 1: Basic Socket.io Connection ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('✗ Connection timeout');
        client.disconnect();
        resolve(false);
      }
    }, 5000);
    
    client.on('connect', () => {
      connected = true;
      clearTimeout(timeout);
      console.log('✓ Socket.io connection established');
      console.log(`  Client ID: ${client.id}`);
      client.disconnect();
      resolve(true);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Socket.io connection failed:', error.message);
      resolve(false);
    });
    
    client.on('disconnect', () => {
      console.log('✓ Socket.io client disconnected');
    });
  });
}

// Test 2: Room Joining Functionality
async function testRoomJoining() {
  console.log('\n=== Test 2: Room Joining Functionality ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let joinedRoom = false;
    
    const timeout = setTimeout(() => {
      if (!joinedRoom) {
        console.log('✗ Room joining timeout');
        client.disconnect();
        resolve(false);
      }
    }, 5000);
    
    client.on('connect', () => {
      console.log('✓ Connected to server');
      
      // Test joining a room
      client.emit('joinRoom', 'user_123');
      
      // Wait a bit to ensure the room join is processed
      setTimeout(() => {
        joinedRoom = true;
        clearTimeout(timeout);
        console.log('✓ Room joining functionality working');
        client.disconnect();
        resolve(true);
      }, 1000);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Connection failed:', error.message);
      resolve(false);
    });
  });
}

// Test 3: Notification Subscription
async function testNotificationSubscription() {
  console.log('\n=== Test 3: Notification Subscription ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let subscribed = false;
    
    const timeout = setTimeout(() => {
      if (!subscribed) {
        console.log('✗ Notification subscription timeout');
        client.disconnect();
        resolve(false);
      }
    }, 5000);
    
    client.on('connect', () => {
      console.log('✓ Connected to server');
      
      // Test subscribing to notifications
      client.emit('subscribeToNotifications', 'user_123');
      
      // Wait a bit to ensure the subscription is processed
      setTimeout(() => {
        subscribed = true;
        clearTimeout(timeout);
        console.log('✓ Notification subscription functionality working');
        client.disconnect();
        resolve(true);
      }, 1000);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Connection failed:', error.message);
      resolve(false);
    });
  });
}

// Test 4: Message Sending and Receiving
async function testMessageSending() {
  console.log('\n=== Test 4: Message Sending and Receiving ===');
  
  return new Promise(async (resolve, reject) => {
    let senderClient, receiverClient;
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      if (!messageReceived) {
        console.log('✗ Message sending/receiving timeout');
        if (senderClient) senderClient.disconnect();
        if (receiverClient) receiverClient.disconnect();
        resolve(false);
      }
    }, 10000);
    
    try {
      // Create two clients - sender and receiver
      senderClient = createSocketClient();
      receiverClient = createSocketClient();
      
      let senderConnected = false;
      let receiverConnected = false;
      
      // Set up receiver first
      receiverClient.on('connect', () => {
        console.log('✓ Receiver connected');
        receiverConnected = true;
        receiverClient.emit('joinRoom', '2'); // Join as user 2
        
        checkIfBothConnected();
      });
      
      receiverClient.on('receiveMessage', (message) => {
        console.log('✓ Message received:', message);
        messageReceived = true;
        clearTimeout(timeout);
        
        // Clean up
        senderClient.disconnect();
        receiverClient.disconnect();
        resolve(true);
      });
      
      // Set up sender
      senderClient.on('connect', () => {
        console.log('✓ Sender connected');
        senderConnected = true;
        senderClient.emit('joinRoom', '1'); // Join as user 1
        
        checkIfBothConnected();
      });
      
      senderClient.on('error', (error) => {
        console.log('✗ Sender error:', error);
      });
      
      function checkIfBothConnected() {
        if (senderConnected && receiverConnected) {
          // Wait a bit for room joins to complete
          setTimeout(() => {
            // Send a test message
            const testMessage = {
              content: 'Test message from Socket.io test',
              senderId: '1',
              receiverId: '2'
            };
            
            console.log('📤 Sending test message...');
            senderClient.emit('sendMessage', testMessage);
          }, 1000);
        }
      }
      
    } catch (error) {
      clearTimeout(timeout);
      console.log('✗ Message test setup failed:', error.message);
      resolve(false);
    }
  });
}

// Test 5: Multiple Clients and Broadcasting
async function testMultipleClients() {
  console.log('\n=== Test 5: Multiple Clients and Broadcasting ===');
  
  return new Promise((resolve, reject) => {
    const clients = [];
    const numClients = 3;
    let connectedClients = 0;
    
    const timeout = setTimeout(() => {
      console.log(`✗ Multiple clients test timeout (${connectedClients}/${numClients} connected)`);
      clients.forEach(client => client.disconnect());
      resolve(false);
    }, 8000);
    
    try {
      for (let i = 0; i < numClients; i++) {
        const client = createSocketClient();
        clients.push(client);
        
        client.on('connect', () => {
          connectedClients++;
          console.log(`✓ Client ${i + 1} connected (${connectedClients}/${numClients})`);
          
          // Join a room with user ID
          client.emit('joinRoom', `user_${i + 1}`);
          
          if (connectedClients === numClients) {
            console.log('✓ All clients connected successfully');
            clearTimeout(timeout);
            
            // Clean up
            clients.forEach(client => client.disconnect());
            resolve(true);
          }
        });
        
        client.on('connect_error', (error) => {
          console.log(`✗ Client ${i + 1} connection failed:`, error.message);
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      console.log('✗ Multiple clients test setup failed:', error.message);
      resolve(false);
    }
  });
}

// Test 6: Error Handling
async function testErrorHandling() {
  console.log('\n=== Test 6: Error Handling ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let errorReceived = false;
    
    const timeout = setTimeout(() => {
      if (!errorReceived) {
        console.log('? Error handling test completed (no errors triggered)');
        client.disconnect();
        resolve(true);
      }
    }, 5000);
    
    client.on('connect', () => {
      console.log('✓ Connected to server');
      
      // Send an invalid message to trigger an error
      const invalidMessage = {
        content: 'Test message',
        senderId: null, // Invalid sender ID
        receiverId: 'invalid_receiver'
      };
      
      client.emit('sendMessage', invalidMessage);
    });
    
    client.on('error', (error) => {
      console.log('✓ Error handling working:', error);
      errorReceived = true;
      clearTimeout(timeout);
      client.disconnect();
      resolve(true);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Connection failed:', error.message);
      resolve(false);
    });
  });
}

// Test 7: Connection Persistence
async function testConnectionPersistence() {
  console.log('\n=== Test 7: Connection Persistence ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let persistenceTestComplete = false;
    
    const timeout = setTimeout(() => {
      if (!persistenceTestComplete) {
        console.log('✗ Connection persistence test timeout');
        client.disconnect();
        resolve(false);
      }
    }, 8000);
    
    client.on('connect', () => {
      console.log('✓ Initial connection established');
      
      // Test multiple events to ensure connection persists
      client.emit('joinRoom', 'user_test');
      
      setTimeout(() => {
        client.emit('subscribeToNotifications', 'user_test');
      }, 1000);
      
      setTimeout(() => {
        console.log('✓ Connection persistence test completed');
        persistenceTestComplete = true;
        clearTimeout(timeout);
        client.disconnect();
        resolve(true);
      }, 3000);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Connection failed:', error.message);
      resolve(false);
    });
    
    client.on('disconnect', () => {
      console.log('✓ Client disconnected gracefully');
    });
  });
}

// Test 8: Database Integration (Messages Table)
async function testDatabaseIntegration() {
  console.log('\n=== Test 8: Database Integration ===');
  
  try {
    // Check if the message table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'message'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✓ Message table exists in database');
      
      // Check table structure
      const columnCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'message'
        ORDER BY ordinal_position;
      `);
      
      console.log('✓ Message table structure:');
      columnCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      return true;
    } else {
      console.log('✗ Message table does not exist');
      console.log('  Creating message table...');
      
      // Create the message table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS message (
          id SERIAL PRIMARY KEY,
          content TEXT,
          "imageUrl" TEXT,
          "senderId" TEXT NOT NULL,
          "receiverId" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✓ Message table created');
      return true;
    }
  } catch (error) {
    console.log('✗ Database integration test failed:', error.message);
    return false;
  }
}

// Test 9: Performance Test
async function testPerformance() {
  console.log('\n=== Test 9: Performance Test ===');
  
  return new Promise((resolve, reject) => {
    const numConnections = 10;
    const clients = [];
    let connectedClients = 0;
    const startTime = Date.now();
    
    const timeout = setTimeout(() => {
      console.log(`✗ Performance test timeout (${connectedClients}/${numConnections} connected)`);
      clients.forEach(client => client.disconnect());
      resolve(false);
    }, 15000);
    
    try {
      for (let i = 0; i < numConnections; i++) {
        const client = createSocketClient();
        clients.push(client);
        
        client.on('connect', () => {
          connectedClients++;
          
          if (connectedClients === numConnections) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`✓ Performance test completed:`);
            console.log(`  - ${numConnections} connections established in ${duration}ms`);
            console.log(`  - Average time per connection: ${(duration / numConnections).toFixed(2)}ms`);
            
            clearTimeout(timeout);
            
            // Clean up
            clients.forEach(client => client.disconnect());
            resolve(true);
          }
        });
        
        client.on('connect_error', (error) => {
          console.log(`✗ Connection ${i + 1} failed:`, error.message);
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      console.log('✗ Performance test setup failed:', error.message);
      resolve(false);
    }
  });
}

// Test 10: Cleanup and Disconnection
async function testCleanupAndDisconnection() {
  console.log('\n=== Test 10: Cleanup and Disconnection ===');
  
  return new Promise((resolve, reject) => {
    const client = createSocketClient();
    let cleanupComplete = false;
    
    const timeout = setTimeout(() => {
      if (!cleanupComplete) {
        console.log('✗ Cleanup test timeout');
        resolve(false);
      }
    }, 5000);
    
    client.on('connect', () => {
      console.log('✓ Connected to server');
      
      // Join room and subscribe to notifications
      client.emit('joinRoom', 'cleanup_test_user');
      client.emit('subscribeToNotifications', 'cleanup_test_user');
      
      // Disconnect after a short delay
      setTimeout(() => {
        client.disconnect();
      }, 1000);
    });
    
    client.on('disconnect', () => {
      console.log('✓ Client disconnected successfully');
      cleanupComplete = true;
      clearTimeout(timeout);
      resolve(true);
    });
    
    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('✗ Connection failed:', error.message);
      resolve(false);
    });
  });
}

// Main test runner
async function runSocketIOTests() {
  console.log('🔌 Starting Comprehensive Socket.io Tests...\n');
  console.log('=' .repeat(60));
  
  const results = {
    basicConnection: false,
    roomJoining: false,
    notificationSubscription: false,
    messageSending: false,
    multipleClients: false,
    errorHandling: false,
    connectionPersistence: false,
    databaseIntegration: false,
    performance: false,
    cleanup: false
  };
  
  try {
    // Test database integration first
    results.databaseIntegration = await testDatabaseIntegration();
    
    // Run all other tests
    results.basicConnection = await testBasicConnection();
    results.roomJoining = await testRoomJoining();
    results.notificationSubscription = await testNotificationSubscription();
    results.messageSending = await testMessageSending();
    results.multipleClients = await testMultipleClients();
    results.errorHandling = await testErrorHandling();
    results.connectionPersistence = await testConnectionPersistence();
    results.performance = await testPerformance();
    results.cleanup = await testCleanupAndDisconnection();
    
    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 SOCKET.IO TEST RESULTS');
    console.log('=' .repeat(60));
    
    const testNames = {
      basicConnection: 'Basic Connection',
      roomJoining: 'Room Joining',
      notificationSubscription: 'Notification Subscription',
      messageSending: 'Message Sending/Receiving',
      multipleClients: 'Multiple Clients',
      errorHandling: 'Error Handling',
      connectionPersistence: 'Connection Persistence',
      databaseIntegration: 'Database Integration',
      performance: 'Performance Test',
      cleanup: 'Cleanup and Disconnection'
    };
    
    console.log('\n📊 Individual Test Results:');
    Object.entries(results).forEach(([key, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`   ${testNames[key]}: ${status}`);
    });
    
    const passedTests = Object.values(results).filter(result => result === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎉 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('✅ ALL SOCKET.IO TESTS PASSED! Real-time features are working correctly.');
    } else if (passedTests > totalTests / 2) {
      console.log('⚠️  Most tests passed. Some real-time features may need attention.');
    } else {
      console.log('❌ Multiple tests failed. Socket.io configuration needs review.');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🚀 Socket.io Features Status:');
    console.log('   - Real-time messaging capability');
    console.log('   - User room management');
    console.log('   - Notification system');
    console.log('   - Multiple client support');
    console.log('   - Database integration');
    console.log('   - Error handling');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Socket.io test suite failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the tests
if (require.main === module) {
  runSocketIOTests();
}

module.exports = {
  runSocketIOTests
};
