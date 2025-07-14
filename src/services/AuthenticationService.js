const IAuthenticationService = require('../core/interfaces/IAuthenticationService');
const BaseService = require('../core/abstract/BaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

/**
 * @class AuthenticationService
 * @description Authentication service implementation
 * Implements Strategy pattern for different authentication methods
 * Follows Single Responsibility Principle - only handles authentication
 */
class AuthenticationService extends BaseService {
    constructor(logger, userRepository) {
        super(logger);

        if (!userRepository) {
            throw new Error('UserRepository dependency is required');
        }

        // Dependency Injection: Inject user repository
        this._userRepository = userRepository;

        // Strategy Pattern: Different authentication strategies
        this._strategies = {
            local: this.localStrategy.bind(this),
            jwt: this.jwtStrategy.bind(this)
        };
    }

    /**
     * Authenticate user with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async authenticate(email, password) {
        return this.executeOperation(async () => {
            // Input validation
            const validation = this.validateInput(
                { email, password },
                Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required()
                })
            );

            if (!validation.isValid) {
                throw new Error('Invalid input data');
            }

            // Strategy Pattern: Use local authentication strategy
            return await this._strategies.local(email, password);
        }, 'authenticate');
    }

    /**
     * Local authentication strategy
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result
     */
    async localStrategy(email, password) {
        // Find user by email
        const user = await this._userRepository.findByEmail(email);
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await this.comparePassword(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.updateLastLogin();

        // Generate token
        const token = await this.generateToken(user);

        return {
            user: this.sanitizeOutput(user.toPublicJSON()),
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        };
    }

    /**
     * JWT authentication strategy
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Authentication result
     */
    async jwtStrategy(token) {
        try {
            const decoded = await this.verifyToken(token);
            const user = await this._userRepository.findById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('Invalid token');
            }

            return {
                user: this.sanitizeOutput(user.toPublicJSON()),
                token: token
            };
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @returns {Promise<string>} JWT token
     */
    async generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        return jwt.sign(payload, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            algorithm: 'HS256'
        });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @returns {Promise<Object>} Decoded token payload
     */
    async verifyToken(token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }

        return jwt.verify(token, secret, {
            algorithms: ['HS256']
        });
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return bcrypt.hash(password, rounds);
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Password match result
     */
    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    async register(userData) {
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

            // Hash password
            const hashedPassword = await this.hashPassword(validation.data.password);

            // Create user
            const User = require('../entities/User');
            const user = new User({
                ...validation.data,
                password: hashedPassword
            });

            // Save user
            const savedUser = await this._userRepository.create(user);

            // Generate token
            const token = await this.generateToken(savedUser);

            return {
                user: this.sanitizeOutput(savedUser.toPublicJSON()),
                token,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            };
        }, 'register');
    }

    /**
     * Refresh authentication token
     * @param {string} token - Current JWT token
     * @returns {Promise<Object>} New authentication result
     */
    async refreshToken(token) {
        return this.executeOperation(async () => {
            const decoded = await this.verifyToken(token);
            const user = await this._userRepository.findById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('Invalid token');
            }

            // Generate new token
            const newToken = await this.generateToken(user);

            return {
                user: this.sanitizeOutput(user.toPublicJSON()),
                token: newToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            };
        }, 'refreshToken');
    }

    /**
     * Get authentication strategy by name
     * @param {string} strategyName - Strategy name
     * @returns {Function} Strategy function
     */
    getStrategy(strategyName) {
        const strategy = this._strategies[strategyName];
        if (!strategy) {
            throw new Error(`Unknown authentication strategy: ${strategyName}`);
        }
        return strategy;
    }
}

module.exports = AuthenticationService; 