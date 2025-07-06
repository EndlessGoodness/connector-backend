const axios = require('axios');
const { Pool } = require("pg");

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

// Test credentials
const testCredentials = {
  username: 'johndoe',
  password: 'password123'
};

// Helper function to login and get session cookies
async function loginAndGetCookies() {
  try {
    const response = await axios.post(`${BASE_URL}/log-in`, testCredentials, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
      withCredentials: true
    });
    
    return response.headers['set-cookie'];
  } catch (error) {
    console.error('Login failed:', error.message);
    return null;
  }
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(method, url, data = null, cookies = null) {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {},
    maxRedirects: 0,
    validateStatus: (status) => status < 500
  };
  
  if (cookies) {
    config.headers.Cookie = cookies.join('; ');
  }
  
  if (data) {
    config.data = data;
  }
  
  return await axios(config);
}

// Test 1: Users API Endpoints
async function testUsersAPI(cookies) {
  console.log('\n=== Test 1: Users API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test GET /users (list all users)
    const getUsersResponse = await makeAuthenticatedRequest('GET', '/users', null, cookies);
    if (getUsersResponse.status === 200) {
      console.log('✓ GET /users successful');
    } else {
      console.log(`✗ GET /users failed (status: ${getUsersResponse.status})`);
    }
    
    // Test GET /users/:id (get specific user)
    const getUserResponse = await makeAuthenticatedRequest('GET', '/users/1', null, cookies);
    if (getUserResponse.status === 200) {
      console.log('✓ GET /users/:id successful');
    } else {
      console.log(`✗ GET /users/:id failed (status: ${getUserResponse.status})`);
    }
    
    // Test PUT /users/:id (update user) - this might need specific data
    const updateUserData = {
      bio: 'Updated bio for testing'
    };
    const updateUserResponse = await makeAuthenticatedRequest('PUT', '/users/1', updateUserData, cookies);
    if (updateUserResponse.status === 200) {
      console.log('✓ PUT /users/:id successful');
    } else {
      console.log(`✗ PUT /users/:id failed (status: ${updateUserResponse.status})`);
    }
    
  } catch (error) {
    console.error('✗ Users API test error:', error.message);
  }
}

// Test 2: Posts API Endpoints
async function testPostsAPI(cookies) {
  console.log('\n=== Test 2: Posts API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test GET /posts (list all posts)
    const getPostsResponse = await makeAuthenticatedRequest('GET', '/posts', null, cookies);
    if (getPostsResponse.status === 200) {
      console.log('✓ GET /posts successful');
      console.log(`  Found ${getPostsResponse.data?.length || 0} posts`);
    } else {
      console.log(`✗ GET /posts failed (status: ${getPostsResponse.status})`);
    }
    
    // Test POST /posts (create new post)
    const newPostData = {
      title: 'Test Post',
      content: 'This is a test post created by the API test suite.'
    };
    const createPostResponse = await makeAuthenticatedRequest('POST', '/posts', newPostData, cookies);
    if (createPostResponse.status === 201 || createPostResponse.status === 200) {
      console.log('✓ POST /posts (create) successful');
      
      // Try to get the created post ID for further testing
      const createdPostId = createPostResponse.data?.id || createPostResponse.data?.postId;
      if (createdPostId) {
        console.log(`  Created post ID: ${createdPostId}`);
        
        // Test GET /posts/:id (get specific post)
        const getPostResponse = await makeAuthenticatedRequest('GET', `/posts/${createdPostId}`, null, cookies);
        if (getPostResponse.status === 200) {
          console.log('✓ GET /posts/:id successful');
        } else {
          console.log(`✗ GET /posts/:id failed (status: ${getPostResponse.status})`);
        }
        
        // Test PUT /posts/:id (update post)
        const updatePostData = {
          title: 'Updated Test Post',
          content: 'This post has been updated by the API test suite.'
        };
        const updatePostResponse = await makeAuthenticatedRequest('PUT', `/posts/${createdPostId}`, updatePostData, cookies);
        if (updatePostResponse.status === 200) {
          console.log('✓ PUT /posts/:id (update) successful');
        } else {
          console.log(`✗ PUT /posts/:id failed (status: ${updatePostResponse.status})`);
        }
        
        // Test DELETE /posts/:id (delete post)
        const deletePostResponse = await makeAuthenticatedRequest('DELETE', `/posts/${createdPostId}`, null, cookies);
        if (deletePostResponse.status === 200 || deletePostResponse.status === 204) {
          console.log('✓ DELETE /posts/:id successful');
        } else {
          console.log(`✗ DELETE /posts/:id failed (status: ${deletePostResponse.status})`);
        }
      }
    } else {
      console.log(`✗ POST /posts failed (status: ${createPostResponse.status})`);
    }
    
  } catch (error) {
    console.error('✗ Posts API test error:', error.message);
  }
}

// Test 3: Comments API Endpoints
async function testCommentsAPI(cookies) {
  console.log('\n=== Test 3: Comments API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // First, get a post to comment on
    const getPostsResponse = await makeAuthenticatedRequest('GET', '/posts', null, cookies);
    if (getPostsResponse.status === 200 && getPostsResponse.data?.length > 0) {
      const postId = getPostsResponse.data[0].id;
      
      // Test POST /comments (create comment)
      const newCommentData = {
        postId: postId,
        content: 'This is a test comment.'
      };
      const createCommentResponse = await makeAuthenticatedRequest('POST', '/comments', newCommentData, cookies);
      if (createCommentResponse.status === 201 || createCommentResponse.status === 200) {
        console.log('✓ POST /comments (create) successful');
        
        // Test GET /comments (get comments for post)
        const getCommentsResponse = await makeAuthenticatedRequest('GET', `/comments?postId=${postId}`, null, cookies);
        if (getCommentsResponse.status === 200) {
          console.log('✓ GET /comments successful');
        } else {
          console.log(`✗ GET /comments failed (status: ${getCommentsResponse.status})`);
        }
      } else {
        console.log(`✗ POST /comments failed (status: ${createCommentResponse.status})`);
      }
    } else {
      console.log('✗ No posts available for comment testing');
    }
    
  } catch (error) {
    console.error('✗ Comments API test error:', error.message);
  }
}

// Test 4: Search API Endpoints
async function testSearchAPI(cookies) {
  console.log('\n=== Test 4: Search API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test GET /search (search functionality)
    const searchResponse = await makeAuthenticatedRequest('GET', '/search?q=test', null, cookies);
    if (searchResponse.status === 200) {
      console.log('✓ GET /search successful');
    } else {
      console.log(`✗ GET /search failed (status: ${searchResponse.status})`);
    }
    
    // Test search with different parameters
    const userSearchResponse = await makeAuthenticatedRequest('GET', '/search?q=john&type=users', null, cookies);
    if (userSearchResponse.status === 200) {
      console.log('✓ GET /search (user search) successful');
    } else {
      console.log(`✗ GET /search (user search) failed (status: ${userSearchResponse.status})`);
    }
    
  } catch (error) {
    console.error('✗ Search API test error:', error.message);
  }
}

// Test 5: Realms API Endpoints
async function testRealmsAPI(cookies) {
  console.log('\n=== Test 5: Realms API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test GET /realms (list all realms)
    const getRealmsResponse = await makeAuthenticatedRequest('GET', '/realms', null, cookies);
    if (getRealmsResponse.status === 200) {
      console.log('✓ GET /realms successful');
      console.log(`  Found ${getRealmsResponse.data?.length || 0} realms`);
    } else {
      console.log(`✗ GET /realms failed (status: ${getRealmsResponse.status})`);
    }
    
    // Test POST /realms (create new realm)
    const newRealmData = {
      name: 'Test Realm',
      description: 'A test realm created by the API test suite.'
    };
    const createRealmResponse = await makeAuthenticatedRequest('POST', '/realms', newRealmData, cookies);
    if (createRealmResponse.status === 201 || createRealmResponse.status === 200) {
      console.log('✓ POST /realms (create) successful');
      
      const createdRealmId = createRealmResponse.data?.id || createRealmResponse.data?.realmId;
      if (createdRealmId) {
        // Test GET /realms/:id (get specific realm)
        const getRealmResponse = await makeAuthenticatedRequest('GET', `/realms/${createdRealmId}`, null, cookies);
        if (getRealmResponse.status === 200) {
          console.log('✓ GET /realms/:id successful');
        } else {
          console.log(`✗ GET /realms/:id failed (status: ${getRealmResponse.status})`);
        }
      }
    } else {
      console.log(`✗ POST /realms failed (status: ${createRealmResponse.status})`);
    }
    
  } catch (error) {
    console.error('✗ Realms API test error:', error.message);
  }
}

// Test 6: Notifications API Endpoints
async function testNotificationsAPI(cookies) {
  console.log('\n=== Test 6: Notifications API Endpoints ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test GET /notifications (get user notifications)
    const getNotificationsResponse = await makeAuthenticatedRequest('GET', '/notifications', null, cookies);
    if (getNotificationsResponse.status === 200) {
      console.log('✓ GET /notifications successful');
      console.log(`  Found ${getNotificationsResponse.data?.length || 0} notifications`);
    } else {
      console.log(`✗ GET /notifications failed (status: ${getNotificationsResponse.status})`);
    }
    
    // Test PUT /notifications/:id (mark notification as read)
    if (getNotificationsResponse.data?.length > 0) {
      const notificationId = getNotificationsResponse.data[0].id;
      const markReadResponse = await makeAuthenticatedRequest('PUT', `/notifications/${notificationId}`, { read: true }, cookies);
      if (markReadResponse.status === 200) {
        console.log('✓ PUT /notifications/:id (mark as read) successful');
      } else {
        console.log(`✗ PUT /notifications/:id failed (status: ${markReadResponse.status})`);
      }
    }
    
  } catch (error) {
    console.error('✗ Notifications API test error:', error.message);
  }
}

// Test 7: Unauthorized Access to API Endpoints
async function testUnauthorizedAccess() {
  console.log('\n=== Test 7: Unauthorized Access to API Endpoints ===');
  
  const endpoints = [
    { method: 'GET', url: '/users' },
    { method: 'GET', url: '/posts' },
    { method: 'POST', url: '/posts', data: { title: 'Test', content: 'Test' } },
    { method: 'GET', url: '/comments' },
    { method: 'GET', url: '/search?q=test' },
    { method: 'GET', url: '/realms' },
    { method: 'GET', url: '/notifications' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeAuthenticatedRequest(endpoint.method, endpoint.url, endpoint.data, null);
      
      if (response.status === 401 || response.status === 302) {
        console.log(`✓ ${endpoint.method} ${endpoint.url} correctly blocked (status: ${response.status})`);
      } else {
        console.log(`✗ ${endpoint.method} ${endpoint.url} unexpectedly accessible (status: ${response.status})`);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 302) {
        console.log(`✓ ${endpoint.method} ${endpoint.url} correctly blocked (status: ${error.response.status})`);
      } else {
        console.error(`✗ ${endpoint.method} ${endpoint.url} test error:`, error.message);
      }
    }
  }
}

// Test 8: Error Handling
async function testErrorHandling(cookies) {
  console.log('\n=== Test 8: Error Handling ===');
  
  if (!cookies) {
    console.log('✗ No authentication cookies available');
    return;
  }
  
  try {
    // Test 404 errors
    const notFoundResponse = await makeAuthenticatedRequest('GET', '/nonexistent-endpoint', null, cookies);
    if (notFoundResponse.status === 404) {
      console.log('✓ 404 error handling working correctly');
    } else {
      console.log(`✗ 404 error handling failed (status: ${notFoundResponse.status})`);
    }
    
    // Test accessing non-existent resources
    const nonExistentUserResponse = await makeAuthenticatedRequest('GET', '/users/99999', null, cookies);
    if (nonExistentUserResponse.status === 404 || nonExistentUserResponse.status === 500) {
      console.log('✓ Non-existent resource error handling working');
    } else {
      console.log(`✗ Non-existent resource error handling failed (status: ${nonExistentUserResponse.status})`);
    }
    
    // Test invalid data submission
    const invalidPostData = {
      title: '', // Empty title
      content: '' // Empty content
    };
    const invalidPostResponse = await makeAuthenticatedRequest('POST', '/posts', invalidPostData, cookies);
    if (invalidPostResponse.status === 400 || invalidPostResponse.status === 422) {
      console.log('✓ Invalid data error handling working');
    } else {
      console.log(`✗ Invalid data error handling failed (status: ${invalidPostResponse.status})`);
    }
    
  } catch (error) {
    console.error('✗ Error handling test error:', error.message);
  }
}

// Main test runner
async function runAPIEndpointTests() {
  console.log('🔗 Starting Comprehensive API Endpoint Tests...\n');
  
  try {
    // Login first
    console.log('Logging in...');
    const cookies = await loginAndGetCookies();
    
    if (!cookies) {
      console.log('❌ Could not authenticate. Please ensure the test user exists and the server is running.');
      return;
    }
    
    console.log('✓ Successfully authenticated');
    
    // Run all API tests
    await testUsersAPI(cookies);
    await testPostsAPI(cookies);
    await testCommentsAPI(cookies);
    await testSearchAPI(cookies);
    await testRealmsAPI(cookies);
    await testNotificationsAPI(cookies);
    await testUnauthorizedAccess();
    await testErrorHandling(cookies);
    
    console.log('\n🎉 API endpoint tests completed!');
    
  } catch (error) {
    console.error('\n❌ API endpoint test suite failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the tests
if (require.main === module) {
  runAPIEndpointTests();
}

module.exports = {
  runAPIEndpointTests
};
