require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Core services
const WinstonLogger = require('./core/services/WinstonLogger');
const InMemoryUserRepository = require('./repositories/InMemoryUserRepository');
const AuthenticationService = require('./services/AuthenticationService');
const UserService = require('./services/UserService');

// Routes
const AuthRoutes = require('./routes/authRoutes');
const UserRoutes = require('./routes/userRoutes');

/**
 * @class Application
 * @description Main application class
 * Implements Factory pattern for dependency injection
 * Follows Single Responsibility Principle - orchestrates the application
 */
class Application {
    constructor() {
        this.app = express();
        this.logger = null;
        this.port = process.env.PORT || 3000;
        this.host = process.env.HOST || 'localhost';
    }

    /**
     * Factory Method: Initialize application dependencies
     */
    initializeDependencies() {
        // Initialize logger (Singleton pattern)
        this.logger = new WinstonLogger({
            level: process.env.LOG_LEVEL || 'info',
            logFilePath: process.env.LOG_FILE_PATH || 'logs/app.log'
        });

        // Initialize repositories
        this.userRepository = new InMemoryUserRepository();

        // Initialize services with dependency injection
        this.authenticationService = new AuthenticationService(this.logger, this.userRepository);
        this.userService = new UserService(this.logger, this.userRepository);

        this.logger.info('Dependencies initialized successfully');
    }

    /**
     * Configure Express middleware
     */
    configureMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Compression middleware
        this.app.use(compression());

        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Global rate limiting
        const globalRateLimit = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                error: {
                    message: 'Too many requests from this IP',
                    code: 'RATE_LIMIT_EXCEEDED'
                }
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.use(globalRateLimit);

        // Request logging middleware
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });

        this.logger.info('Middleware configured successfully');
    }

    /**
     * Configure application routes
     */
    configureRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Application is healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // API versioning
        this.app.get('/api', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'OOP Express Backend API',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                endpoints: {
                    auth: '/api/v1/auth',
                    users: '/api/v1/users',
                    health: '/health'
                }
            });
        });

        // API v1 routes
        const authRoutes = new AuthRoutes(this.authenticationService, this.logger);
        const userRoutes = new UserRoutes(this.userService, this.logger);

        this.app.use('/api/v1/auth', authRoutes.getRouter());
        this.app.use('/api/v1/users', userRoutes.getRouter());

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: {
                    message: 'Endpoint not found',
                    code: 'NOT_FOUND',
                    path: req.originalUrl
                }
            });
        });

        this.logger.info('Routes configured successfully');
    }

    /**
     * Configure error handling middleware
     */
    configureErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            this.logger.error('Unhandled error:', error);

            // Don't leak error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';

            const errorResponse = {
                success: false,
                error: {
                    message: isDevelopment ? error.message : 'Internal server error',
                    code: 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString()
                }
            };

            if (isDevelopment && error.stack) {
                errorResponse.error.stack = error.stack;
            }

            res.status(500).json(errorResponse);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });

        this.logger.info('Error handling configured successfully');
    }

    /**
     * Start the application server
     */
    start() {
        try {
            // Initialize dependencies
            this.initializeDependencies();

            // Configure middleware
            this.configureMiddleware();

            // Configure routes
            this.configureRoutes();

            // Configure error handling
            this.configureErrorHandling();

            // Start server
            this.app.listen(this.port, this.host, () => {
                this.logger.info(`Server is running on http://${this.host}:${this.port}`);
                this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
                this.logger.info(`API Documentation: http://${this.host}:${this.port}/api`);
            });

        } catch (error) {
            console.error('Failed to start application:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    gracefulShutdown() {
        this.logger.info('Received shutdown signal, starting graceful shutdown...');

        // Close server
        this.app.close(() => {
            this.logger.info('HTTP server closed');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            this.logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    }
}

// Create and start application
const app = new Application();

// Handle graceful shutdown
process.on('SIGTERM', () => app.gracefulShutdown());
process.on('SIGINT', () => app.gracefulShutdown());

// Start the application
app.start();

module.exports = app; 