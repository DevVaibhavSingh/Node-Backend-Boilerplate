const BaseController = require('./BaseController');
const Joi = require('joi');

/**
 * @class UserController
 * @description User management controller
 * Implements Single Responsibility Principle - only handles user management requests
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class UserController extends BaseController {
    constructor(logger, userService) {
        super(logger);

        if (!userService) {
            throw new Error('UserService dependency is required');
        }

        // Dependency Injection: Inject user service
        this._userService = userService;
    }

    /**
     * Get all users with filtering and pagination
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getUsers = this.asyncHandler(async (req, res) => {
        // Validate query parameters
        const querySchema = Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            sort: Joi.string().optional(),
            search: Joi.string().min(2).optional(),
            role: Joi.string().valid('user', 'admin', 'moderator').optional(),
            isActive: Joi.boolean().optional(),
            isEmailVerified: Joi.boolean().optional()
        });

        this.validateQuery(req, querySchema);

        // Extract pagination and filters
        const pagination = this.extractPagination(req);
        const filters = this.extractFilters(req);

        // Get users
        const result = await this._userService.getUsers(filters, pagination);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'Users retrieved successfully');
    });

    /**
     * Get user by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getUserById = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Get user
        const result = await this._userService.getUserById(id);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User retrieved successfully');
    });

    /**
     * Create a new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    createUser = this.asyncHandler(async (req, res) => {
        // Validate request body
        const userSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            role: Joi.string().valid('user', 'admin', 'moderator').default('user')
        });

        const userData = this.validateRequest(req, userSchema);

        // Create user
        const result = await this._userService.createUser(userData);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 201, 'User created successfully');
    });

    /**
     * Update user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    updateUser = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Validate request body
        const updateSchema = Joi.object({
            email: Joi.string().email().optional(),
            firstName: Joi.string().min(2).max(50).optional(),
            lastName: Joi.string().min(2).max(50).optional(),
            role: Joi.string().valid('user', 'admin', 'moderator').optional(),
            isEmailVerified: Joi.boolean().optional()
        });

        const updates = this.validateRequest(req, updateSchema);

        // Update user
        const result = await this._userService.updateUser(id, updates);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User updated successfully');
    });

    /**
     * Delete user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    deleteUser = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Delete user
        const result = await this._userService.deleteUser(id);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, null, 200, 'User deleted successfully');
    });

    /**
     * Soft delete user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    softDeleteUser = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Soft delete user
        const result = await this._userService.softDeleteUser(id);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User deactivated successfully');
    });

    /**
     * Restore user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    restoreUser = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Restore user
        const result = await this._userService.restoreUser(id);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User restored successfully');
    });

    /**
     * Verify user email
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    verifyUserEmail = this.asyncHandler(async (req, res) => {
        // Validate path parameters
        const paramsSchema = Joi.object({
            id: Joi.string().uuid().required()
        });

        const { id } = this.validateParams(req, paramsSchema);

        // Verify user email
        const result = await this._userService.verifyUserEmail(id);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User email verified successfully');
    });

    /**
     * Get user statistics
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getUserStatistics = this.asyncHandler(async (req, res) => {
        // Get user statistics
        const result = await this._userService.getUserStatistics();

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'User statistics retrieved successfully');
    });

    /**
     * Search users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    searchUsers = this.asyncHandler(async (req, res) => {
        // Validate query parameters
        const querySchema = Joi.object({
            q: Joi.string().min(2).required(),
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            sort: Joi.string().optional()
        });

        this.validateQuery(req, querySchema);

        const { q: searchTerm } = req.query;
        const pagination = this.extractPagination(req);

        // Search users
        const result = await this._userService.searchUsers(searchTerm, pagination);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'Search completed successfully');
    });

    /**
     * Get current user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getCurrentUser = this.asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        this.sendSuccess(res, req.user.toPublicJSON(), 200, 'Current user profile retrieved successfully');
    });

    /**
     * Update current user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    updateCurrentUser = this.asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        // Validate request body
        const updateSchema = Joi.object({
            firstName: Joi.string().min(2).max(50).optional(),
            lastName: Joi.string().min(2).max(50).optional()
        });

        const updates = this.validateRequest(req, updateSchema);

        // Update current user
        const result = await this._userService.updateUser(req.user.id, updates);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'Profile updated successfully');
    });
}

module.exports = UserController; 