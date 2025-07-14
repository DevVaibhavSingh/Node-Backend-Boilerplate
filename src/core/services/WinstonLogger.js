const winston = require('winston');
const path = require('path');

/**
 * @class WinstonLogger
 * @description Winston-based logger implementation
 * Implements Adapter pattern to adapt Winston to ILogger interface
 * Follows Single Responsibility Principle - only handles logging
 */
class WinstonLogger {
    constructor(options = {}) {
        // Singleton pattern: Ensure only one logger instance
        if (WinstonLogger.instance) {
            return WinstonLogger.instance;
        }

        this._logger = this.createWinstonLogger(options);
        WinstonLogger.instance = this;
    }

    /**
     * Factory Method: Create Winston logger with configuration
     * @param {Object} options - Logger configuration options
     * @returns {winston.Logger} Configured Winston logger
     */
    createWinstonLogger(options) {
        const {
            level = process.env.LOG_LEVEL || 'info',
            logFilePath = process.env.LOG_FILE_PATH || 'logs/app.log'
        } = options;

        // Strategy Pattern: Different log formats for different environments
        const logFormat = process.env.NODE_ENV === 'production'
            ? winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            )
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
                })
            );

        // Observer Pattern: Multiple transports for different outputs
        const transports = [
            new winston.transports.Console({
                format: logFormat
            })
        ];

        // Add file transport in production
        if (process.env.NODE_ENV === 'production') {
            transports.push(
                new winston.transports.File({
                    filename: logFilePath,
                    format: logFormat,
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            );
        }

        return winston.createLogger({
            level,
            format: logFormat,
            transports,
            exitOnError: false
        });
    }

    /**
     * Log info level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    info(message, meta = {}) {
        this._logger.info(message, meta);
    }

    /**
     * Log error level message
     * @param {string} message - The message to log
     * @param {Error} [error] - The error object
     * @param {Object} [meta] - Additional metadata
     */
    error(message, error = null, meta = {}) {
        const logData = { ...meta };

        if (error) {
            logData.error = {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code
            };
        }

        this._logger.error(message, logData);
    }

    /**
     * Log warning level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    warn(message, meta = {}) {
        this._logger.warn(message, meta);
    }

    /**
     * Log debug level message
     * @param {string} message - The message to log
     * @param {Object} [meta] - Additional metadata
     */
    debug(message, meta = {}) {
        this._logger.debug(message, meta);
    }

    /**
     * Get the underlying Winston logger instance
     * @returns {winston.Logger} Winston logger instance
     */
    getWinstonLogger() {
        return this._logger;
    }
}

module.exports = WinstonLogger; 