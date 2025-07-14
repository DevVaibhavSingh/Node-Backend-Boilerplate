const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');

/**
 * @description Authentication routes
 * Implements Router pattern and organizes authentication endpoints
 */
class AuthRoutes {
    constructor(authenticationService, logger) {
        this.router = express.Router();
        this.authController = new AuthController(logger, authenticationService);
        this.authMiddleware = new AuthenticationMiddleware(authenticationService);

        this.initializeRoutes();
    }

    /**
     * Initialize authentication routes
     */
    initializeRoutes() {
        // Public routes (no authentication required)
        this.router.post('/login',
            this.authMiddleware.authRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
            this.authController.login
        );

        this.router.post('/register',
            this.authMiddleware.authRateLimit({ windowMs: 60 * 60 * 1000, max: 3 }),
            this.authController.register
        );

        this.router.post('/forgot-password',
            this.authMiddleware.authRateLimit({ windowMs: 60 * 60 * 1000, max: 3 }),
            this.authController.forgotPassword
        );

        this.router.post('/reset-password',
            this.authMiddleware.authRateLimit({ windowMs: 60 * 60 * 1000, max: 3 }),
            this.authController.resetPassword
        );

        this.router.get('/verify-email/:token',
            this.authController.verifyEmail
        );

        // Protected routes (authentication required)
        this.router.post('/refresh-token',
            this.authMiddleware.authenticateToken(),
            this.authController.refreshToken
        );

        this.router.get('/profile',
            this.authMiddleware.authenticateToken(),
            this.authController.getProfile
        );

        this.router.post('/change-password',
            this.authMiddleware.authenticateToken(),
            this.authController.changePassword
        );

        this.router.post('/logout',
            this.authMiddleware.authenticateToken(),
            this.authController.logout
        );
    }

    /**
     * Get router instance
     * @returns {express.Router} Express router
     */
    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes; 