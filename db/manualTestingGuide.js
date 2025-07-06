// Manual Backend Testing Checklist and Tools
// Run these commands to manually verify different aspects of your backend

console.log(`
🔍 MANUAL BACKEND TESTING GUIDE
===============================

## 1. Browser-Based Testing

### Open these URLs in your browser:
✅ http://localhost:3000/ - Home page (should show login form)
✅ http://localhost:3000/sign-up - Registration page  
✅ http://localhost:3000/users - Should redirect to login (protected route)
✅ http://localhost:3000/posts - Should redirect to login (protected route)

### After logging in with username: johndoe, password: password123:
✅ http://localhost:3000/users - Should show users list
✅ http://localhost:3000/posts - Should show posts
✅ http://localhost:3000/search?q=test - Should show search results
✅ http://localhost:3000/notifications - Should show notifications

## 2. API Testing with curl/Postman

### Test login endpoint:
curl -X POST http://localhost:3000/log-in \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=johndoe&password=password123" \\
  -c cookies.txt -v

### Test protected endpoint with session:
curl -X GET http://localhost:3000/posts \\
  -b cookies.txt -v

### Test sign-up endpoint:
curl -X POST http://localhost:3000/sign-up \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=newuser&email=new@example.com&password=newpass123" \\
  -v

## 3. Database Direct Verification

### Connect to PostgreSQL and run these queries:
psql -h localhost -U postgres -d top_users

-- Check user count
SELECT COUNT(*) as user_count FROM "User";

-- Check latest posts
SELECT p.title, u.username, p."createdAt" 
FROM "Post" p 
JOIN "User" u ON p."authorId" = u.id 
ORDER BY p."createdAt" DESC 
LIMIT 5;

-- Check authentication data
SELECT username, email, 
       CASE WHEN password ~ '^\\$2[aby]\\$' THEN 'Properly hashed' ELSE 'Not hashed' END as password_status
FROM "User" 
LIMIT 5;

## 4. Real-time Features Testing

### Open browser console on http://localhost:3000 and run:
const socket = io();
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('joinRoom', 'test_user_123');
});

socket.on('receiveMessage', (message) => {
  console.log('Message received:', message);
});

// Send a test message
socket.emit('sendMessage', {
  content: 'Browser test message',
  senderId: 'browser_user',
  receiverId: 'test_user_123'
});

## 5. Performance Testing Tools

### Using Apache Bench (ab):
ab -n 100 -c 10 http://localhost:3000/

### Using wrk (if installed):
wrk -t12 -c400 -d30s http://localhost:3000/

## 6. Log Analysis

### Check server logs for:
✅ No error messages during startup
✅ Successful database connections
✅ Authentication success/failure logs
✅ Socket.io connection logs
✅ No unhandled promise rejections

## 7. Resource Monitoring

### Windows Task Manager:
✅ Check node.exe memory usage (should be reasonable)
✅ Check CPU usage during load
✅ Monitor for memory leaks over time

### PowerShell Resource Check:
Get-Process -Name "node" | Format-Table ProcessName, CPU, WorkingSet

## 8. Frontend Integration Testing

### If you have a frontend, test:
✅ Login/logout flow
✅ User registration
✅ Protected route access
✅ Real-time message sending
✅ File uploads (if implemented)
✅ Search functionality
✅ Notification display

## 9. Mobile/Responsive Testing

### Test on different devices:
✅ Mobile browser access
✅ Tablet view
✅ Desktop browser
✅ Different screen orientations

## 10. Error Scenario Testing

### Try these error cases manually:
✅ Wrong login credentials
✅ Duplicate user registration
✅ Access protected routes without login
✅ Invalid form submissions
✅ Network disconnection during Socket.io
✅ Database connection loss simulation

## 11. Environment Testing

### Test with different configurations:
✅ Different NODE_ENV values
✅ Missing environment variables
✅ Different database credentials
✅ Different ports

## 12. Third-party Service Testing

### If using external services:
✅ Cloudinary image uploads
✅ Email service (if implemented)  
✅ Payment processing (if implemented)
✅ Social media login (if implemented)

## 13. Backup and Recovery

### Test data persistence:
✅ Stop server, restart, verify data intact
✅ Database backup/restore procedures
✅ Session persistence across server restarts

## 14. Security Manual Testing

### Test security measures:
✅ Try SQL injection in forms
✅ Test XSS in input fields
✅ Check password storage (should be hashed)
✅ Verify session security
✅ Test CORS policies
✅ Check for sensitive data in responses

## 15. Documentation Verification

### Verify your setup:
✅ README.md has correct setup instructions
✅ Environment variables documented
✅ API endpoints documented
✅ Database schema documented
✅ Deployment instructions available
`);

// Export checklist for programmatic use
module.exports = {
  manualTestingChecklist: [
    'Browser-based UI testing',
    'API endpoint testing with curl/Postman',
    'Direct database verification',
    'Real-time features testing',
    'Performance testing with tools',
    'Log analysis and monitoring',
    'Resource usage monitoring',
    'Frontend integration testing',
    'Mobile/responsive testing', 
    'Error scenario testing',
    'Environment configuration testing',
    'Third-party service testing',
    'Backup and recovery testing',
    'Security manual testing',
    'Documentation verification'
  ]
};
