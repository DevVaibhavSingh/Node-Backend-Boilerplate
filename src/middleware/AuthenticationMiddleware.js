/**
 * @class AuthenticationMiddleware
 * @description Authentication middleware for Express
 * Implements Middleware pattern and Single Responsibility Principle
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class AuthenticationMiddleware {
    constructor(authenticationService) {
        if (!authenticationService) {
            throw new Error('AuthenticationService dependency is required');
        }

        // Dependency Injection: Inject authentication service
        this._authenticationService = authenticationService;
    }

    /**
     * Middleware to authenticate JWT token
     * @returns {Function} Express middleware function
     */
    authenticateToken() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

                if (!token) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            message: 'Access token is required',
                            code: 'MISSING_TOKEN'
                        }
                    });
                }

                // Verify token and get user
                const decoded = await this._authenticationService.verifyToken(token);
                const user = await this._authenticationService._userRepository.findById(decoded.userId);

                if (!user || !user.isActive) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            message: 'Invalid or expired token',
                            code: 'INVALID_TOKEN'
                        }
                    });
                }

                // Attach user to request object
                req.user = user;
                req.token = token;
                next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Invalid or expired token',
                        code: 'INVALID_TOKEN'
                    }
                });
            }
        };
    }

    /**
     * Middleware to require specific roles
     * @param {...string} roles - Required roles
     * @returns {Function} Express middleware function
     */
    requireRoles(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTHENTICATION_REQUIRED'
                    }
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Insufficient permissions',
                        code: 'INSUFFICIENT_PERMISSIONS',
                        requiredRoles: roles,
                        userRole: req.user.role
                    }
                });
            }

            next();
        };
    }

    /**
     * Middleware to require admin role
     * @returns {Function} Express middleware function
     */
    requireAdmin() {
        return this.requireRoles('admin');
    }

    /**
     * Middleware to require moderator or admin role
     * @returns {Function} Express middleware function
     */
    requireModerator() {
        return this.requireRoles('moderator', 'admin');
    }

    /**
     * Middleware to require email verification
     * @returns {Function} Express middleware function
     */
    requireEmailVerification() {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTHENTICATION_REQUIRED'
                    }
                });
            }

            if (!req.user.isEmailVerified) {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Email verification required',
                        code: 'EMAIL_VERIFICATION_REQUIRED'
                    }
                });
            }

            next();
        };
    }

    /**
     * Middleware to check if user owns the resource or is admin
     * @param {Function} resourceOwnerCheck - Function to check resource ownership
     * @returns {Function} Express middleware function
     */
    requireOwnershipOrAdmin(resourceOwnerCheck) {
        return async (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: 'Authentication required',
                        code: 'AUTHENTICATION_REQUIRED'
                    }
                });
            }

            // Admin can access any resource
            if (req.user.isAdmin()) {
                return next();
            }

            // Check if user owns the resource
            try {
                const isOwner = await resourceOwnerCheck(req.user.id, req.params);
                if (!isOwner) {
                    return res.status(403).json({
                        success: false,
                        error: {
                            message: 'Access denied to this resource',
                            code: 'RESOURCE_ACCESS_DENIED'
                        }
                    });
                }
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    error: {
                        message: 'Error checking resource ownership',
                        code: 'OWNERSHIP_CHECK_ERROR'
                    }
                });
            }
        };
    }

    /**
     * Optional authentication middleware (doesn't fail if no token)
     * @returns {Function} Express middleware function
     */
    optionalAuth() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader && authHeader.split(' ')[1];

                if (token) {
                    const decoded = await this._authenticationService.verifyToken(token);
                    const user = await this._authenticationService._userRepository.findById(decoded.userId);

                    if (user && user.isActive) {
                        req.user = user;
                        req.token = token;
                    }
                }
                next();
            } catch (error) {
                // Continue without authentication
                next();
            }
        };
    }

    /**
     * Rate limiting middleware for authentication endpoints
     * @param {Object} rateLimitOptions - Rate limiting options
     * @returns {Function} Express middleware function
     */
    authRateLimit(rateLimitOptions = {}) {
        const { windowMs = 15 * 60 * 1000, max = 5 } = rateLimitOptions;
        const attempts = new Map();

        return (req, res, next) => {
            const key = req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old attempts
            if (attempts.has(key)) {
                attempts.set(key, attempts.get(key).filter(timestamp => timestamp > windowStart));
            } else {
                attempts.set(key, []);
            }

            const currentAttempts = attempts.get(key);

            if (currentAttempts.length >= max) {
                return res.status(429).json({
                    success: false,
                    error: {
                        message: 'Too many authentication attempts',
                        code: 'RATE_LIMIT_EXCEEDED',
                        retryAfter: Math.ceil(windowMs / 1000)
                    }
                });
            }

            currentAttempts.push(now);
            next();
        };
    }
}

module.exports = AuthenticationMiddleware; 