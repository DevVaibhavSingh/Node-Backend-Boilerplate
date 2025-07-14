/**
 * @interface IRepository
 * @description Generic repository interface defining CRUD operations
 * Follows Repository Pattern and Interface Segregation Principle
 * @template T - The entity type
 */
class IRepository {
    /**
     * Find an entity by its ID
     * @param {string|number} id - The entity ID
     * @returns {Promise<T|null>} The found entity or null
     */
    async findById(id) {
        throw new Error('Method findById() must be implemented');
    }

    /**
     * Find all entities with optional filtering
     * @param {Object} [filters] - Optional filters
     * @param {Object} [options] - Query options (limit, offset, sort)
     * @returns {Promise<T[]>} Array of entities
     */
    async findAll(filters = {}, options = {}) {
        throw new Error('Method findAll() must be implemented');
    }

    /**
     * Create a new entity
     * @param {T} entity - The entity to create
     * @returns {Promise<T>} The created entity
     */
    async create(entity) {
        throw new Error('Method create() must be implemented');
    }

    /**
     * Update an existing entity
     * @param {string|number} id - The entity ID
     * @param {Partial<T>} updates - The updates to apply
     * @returns {Promise<T|null>} The updated entity or null
     */
    async update(id, updates) {
        throw new Error('Method update() must be implemented');
    }

    /**
     * Delete an entity by ID
     * @param {string|number} id - The entity ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        throw new Error('Method delete() must be implemented');
    }

    /**
     * Check if an entity exists
     * @param {string|number} id - The entity ID
     * @returns {Promise<boolean>} Existence status
     */
    async exists(id) {
        throw new Error('Method exists() must be implemented');
    }
}

module.exports = IRepository; 