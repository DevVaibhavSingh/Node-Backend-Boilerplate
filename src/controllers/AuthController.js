const BaseController = require('./BaseController');
const Joi = require('joi');

/**
 * @class AuthController
 * @description Authentication controller
 * Implements Single Responsibility Principle - only handles authentication requests
 * Follows Open/Closed Principle - open for extension, closed for modification
 */
class AuthController extends BaseController {
    constructor(logger, authenticationService) {
        super(logger);

        if (!authenticationService) {
            throw new Error('AuthenticationService dependency is required');
        }

        // Dependency Injection: Inject authentication service
        this._authenticationService = authenticationService;
    }

    /**
     * User login endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    login = this.asyncHandler(async (req, res) => {
        // Validate request body
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required()
        });

        const { email, password } = this.validateRequest(req, loginSchema);

        // Authenticate user
        const result = await this._authenticationService.authenticate(email, password);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'Login successful');
    });

    /**
     * User registration endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    register = this.asyncHandler(async (req, res) => {
        // Validate request body
        const registerSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
            firstName: Joi.string().min(2).max(50).required(),
            lastName: Joi.string().min(2).max(50).required(),
            role: Joi.string().valid('user', 'admin', 'moderator').default('user')
        });

        const userData = this.validateRequest(req, registerSchema);

        // Register user
        const result = await this._authenticationService.register(userData);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 201, 'User registered successfully');
    });

    /**
     * Token refresh endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    refreshToken = this.asyncHandler(async (req, res) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new Error('Refresh token is required');
        }

        // Refresh token
        const result = await this._authenticationService.refreshToken(token);

        if (!result.success) {
            throw new Error(result.error.message);
        }

        this.sendSuccess(res, result.data, 200, 'Token refreshed successfully');
    });

    /**
     * Get current user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getProfile = this.asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        this.sendSuccess(res, req.user.toPublicJSON(), 200, 'Profile retrieved successfully');
    });

    /**
     * Change password endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    changePassword = this.asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        // Validate request body
        const passwordSchema = Joi.object({
            currentPassword: Joi.string().min(8).required(),
            newPassword: Joi.string().min(8).required()
        });

        const { currentPassword, newPassword } = this.validateRequest(req, passwordSchema);

        // Verify current password
        const isValidPassword = await this._authenticationService.comparePassword(
            currentPassword,
            req.user.password
        );

        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await this._authenticationService.hashPassword(newPassword);

        // Update user password
        const updatedUser = await this._authenticationService._userRepository.update(
            req.user.id,
            { password: hashedPassword }
        );

        if (!updatedUser) {
            throw new Error('Failed to update password');
        }

        this.sendSuccess(res, null, 200, 'Password changed successfully');
    });

    /**
     * Logout endpoint (client-side token removal)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    logout = this.asyncHandler(async (req, res) => {
        // In a stateless JWT system, logout is handled client-side
        // This endpoint can be used for logging purposes
        this._logger.info(`User ${req.user?.id || 'unknown'} logged out`);

        this.sendSuccess(res, null, 200, 'Logout successful');
    });

    /**
     * Verify email endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    verifyEmail = this.asyncHandler(async (req, res) => {
        // Validate request parameters
        const paramsSchema = Joi.object({
            token: Joi.string().required()
        });

        const { token } = this.validateParams(req, paramsSchema);

        // Verify token and get user
        const decoded = await this._authenticationService.verifyToken(token);
        const user = await this._authenticationService._userRepository.findById(decoded.userId);

        if (!user) {
            throw new Error('Invalid verification token');
        }

        // Mark email as verified
        user.verifyEmail();

        this.sendSuccess(res, user.toPublicJSON(), 200, 'Email verified successfully');
    });

    /**
     * Forgot password endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    forgotPassword = this.asyncHandler(async (req, res) => {
        // Validate request body
        const emailSchema = Joi.object({
            email: Joi.string().email().required()
        });

        const { email } = this.validateRequest(req, emailSchema);

        // Check if user exists
        const user = await this._authenticationService._userRepository.findByEmail(email);

        // Always return success to prevent email enumeration
        if (user) {
            // In a real application, send password reset email here
            this._logger.info(`Password reset requested for user: ${email}`);
        }

        this.sendSuccess(res, null, 200, 'If the email exists, a password reset link has been sent');
    });

    /**
     * Reset password endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    resetPassword = this.asyncHandler(async (req, res) => {
        // Validate request body
        const resetSchema = Joi.object({
            token: Joi.string().required(),
            newPassword: Joi.string().min(8).required()
        });

        const { token, newPassword } = this.validateRequest(req, resetSchema);

        // Verify token and get user
        const decoded = await this._authenticationService.verifyToken(token);
        const user = await this._authenticationService._userRepository.findById(decoded.userId);

        if (!user) {
            throw new Error('Invalid reset token');
        }

        // Hash new password
        const hashedPassword = await this._authenticationService.hashPassword(newPassword);

        // Update user password
        const updatedUser = await this._authenticationService._userRepository.update(
            user.id,
            { password: hashedPassword }
        );

        if (!updatedUser) {
            throw new Error('Failed to reset password');
        }

        this.sendSuccess(res, null, 200, 'Password reset successfully');
    });
}

module.exports = AuthController; 