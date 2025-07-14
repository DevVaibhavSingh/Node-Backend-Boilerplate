/**
 * @abstract BaseService
 * @description Abstract base class for all services
 * Implements Template Method pattern and Single Responsibility Principle
 */
class BaseService {
    constructor(logger) {
        if (!logger) {
            throw new Error('Logger dependency is required');
        }

        // Dependency Injection: Inject logger dependency
        this._logger = logger;

        // Template Method: Initialize service
        this.initialize();
    }

    /**
     * Template Method: Initialize service-specific logic
     */
    initialize() {
        // Default implementation - can be overridden by subclasses
        this._logger.info(`${this.constructor.name} initialized`);
    }

    /**
     * Template Method: Execute service operation with error handling
     * @param {Function} operation - The operation to execute
     * @param {string} operationName - Name of the operation for logging
     * @returns {Promise<Object>} Operation result
     */
    async executeOperation(operation, operationName) {
        try {
            this._logger.debug(`Starting operation: ${operationName}`);
            const result = await operation();
            this._logger.info(`Operation completed successfully: ${operationName}`);
            return { success: true, data: result };
        } catch (error) {
            this._logger.error(`Operation failed: ${operationName}`, error);
            return { success: false, error: this.handleError(error) };
        }
    }

    /**
     * Template Method: Handle and sanitize errors
     * @param {Error} error - The error to handle
     * @returns {Object} Sanitized error object
     */
    handleError(error) {
        // Security: Don't leak internal error details
        const sanitizedError = {
            message: error.message || 'An unexpected error occurred',
            code: error.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        };

        // Log full error details internally
        this._logger.error('Full error details:', error);

        return sanitizedError;
    }

    /**
     * Template Method: Validate input data
     * @param {Object} data - Data to validate
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    validateInput(data, schema) {
        try {
            const { error, value } = schema.validate(data, { abortEarly: false });

            if (error) {
                return {
                    isValid: false,
                    errors: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                };
            }

            return { isValid: true, data: value };
        } catch (validationError) {
            this._logger.error('Validation error:', validationError);
            return {
                isValid: false,
                errors: [{ field: 'unknown', message: 'Validation failed' }]
            };
        }
    }

    /**
     * Template Method: Sanitize output data
     * @param {Object} data - Data to sanitize
     * @returns {Object} Sanitized data
     */
    sanitizeOutput(data) {
        // Remove sensitive information from output
        if (data && typeof data === 'object') {
            const sanitized = { ...data };

            // Remove common sensitive fields
            const sensitiveFields = ['password', 'token', 'secret', 'key'];
            sensitiveFields.forEach(field => {
                if (sanitized[field]) {
                    delete sanitized[field];
                }
            });

            return sanitized;
        }

        return data;
    }

    /**
     * Get service logger
     * @returns {ILogger} Logger instance
     */
    get logger() {
        return this._logger;
    }
}

module.exports = BaseService; 