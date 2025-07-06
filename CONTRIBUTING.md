# Contributing to Connector Backend

Thank you for your interest in contributing to Connector Backend! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Git
- Basic knowledge of JavaScript, Node.js, and Express.js

### Setup Development Environment

1. **Fork the repository**
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
   createdb top_users
   node db/insertSampleData.js
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

## 📝 Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Follow JavaScript ES6+ conventions
- Add comments for complex logic
- Use async/await for asynchronous operations

### Database Guidelines
- Use parameterized queries to prevent SQL injection
- Follow PostgreSQL naming conventions
- Create indexes for frequently queried columns
- Use transactions for complex operations

### Testing
- Write tests for new features
- Run the full test suite before submitting
- Ensure all tests pass
- Add edge case testing

```bash
# Run all tests
npm run test:full

# Run quick tests
npm test

# Run specific test
node db/testAuthenticationComprehensive.js
```

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test:full
   npm run health
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots if applicable
   - Ensure all tests pass

## 🐛 Bug Reports

When filing a bug report, please include:

1. **Description of the issue**
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details** (OS, Node.js version, etc.)
6. **Error messages** (if any)
7. **Screenshots** (if applicable)

### Bug Report Template
```markdown
**Bug Description:**
A clear and concise description of the bug.

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What you expected to happen.

**Actual Behavior:**
What actually happened.

**Environment:**
- OS: [e.g. Windows 10, Ubuntu 20.04]
- Node.js: [e.g. v18.17.0]
- PostgreSQL: [e.g. v14.9]

**Additional Context:**
Add any other context about the problem here.
```

## 💡 Feature Requests

When suggesting a new feature:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** in detail
3. **Explain the use case** and benefits
4. **Provide examples** if possible
5. **Consider implementation complexity**

## 🧪 Testing Guidelines

### Test Categories
- **Unit Tests** - Test individual functions
- **Integration Tests** - Test component interactions
- **API Tests** - Test endpoint functionality
- **Security Tests** - Test for vulnerabilities
- **Performance Tests** - Test response times and load

### Writing Tests
```javascript
// Example test structure
describe('User Authentication', () => {
  test('should login with valid credentials', async () => {
    // Test implementation
  });
  
  test('should reject invalid credentials', async () => {
    // Test implementation
  });
});
```

### Test Commands
```bash
# Run all validation tests
npm run test:full

# Run specific test categories
node db/testAuthenticationComprehensive.js
node db/testAPIEndpointsComprehensive.js
node db/testSecurityComprehensive.js

# Run performance tests
npm run performance

# Check health
npm run health
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex algorithms
- Explain configuration options
- Update README for new features

### API Documentation
- Document new endpoints
- Include request/response examples
- Specify authentication requirements
- Add error codes and messages

## 🔧 Development Tools

### Recommended Extensions (VS Code)
- ESLint
- Prettier
- REST Client
- PostgreSQL
- Thunder Client

### Debugging
- Use built-in Node.js debugger
- Add console.log statements for debugging
- Use PostgreSQL logs for database issues
- Test with various browsers

## 🚨 Security Considerations

### Security Best Practices
- Never commit sensitive data (.env files)
- Use parameterized queries
- Validate all user inputs
- Implement proper authentication
- Use HTTPS in production
- Regular security audits

### Security Testing
```bash
# Run security tests
node db/testSecurityComprehensive.js
```

## 🎯 Project Areas

### Areas for Contribution
- **Backend Features** - New API endpoints
- **Database Optimization** - Query improvements
- **Security Enhancements** - Security features
- **Performance Improvements** - Optimization
- **Testing** - Test coverage expansion
- **Documentation** - README, guides, comments
- **DevOps** - CI/CD, deployment scripts

### Priority Areas
- Real-time messaging improvements
- Advanced search functionality
- Performance optimization
- Mobile API compatibility
- Social media integrations

## 🏆 Recognition

Contributors will be recognized in:
- README contributors section
- GitHub contributors graph
- Release notes (for significant contributions)

## 📞 Getting Help

If you need help:
1. Check the documentation
2. Search existing issues
3. Run diagnostic tests
4. Ask questions in issues

### Contact
- GitHub Issues: [Project Issues](https://github.com/EndlessGoodness/connector-backend/issues)

## 📋 Development Checklist

Before submitting a PR:
- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
- [ ] Backward compatibility is maintained
- [ ] Error handling is implemented
- [ ] Edge cases are covered

Thank you for contributing to Connector Backend! 🎉
