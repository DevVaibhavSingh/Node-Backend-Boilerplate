# OOP Express Backend

A robust Node.js/Express backend application that strictly adheres to Object-Oriented Programming principles and implements various design patterns for enhanced modularity, security, and scalability.

## 🏗️ Architecture Overview

This application follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────┐
│   Controllers   │ ← Handle HTTP requests/responses
├─────────────────┤
│    Services     │ ← Business logic layer
├─────────────────┤
│  Repositories   │ ← Data access layer
├─────────────────┤
│    Entities     │ ← Domain models
└─────────────────┘
```

## 🎯 Design Patterns Implemented

### 1. **SOLID Principles**
- **Single Responsibility Principle (SRP)**: Each class has one reason to change
- **Open/Closed Principle (OCP)**: Open for extension, closed for modification
- **Liskov Substitution Principle (LSP)**: Subtypes are substitutable for their base types
- **Interface Segregation Principle (ISP)**: Clients depend only on interfaces they use
- **Dependency Inversion Principle (DIP)**: High-level modules don't depend on low-level modules

### 2. **Design Patterns**
- **Factory Pattern**: Dependency injection and object creation
- **Singleton Pattern**: Logger service (single instance)
- **Strategy Pattern**: Different authentication strategies
- **Observer Pattern**: Multiple logging transports
- **Repository Pattern**: Data access abstraction
- **Template Method Pattern**: Base classes with customizable steps
- **Adapter Pattern**: Winston logger adaptation
- **Middleware Pattern**: Express middleware organization

### 3. **OOP Principles**
- **Encapsulation**: Private properties with getters/setters
- **Inheritance**: Base classes for common functionality
- **Abstraction**: Interfaces and abstract classes
- **Polymorphism**: Different implementations of interfaces

## 🚀 Features

### Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Error handling without information leakage

### Scalability
- ✅ Stateless services
- ✅ Dependency injection
- ✅ Modular architecture
- ✅ Plugin-friendly design
- ✅ Microservices-ready code structure

### Maintainability
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Input validation
- ✅ Clean code structure
- ✅ Extensive documentation

## 📁 Project Structure

```
src/
├── core/
│   ├── interfaces/          # Interface definitions
│   │   ├── ILogger.js
│   │   ├── IRepository.js
│   │   └── IAuthenticationService.js
│   ├── abstract/           # Abstract base classes
│   │   ├── BaseEntity.js
│   │   └── BaseService.js
│   └── services/           # Core services
│       └── WinstonLogger.js
├── entities/               # Domain entities
│   └── User.js
├── repositories/           # Data access layer
│   └── InMemoryUserRepository.js
├── services/               # Business logic layer
│   ├── AuthenticationService.js
│   └── UserService.js
├── middleware/             # Express middleware
│   └── AuthenticationMiddleware.js
├── controllers/            # HTTP request handlers
│   ├── BaseController.js
│   ├── AuthController.js
│   └── UserController.js
├── routes/                 # Route definitions
│   ├── authRoutes.js
│   └── userRoutes.js
└── app.js                  # Main application file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd oop-express-backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### Environment Configuration
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Running the Application
```bash
# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isEmailVerified": true
    },
    "token": "jwt-token",
    "expiresIn": "24h"
  }
}
```

#### POST `/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "user"
}
```

#### GET `/auth/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### User Management Endpoints

#### GET `/users`
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search term
- `role`: Filter by role (user, admin, moderator)
- `isActive`: Filter by active status
- `isEmailVerified`: Filter by email verification status

#### GET `/users/:id`
Get user by ID (moderator/admin only).

#### POST `/users`
Create a new user (admin only).

#### PUT `/users/:id`
Update user (admin only).

#### DELETE `/users/:id`
Delete user (admin only).

#### PATCH `/users/:id/deactivate`
Soft delete user (admin only).

#### PATCH `/users/:id/restore`
Restore soft-deleted user (admin only).

### Health Check

#### GET `/health`
Check application health.

**Response:**
```json
{
  "success": true,
  "message": "Application is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token refresh mechanism
- Rate limiting on authentication endpoints

### Input Validation
- Request body validation with Joi
- Query parameter validation
- Path parameter validation
- SQL injection prevention
- XSS protection

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy (CSP)
- Rate limiting
- Request size limits

## 🧪 Testing

The application is designed to be highly testable:

- **Stateless services**: No shared state between requests
- **Dependency injection**: Easy to mock dependencies
- **Interface-based design**: Easy to create test doubles
- **Separation of concerns**: Each layer can be tested independently

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Extensibility

### Adding New Entities
1. Create entity class extending `BaseEntity`
2. Implement required abstract methods
3. Create repository implementing `IRepository`
4. Create service extending `BaseService`
5. Create controller extending `BaseController`
6. Create routes and add to application

### Adding New Authentication Strategies
1. Implement new strategy in `AuthenticationService`
2. Add strategy to `_strategies` object
3. Use `getStrategy()` method to access

### Database Integration
The application is designed to easily switch from in-memory storage to any database:

1. Create new repository implementing `IRepository`
2. Update dependency injection in `app.js`
3. No changes needed in services or controllers

## 📝 Logging

The application uses Winston for comprehensive logging:

- **Console logging** in development
- **File logging** in production
- **Structured logging** with metadata
- **Error tracking** with stack traces
- **Request logging** with IP and user agent

## 🚀 Deployment

### Production Considerations
1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper CORS origins
4. Set up proper logging
5. Use environment variables for all secrets
6. Enable compression
7. Set up monitoring and health checks

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow SOLID principles
2. Maintain test coverage
3. Add proper documentation
4. Follow the existing code structure
5. Use meaningful commit messages

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review the code examples
3. Create an issue with detailed information

---

**Built with ❤️ using Object-Oriented Programming principles and modern JavaScript practices.** 