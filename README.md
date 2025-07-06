# Connector Backend 🚀

> A full-featured social media platform backend built with Node.js, Express, PostgreSQL, and Socket.IO

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-red.svg)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- 🔐 **User Authentication** - Secure login/signup with session management
- 👥 **User Management** - Profile creation, editing, and user discovery
- 📝 **Posts & Comments** - Create, read, update, delete posts with commenting system
- 🔍 **Search Functionality** - Search users, posts, and content
- 🌐 **Realms** - Community spaces for organized discussions
- 📱 **Real-time Features** - Live notifications and messaging with Socket.IO
- 🖼️ **Image Upload** - Cloudinary integration for image management
- 📊 **Notifications** - Real-time notification system

### Advanced Features
- 🛡️ **Security** - CORS, input validation, password hashing
- 📈 **Performance** - Connection pooling, optimized queries
- 🧪 **Testing** - Comprehensive test suite with 12 validation methods
- 📊 **Health Monitoring** - Built-in health checks and performance monitoring
- 🚀 **Production Ready** - Complete deployment readiness assessment

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Socket.IO** - Real-time communication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **express-session** - Session management

### Additional Tools
- **Cloudinary** - Image storage and management
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **EJS** - Template engine
- **Axios** - HTTP client for testing

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**
- **Git**

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/connector-backend.git
   cd connector-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb top_users
   
   # Run database setup (optional - includes sample data)
   node db/insertSampleData.js
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_NAME=top_users
DB_PASSWORD=your_database_password
DB_PORT=5432

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application Configuration
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Setup

The application uses PostgreSQL with the following main tables:

- **User** - User accounts and profiles
- **Post** - User posts and content
- **Comment** - Comments on posts
- **Realm** - Community spaces
- **Notification** - User notifications
- **Follow** - User following relationships
- **Like** - Post likes
- **CommentLike** - Comment likes
- **Message** - Real-time messages

### Sample Data
```bash
# Populate database with sample data
node db/insertSampleData.js

# Verify database setup
node db/checkSchema.js
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /sign-up` - User registration
- `POST /log-in` - User login
- `POST /log-out` - User logout

### User Endpoints
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile

### Post Endpoints
- `GET /posts` - Get all posts
- `POST /posts` - Create new post
- `GET /posts/:id` - Get post by ID
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

### Comment Endpoints
- `GET /posts/:postId/comments` - Get comments for a post
- `POST /posts/:postId/comments` - Add comment to post

### Search Endpoints
- `GET /search` - Search users, posts, and content
- `GET /search/users` - Search users only
- `GET /search/posts` - Search posts only

### Realm Endpoints
- `GET /realms` - Get all realms
- `POST /realms` - Create new realm
- `GET /realms/:id` - Get realm by ID
- `POST /realms/:id/join` - Join a realm

### Notification Endpoints
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id` - Mark notification as read

## 🧪 Testing

This project includes a comprehensive testing suite with 12 different validation methods:

### Quick Testing
```bash
# Run all tests
node db/ultimateTestRunner.js

# Quick essential tests
node db/ultimateTestRunner.js --quick

# Interactive mode
node db/ultimateTestRunner.js --interactive
```

### Individual Test Suites
```bash
# Database tests
node db/testdb.js
node db/testIntegration.js

# Authentication tests
node db/testAuthenticationComprehensive.js

# API tests
node db/testAPIEndpointsComprehensive.js

# Security tests
node db/testSecurityComprehensive.js

# Socket.IO tests
node db/testSocketIO.js
node db/testSocketIOAdvanced.js

# Performance tests
node db/performanceValidation.js

# Health monitoring
node db/healthMonitor.js

# Production readiness
node db/productionReadinessCheck.js
```

### Test Coverage
- ✅ Database connectivity and schema validation
- ✅ Authentication and authorization
- ✅ API endpoint functionality
- ✅ Real-time features (Socket.IO)
- ✅ Security testing (SQL injection, XSS, CSRF)
- ✅ Performance and load testing
- ✅ Health monitoring and system checks
- ✅ Production readiness assessment

## 📁 Project Structure

```
connector-backend/
├── app.js                 # Main application file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── controllers/         # Route controllers
│   ├── usersController.js
│   ├── postController.js
│   ├── commentController.js
│   ├── realmsController.js
│   ├── searchController.js
│   ├── notifications.js
│   └── imagesController.js
├── routes/              # Express routes
│   ├── userRoute.js
│   ├── postRoute.js
│   ├── commentRoute.js
│   ├── realmRoute.js
│   ├── searchRoute.js
│   ├── notificationRoute.js
│   └── imagesRoute.js
├── queries/             # Database queries
│   ├── usersQueries.js
│   ├── postsQuery.js
│   ├── commentsQuery.js
│   ├── realmsQuery.js
│   ├── searchQuery.js
│   ├── notificationsQuery.js
│   ├── followsQuery.js
│   ├── likesQueries.js
│   ├── commentLikesQuery.js
│   ├── joinRealmsQuery.js
│   └── imagesQueries.js
├── utils/               # Utility functions
│   ├── socket.js        # Socket.IO configuration
│   ├── validator.js     # Input validation
│   ├── cloudinary-config.js
│   └── multer-config.js
├── views/               # EJS templates
│   ├── index.ejs
│   ├── login.ejs
│   ├── sign-up-form.ejs
│   ├── users.ejs
│   ├── posts.ejs
│   ├── profile.ejs
│   ├── search.ejs
│   ├── notifications.ejs
│   └── ...
└── db/                  # Database scripts and tests
    ├── insertSampleData.js
    ├── checkSchema.js
    ├── testIntegration.js
    ├── ultimateTestRunner.js
    ├── healthMonitor.js
    ├── performanceValidation.js
    ├── productionReadinessCheck.js
    └── ...
```

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **Session Management** - Express sessions with secure configuration
- **Input Validation** - express-validator for sanitizing user input
- **SQL Injection Prevention** - Parameterized queries with pg
- **CORS Protection** - Configured for specific origins
- **XSS Prevention** - Input sanitization and validation
- **CSRF Protection** - Session-based CSRF tokens
- **Rate Limiting** - Built-in request rate limiting
- **Security Headers** - Helmet.js integration ready

## 🚀 Deployment

### Production Checklist
```bash
# Run production readiness check
node db/productionReadinessCheck.js
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up process manager (PM2)
6. Configure monitoring and logging
7. Set up automated backups

### Deployment Commands
```bash
# Install production dependencies
npm ci --only=production

# Run with PM2
pm2 start app.js --name connector-backend
pm2 startup
pm2 save
```

## 📊 Monitoring

The application includes built-in monitoring and health checks:

```bash
# Health monitoring
node db/healthMonitor.js

# Performance monitoring
node db/performanceValidation.js

# Production readiness
node db/productionReadinessCheck.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Run the full test suite before submitting
- Update documentation for significant changes

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- PostgreSQL team for the robust database system
- Socket.IO team for real-time communication
- All contributors and maintainers

## 📞 Support

If you have any questions or need help with setup, please:

1. Check the documentation
2. Run the diagnostic tests
3. Open an issue on GitHub

---

**Built with ❤️ using Node.js, Express, and PostgreSQL**