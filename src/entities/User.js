const BaseEntity = require('../core/abstract/BaseEntity');
const Joi = require('joi');

/**
 * @class User
 * @description User entity class
 * Implements inheritance from BaseEntity and encapsulation principles
 * Follows Single Responsibility Principle - only handles user data
 */
class User extends BaseEntity {
    constructor(data = {}) {
        super(data);
    }

    /**
     * Initialize user-specific properties
     * @param {Object} data - User data
     */
    initialize(data) {
        // Encapsulation: Private properties with validation
        this._email = data.email || '';
        this._password = data.password || '';
        this._firstName = data.firstName || '';
        this._lastName = data.lastName || '';
        this._role = data.role || 'user';
        this._isEmailVerified = data.isEmailVerified || false;
        this._lastLoginAt = data.lastLoginAt || null;
    }

    /**
     * Validate user data
     * @returns {boolean} Validation result
     */
    validate() {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
            isEmailVerified: Joi.boolean().default(false)
        });

        const { error } = schema.validate({
            email: this._email,
            password: this._password,
            firstName: this._firstName,
            lastName: this._lastName,
            role: this._role,
            isEmailVerified: this._isEmailVerified
        });

        return !error;
    }

    /**
     * Convert user to public JSON (without sensitive data)
     * @returns {Object} Public user representation
     */
    toPublicJSON() {
        return {
            email: this._email,
            firstName: this._firstName,
            lastName: this._lastName,
            role: this._role,
            isEmailVerified: this._isEmailVerified,
            lastLoginAt: this._lastLoginAt,
            fullName: this.getFullName()
        };
    }

    /**
     * Get user's full name
     * @returns {string} Full name
     */
    getFullName() {
        return `${this._firstName} ${this._lastName}`.trim();
    }

    /**
     * Update last login timestamp
     */
    updateLastLogin() {
        this._lastLoginAt = new Date();
        this.touch();
    }

    /**
     * Mark email as verified
     */
    verifyEmail() {
        this._isEmailVerified = true;
        this.touch();
    }

    // Getters and Setters for encapsulation
    get email() {
        return this._email;
    }

    set email(value) {
        this._email = value;
        this.touch();
    }

    get password() {
        return this._password;
    }

    set password(value) {
        this._password = value;
        this.touch();
    }

    get firstName() {
        return this._firstName;
    }

    set firstName(value) {
        this._firstName = value;
        this.touch();
    }

    get lastName() {
        return this._lastName;
    }

    set lastName(value) {
        this._lastName = value;
        this.touch();
    }

    get role() {
        return this._role;
    }

    set role(value) {
        this._role = value;
        this.touch();
    }

    get isEmailVerified() {
        return this._isEmailVerified;
    }

    get lastLoginAt() {
        return this._lastLoginAt;
    }

    /**
     * Check if user has admin role
     * @returns {boolean} Admin status
     */
    isAdmin() {
        return this._role === 'admin';
    }

    /**
     * Check if user has moderator role
     * @returns {boolean} Moderator status
     */
    isModerator() {
        return this._role === 'moderator' || this._role === 'admin';
    }
}

module.exports = User; 