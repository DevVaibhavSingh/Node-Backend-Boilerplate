const BaseService = require('../core/abstract/BaseService');
const User = require('../entities/User');
const Joi = require('joi');

/**
 * @class UserService
 * @description User service for business logic operations
 * Implements Service Layer pattern and Single Responsibility Principle
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class UserService extends BaseService {
    constructor(logger, userRepository) {
        super(logger);

        if (!userRepository) {
            throw new Error('UserRepository dependency is required');
        }

        // Dependency Injection: Inject user repository
        this._userRepository = userRepository;
    }

    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(id) {
        return this.executeOperation(async () => {
            const user = await this._userRepository.findById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return this.sanitizeOutput(user.toPublicJSON());
        }, 'getUserById');
    }

    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<Object>} User data
     */
    async getUserByEmail(email) {
        return this.executeOperation(async () => {
            const user = await this._userRepository.findByEmail(email);
            if (!user) {
                throw new Error('User not found');
            }
            return this.sanitizeOutput(user.toPublicJSON());
        }, 'getUserByEmail');
    }

    /**
     * Get all users with filtering and pagination
     * @param {Object} [filters] - Optional filters
     * @param {Object} [options] - Query options
     * @returns {Promise<Object>} Users data with pagination
     */
    async getUsers(filters = {}, options = {}) {
        return this.executeOperation(async () => {
            const users = await this._userRepository.findAll(filters, options);
            const total = await this._userRepository.count(filters);

            return {
                users: users.map(user => this.sanitizeOutput(user.toPublicJSON())),
                pagination: {
                    total,
                    limit: options.limit || total,
                    offset: options.offset || 0,
                    hasMore: (options.offset || 0) + (options.limit || total) < total
                }
            };
        }, 'getUsers');
    }

    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user data
     */
    async createUser(userData) {
        return this.executeOperation(async () => {
            // Input validation
            const validation = this.validateInput(
                userData,
                Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required(),
                    firstName: Joi.string().min(2).max(50).required(),
                    lastName: Joi.string().min(2).max(50).required(),
                    role: Joi.string().valid('user', 'admin', 'moderator').default('user')
                })
            );

            if (!validation.isValid) {
                throw new Error('Invalid input data');
            }

            // Check if user already exists
            const existingUser = await this._userRepository.findByEmail(validation.data.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create user entity
            const user = new User(validation.data);

            // Validate entity
            if (!user.validate()) {
                throw new Error('Invalid user data');
            }

            // Save user
            const savedUser = await this._userRepository.create(user);
            return this.sanitizeOutput(savedUser.toPublicJSON());
        }, 'createUser');
    }

    /**
     * Update user
     * @param {string} id - User ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated user data
     */
    async updateUser(id, updates) {
        return this.executeOperation(async () => {
            // Input validation
            const validation = this.validateInput(
                updates,
                Joi.object({
                    email: Joi.string().email().optional(),
                    firstName: Joi.string().min(2).max(50).optional(),
                    lastName: Joi.string().min(2).max(50).optional(),
                    role: Joi.string().valid('user', 'admin', 'moderator').optional(),
                    isEmailVerified: Joi.boolean().optional()
                })
            );

            if (!validation.isValid) {
                throw new Error('Invalid input data');
            }

            // Check if user exists
            const existingUser = await this._userRepository.findById(id);
            if (!existingUser) {
                throw new Error('User not found');
            }

            // Check if email is being changed and if it's already taken
            if (validation.data.email && validation.data.email !== existingUser.email) {
                const userWithEmail = await this._userRepository.findByEmail(validation.data.email);
                if (userWithEmail) {
                    throw new Error('Email is already taken');
                }
            }

            // Update user
            const updatedUser = await this._userRepository.update(id, validation.data);
            if (!updatedUser) {
                throw new Error('Failed to update user');
            }

            return this.sanitizeOutput(updatedUser.toPublicJSON());
        }, 'updateUser');
    }

    /**
     * Delete user
     * @param {string} id - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUser(id) {
        return this.executeOperation(async () => {
            // Check if user exists
            const existingUser = await this._userRepository.findById(id);
            if (!existingUser) {
                throw new Error('User not found');
            }

            // Prevent deletion of admin users (business rule)
            if (existingUser.isAdmin()) {
                throw new Error('Cannot delete admin users');
            }

            // Delete user
            const success = await this._userRepository.delete(id);
            if (!success) {
                throw new Error('Failed to delete user');
            }

            return true;
        }, 'deleteUser');
    }

    /**
     * Soft delete user
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user data
     */
    async softDeleteUser(id) {
        return this.executeOperation(async () => {
            const user = await this._userRepository.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            // Prevent soft deletion of admin users (business rule)
            if (user.isAdmin()) {
                throw new Error('Cannot deactivate admin users');
            }

            user.softDelete();
            return this.sanitizeOutput(user.toPublicJSON());
        }, 'softDeleteUser');
    }

    /**
     * Restore user
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user data
     */
    async restoreUser(id) {
        return this.executeOperation(async () => {
            const user = await this._userRepository.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            user.restore();
            return this.sanitizeOutput(user.toPublicJSON());
        }, 'restoreUser');
    }

    /**
     * Verify user email
     * @param {string} id - User ID
     * @returns {Promise<Object>} Updated user data
     */
    async verifyUserEmail(id) {
        return this.executeOperation(async () => {
            const user = await this._userRepository.findById(id);
            if (!user) {
                throw new Error('User not found');
            }

            user.verifyEmail();
            return this.sanitizeOutput(user.toPublicJSON());
        }, 'verifyUserEmail');
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} User statistics
     */
    async getUserStatistics() {
        return this.executeOperation(async () => {
            const totalUsers = await this._userRepository.count();
            const activeUsers = await this._userRepository.count({ isActive: true });
            const verifiedUsers = await this._userRepository.count({ isEmailVerified: true });
            const adminUsers = await this._userRepository.count({ role: 'admin' });

            return {
                total: totalUsers,
                active: activeUsers,
                verified: verifiedUsers,
                admins: adminUsers,
                inactive: totalUsers - activeUsers,
                unverified: totalUsers - verifiedUsers
            };
        }, 'getUserStatistics');
    }

    /**
     * Search users
     * @param {string} searchTerm - Search term
     * @param {Object} [options] - Search options
     * @returns {Promise<Object>} Search results
     */
    async searchUsers(searchTerm, options = {}) {
        return this.executeOperation(async () => {
            if (!searchTerm || searchTerm.trim().length < 2) {
                throw new Error('Search term must be at least 2 characters long');
            }

            const filters = { search: searchTerm.trim() };
            const users = await this._userRepository.findAll(filters, options);
            const total = await this._userRepository.count(filters);

            return {
                users: users.map(user => this.sanitizeOutput(user.toPublicJSON())),
                searchTerm,
                total,
                pagination: {
                    total,
                    limit: options.limit || total,
                    offset: options.offset || 0,
                    hasMore: (options.offset || 0) + (options.limit || total) < total
                }
            };
        }, 'searchUsers');
    }
}

module.exports = UserService; 