/**
 * @abstract BaseController
 * @description Abstract base class for all controllers
 * Implements Template Method pattern and Single Responsibility Principle
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class BaseController {
    constructor(logger) {
        if (!logger) {
            throw new Error('Logger dependency is required');
        }

        // Dependency Injection: Inject logger dependency
        this._logger = logger;
    }

    /**
     * Template Method: Standard success response
     * @param {Object} res - Express response object
     * @param {*} data - Response data
     * @param {number} [statusCode=200] - HTTP status code
     * @param {string} [message] - Success message
     */
    sendSuccess(res, data, statusCode = 200, message = 'Success') {
        const response = {
            success: true,
            message,
            data: this.sanitizeOutput(data),
            timestamp: new Date().toISOString()
        };

        this._logger.info(`Response sent: ${statusCode} - ${message}`);
        return res.status(statusCode).json(response);
    }

    /**
     * Template Method: Standard error response
     * @param {Object} res - Express response object
     * @param {Error|string} error - Error object or message
     * @param {number} [statusCode=500] - HTTP status code
     * @param {string} [code] - Error code
     */
    sendError(res, error, statusCode = 500, code = 'INTERNAL_ERROR') {
        const errorMessage = error instanceof Error ? error.message : error;

        const response = {
            success: false,
            error: {
                message: errorMessage,
                code,
                timestamp: new Date().toISOString()
            }
        };

        this._logger.error(`Error response sent: ${statusCode} - ${errorMessage}`, error);
        return res.status(statusCode).json(response);
    }

    /**
     * Template Method: Handle async controller methods
     * @param {Function} asyncFn - Async function to execute
     * @returns {Function} Express middleware function
     */
    asyncHandler(asyncFn) {
        return async (req, res, next) => {
            try {
                await asyncFn(req, res, next);
            } catch (error) {
                this._logger.error('Controller error:', error);

                // Determine appropriate status code
                let statusCode = 500;
                let code = 'INTERNAL_ERROR';

                if (error.message.includes('not found')) {
                    statusCode = 404;
                    code = 'NOT_FOUND';
                } else if (error.message.includes('already exists')) {
                    statusCode = 409;
                    code = 'CONFLICT';
                } else if (error.message.includes('Invalid') || error.message.includes('validation')) {
                    statusCode = 400;
                    code = 'VALIDATION_ERROR';
                } else if (error.message.includes('Unauthorized') || error.message.includes('token')) {
                    statusCode = 401;
                    code = 'UNAUTHORIZED';
                } else if (error.message.includes('Forbidden') || error.message.includes('permission')) {
                    statusCode = 403;
                    code = 'FORBIDDEN';
                }

                this.sendError(res, error, statusCode, code);
            }
        };
    }

    /**
     * Template Method: Validate request parameters
     * @param {Object} req - Express request object
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    validateRequest(req, schema) {
        const { error, value } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }

        return value;
    }

    /**
     * Template Method: Validate request query parameters
     * @param {Object} req - Express request object
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    validateQuery(req, schema) {
        const { error, value } = schema.validate(req.query, { abortEarly: false });

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new Error(`Query validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }

        return value;
    }

    /**
     * Template Method: Validate request parameters
     * @param {Object} req - Express request object
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    validateParams(req, schema) {
        const { error, value } = schema.validate(req.params, { abortEarly: false });

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new Error(`Parameter validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }

        return value;
    }

    /**
     * Template Method: Sanitize output data
     * @param {*} data - Data to sanitize
     * @returns {*} Sanitized data
     */
    sanitizeOutput(data) {
        if (data && typeof data === 'object') {
            const sanitized = { ...data };

            // Remove sensitive information
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
     * Template Method: Extract pagination parameters
     * @param {Object} req - Express request object
     * @returns {Object} Pagination options
     */
    extractPagination(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        return {
            page,
            limit,
            offset,
            sort: req.query.sort || 'createdAt:desc'
        };
    }

    /**
     * Template Method: Extract filtering parameters
     * @param {Object} req - Express request object
     * @returns {Object} Filter options
     */
    extractFilters(req) {
        const filters = {};

        // Common filter fields
        const filterFields = ['search', 'role', 'isActive', 'isEmailVerified'];
        filterFields.forEach(field => {
            if (req.query[field] !== undefined) {
                filters[field] = req.query[field];
            }
        });

        return filters;
    }

    /**
     * Get controller logger
     * @returns {ILogger} Logger instance
     */
    get logger() {
        return this._logger;
    }
}

module.exports = BaseController; 