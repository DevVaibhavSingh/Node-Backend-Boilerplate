const express = require('express');
const UserController = require('../controllers/UserController');
const AuthenticationMiddleware = require('../middleware/AuthenticationMiddleware');

/**
 * @description User management routes
 * Implements Router pattern and organizes user management endpoints
 */
class UserRoutes {
    constructor(userService, logger) {
        this.router = express.Router();
        this.userController = new UserController(logger, userService);
        this.authMiddleware = new AuthenticationMiddleware(userService._userRepository);

        this.initializeRoutes();
    }

    /**
     * Initialize user management routes
     */
    initializeRoutes() {
        // Current user routes (authentication required)
        this.router.get('/me',
            this.authMiddleware.authenticateToken(),
            this.userController.getCurrentUser
        );

        this.router.put('/me',
            this.authMiddleware.authenticateToken(),
            this.userController.updateCurrentUser
        );

        // Admin routes (admin role required)
        this.router.get('/',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.getUsers
        );

        this.router.get('/statistics',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.getUserStatistics
        );

        this.router.get('/search',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireModerator(),
            this.userController.searchUsers
        );

        this.router.post('/',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.createUser
        );

        this.router.get('/:id',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireModerator(),
            this.userController.getUserById
        );

        this.router.put('/:id',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.updateUser
        );

        this.router.delete('/:id',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.deleteUser
        );

        this.router.patch('/:id/deactivate',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.softDeleteUser
        );

        this.router.patch('/:id/restore',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.restoreUser
        );

        this.router.patch('/:id/verify-email',
            this.authMiddleware.authenticateToken(),
            this.authMiddleware.requireAdmin(),
            this.userController.verifyUserEmail
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

module.exports = UserRoutes; 