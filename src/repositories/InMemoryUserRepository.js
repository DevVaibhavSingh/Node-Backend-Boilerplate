const IRepository = require('../core/interfaces/IRepository');
const User = require('../entities/User');

/**
 * @class InMemoryUserRepository
 * @description In-memory implementation of user repository
 * Implements Repository pattern and IRepository interface
 * Follows Single Responsibility Principle - only handles user data persistence
 */
class InMemoryUserRepository extends IRepository {
    constructor() {
        super();

        // Encapsulation: Private storage
        this._users = new Map();
        this._emailIndex = new Map(); // For fast email lookups

        // Initialize with some sample data
        this.initializeSampleData();
    }

    /**
     * Initialize repository with sample data
     */
    initializeSampleData() {
        const sampleUsers = [
            {
                email: 'admin@example.com',
                password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e', // 'admin123'
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isEmailVerified: true
            },
            {
                email: 'user@example.com',
                password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e', // 'user123'
                firstName: 'Regular',
                lastName: 'User',
                role: 'user',
                isEmailVerified: true
            }
        ];

        sampleUsers.forEach(userData => {
            const user = new User(userData);
            this._users.set(user.id, user);
            this._emailIndex.set(user.email.toLowerCase(), user.id);
        });
    }

    /**
     * Find user by ID
     * @param {string} id - User ID
     * @returns {Promise<User|null>} User or null
     */
    async findById(id) {
        return this._users.get(id) || null;
    }

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>} User or null
     */
    async findByEmail(email) {
        const userId = this._emailIndex.get(email.toLowerCase());
        return userId ? this._users.get(userId) : null;
    }

    /**
     * Find all users with optional filtering
     * @param {Object} [filters] - Optional filters
     * @param {Object} [options] - Query options
     * @returns {Promise<User[]>} Array of users
     */
    async findAll(filters = {}, options = {}) {
        let users = Array.from(this._users.values());

        // Apply filters
        if (filters.role) {
            users = users.filter(user => user.role === filters.role);
        }

        if (filters.isEmailVerified !== undefined) {
            users = users.filter(user => user.isEmailVerified === filters.isEmailVerified);
        }

        if (filters.isActive !== undefined) {
            users = users.filter(user => user.isActive === filters.isActive);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            users = users.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        if (options.sort) {
            const [field, order] = options.sort.split(':');
            users.sort((a, b) => {
                const aValue = a[field];
                const bValue = b[field];

                if (order === 'desc') {
                    return bValue > aValue ? 1 : -1;
                }
                return aValue > bValue ? 1 : -1;
            });
        }

        // Apply pagination
        if (options.limit || options.offset) {
            const offset = options.offset || 0;
            const limit = options.limit || users.length;
            users = users.slice(offset, offset + limit);
        }

        return users;
    }

    /**
     * Create a new user
     * @param {User} user - User to create
     * @returns {Promise<User>} Created user
     */
    async create(user) {
        if (!(user instanceof User)) {
            throw new Error('Invalid user object');
        }

        if (!user.validate()) {
            throw new Error('Invalid user data');
        }

        // Check if email already exists
        const existingUser = await this.findByEmail(user.email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Store user
        this._users.set(user.id, user);
        this._emailIndex.set(user.email.toLowerCase(), user.id);

        return user;
    }

    /**
     * Update an existing user
     * @param {string} id - User ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<User|null>} Updated user or null
     */
    async update(id, updates) {
        const user = await this.findById(id);
        if (!user) {
            return null;
        }

        // Update user properties
        Object.keys(updates).forEach(key => {
            if (user[key] !== undefined && key !== 'id') {
                user[key] = updates[key];
            }
        });

        // Update email index if email changed
        if (updates.email && updates.email !== user.email) {
            this._emailIndex.delete(user.email.toLowerCase());
            this._emailIndex.set(updates.email.toLowerCase(), user.id);
        }

        user.touch();
        return user;
    }

    /**
     * Delete a user by ID
     * @param {string} id - User ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        const user = await this.findById(id);
        if (!user) {
            return false;
        }

        this._users.delete(id);
        this._emailIndex.delete(user.email.toLowerCase());
        return true;
    }

    /**
     * Check if user exists
     * @param {string} id - User ID
     * @returns {Promise<boolean>} Existence status
     */
    async exists(id) {
        return this._users.has(id);
    }

    /**
     * Get total count of users
     * @param {Object} [filters] - Optional filters
     * @returns {Promise<number>} Total count
     */
    async count(filters = {}) {
        const users = await this.findAll(filters);
        return users.length;
    }

    /**
     * Clear all data (for testing)
     */
    clear() {
        this._users.clear();
        this._emailIndex.clear();
    }
}

module.exports = InMemoryUserRepository; 