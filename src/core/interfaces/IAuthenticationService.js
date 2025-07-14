/**
 * @interface IAuthenticationService
 * @description Interface defining authentication service contract
 * Follows Dependency Inversion Principle - high-level modules should not depend on low-level modules
 */
class IAuthenticationService {
    /**
     * Authenticate user with credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Authentication result with token and user info
     */
    async authenticate(email, password) {
        throw new Error('Method authenticate() must be implemented');
    }

    /**
     * Generate JWT token for user
     * @param {Object} user - User object
     * @returns {Promise<string>} JWT token
     */
    async generateToken(user) {
        throw new Error('Method generateToken() must be implemented');
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @returns {Promise<Object>} Decoded token payload
     */
    async verifyToken(token) {
        throw new Error('Method verifyToken() must be implemented');
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        throw new Error('Method hashPassword() must be implemented');
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} Password match result
     */
    async comparePassword(password, hash) {
        throw new Error('Method comparePassword() must be implemented');
    }
}

module.exports = IAuthenticationService; 