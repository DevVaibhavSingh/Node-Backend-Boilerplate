/**
 * @interface ILogger
 * @description Interface defining the contract for logging functionality
 * Follows Interface Segregation Principle - clients should not be forced to depend on interfaces they don't use
 */
class ILogger {
    /**
     * Log an info level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    info(message, meta = {}) {
        throw new Error('Method info() must be implemented');
    }

    /**
     * Log an error level message
     * @param {string} message - The message to log
     * @param {Error} [error] - The error object
     * @param {Object} [meta] - Additional metadata
     */
    error(message, error = null, meta = {}) {
        throw new Error('Method error() must be implemented');
    }

    /**
     * Log a warning level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    warn(message, meta = {}) {
        throw new Error('Method warn() must be implemented');
    }

    /**
     * Log a debug level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    debug(message, meta = {}) {
        throw new Error('Method debug() must be implemented');
    }
}

module.exports = ILogger; 