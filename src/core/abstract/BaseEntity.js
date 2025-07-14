const { v4: uuidv4 } = require('uuid');

/**
 * @abstract BaseEntity
 * @description Abstract base class for all entities
 * Implements Template Method pattern and encapsulation principles
 */
class BaseEntity {
    constructor(data = {}) {
        // Encapsulation: Private properties with getters/setters
        this._id = data.id || uuidv4();
        this._createdAt = data.createdAt || new Date();
        this._updatedAt = data.updatedAt || new Date();
        this._isActive = data.isActive !== undefined ? data.isActive : true;

        // Template Method: Call abstract method during construction
        this.initialize(data);
    }

    /**
     * Template Method: Abstract method that must be implemented by subclasses
     * @param {Object} data - Initialization data
     */
    initialize(data) {
        throw new Error('Method initialize() must be implemented by subclass');
    }

    /**
     * Template Method: Abstract method for validation
     * @returns {boolean} Validation result
     */
    validate() {
        throw new Error('Method validate() must be implemented by subclass');
    }

    /**
     * Template Method: Convert entity to plain object
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return {
            id: this._id,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            isActive: this._isActive,
            ...this.toPublicJSON()
        };
    }

    /**
     * Template Method: Convert entity to public JSON (without sensitive data)
     * @returns {Object} Public object representation
     */
    toPublicJSON() {
        throw new Error('Method toPublicJSON() must be implemented by subclass');
    }

    /**
     * Update the entity's updatedAt timestamp
     */
    touch() {
        this._updatedAt = new Date();
    }

    /**
     * Soft delete the entity
     */
    softDelete() {
        this._isActive = false;
        this.touch();
    }

    /**
     * Restore the entity
     */
    restore() {
        this._isActive = true;
        this.touch();
    }

    // Getters and Setters for encapsulation
    get id() {
        return this._id;
    }

    get createdAt() {
        return this._createdAt;
    }

    get updatedAt() {
        return this._updatedAt;
    }

    get isActive() {
        return this._isActive;
    }

    set isActive(value) {
        this._isActive = Boolean(value);
        this.touch();
    }
}

module.exports = BaseEntity; 