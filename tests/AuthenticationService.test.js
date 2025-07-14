const AuthenticationService = require('../src/services/AuthenticationService');
const InMemoryUserRepository = require('../src/repositories/InMemoryUserRepository');
const WinstonLogger = require('../src/core/services/WinstonLogger');

/**
 * @description Test suite for AuthenticationService
 * Demonstrates testing approach with dependency injection and mocking
 */
describe('AuthenticationService', () => {
    let authenticationService;
    let userRepository;
    let logger;

    beforeEach(() => {
        // Create fresh instances for each test
        logger = new WinstonLogger({ level: 'error' }); // Only log errors during tests
        userRepository = new InMemoryUserRepository();
        authenticationService = new AuthenticationService(logger, userRepository);
    });

    afterEach(() => {
        // Clean up after each test
        userRepository.clear();
    });

    describe('authenticate', () => {
        it('should authenticate valid user credentials', async () => {
            // Arrange
            const email = 'admin@example.com';
            const password = 'admin123';

            // Act
            const result = await authenticationService.authenticate(email, password);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.user).toBeDefined();
            expect(result.data.token).toBeDefined();
            expect(result.data.user.email).toBe(email);
        });

        it('should fail with invalid credentials', async () => {
            // Arrange
            const email = 'admin@example.com';
            const password = 'wrongpassword';

            // Act
            const result = await authenticationService.authenticate(email, password);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toBe('Invalid credentials');
        });

        it('should fail with non-existent user', async () => {
            // Arrange
            const email = 'nonexistent@example.com';
            const password = 'password123';

            // Act
            const result = await authenticationService.authenticate(email, password);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toBe('Invalid credentials');
        });

        it('should validate input data', async () => {
            // Arrange
            const email = 'invalid-email';
            const password = '123'; // Too short

            // Act
            const result = await authenticationService.authenticate(email, password);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toContain('Invalid input data');
        });
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            // Arrange
            const userData = {
                email: 'newuser@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user'
            };

            // Act
            const result = await authenticationService.register(userData);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.user).toBeDefined();
            expect(result.data.token).toBeDefined();
            expect(result.data.user.email).toBe(userData.email);
            expect(result.data.user.firstName).toBe(userData.firstName);
            expect(result.data.user.lastName).toBe(userData.lastName);
        });

        it('should fail when registering user with existing email', async () => {
            // Arrange
            const userData = {
                email: 'admin@example.com', // Already exists
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user'
            };

            // Act
            const result = await authenticationService.register(userData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toBe('User with this email already exists');
        });

        it('should validate registration data', async () => {
            // Arrange
            const userData = {
                email: 'invalid-email',
                password: '123', // Too short
                firstName: 'J', // Too short
                lastName: 'D', // Too short
                role: 'invalid-role'
            };

            // Act
            const result = await authenticationService.register(userData);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toContain('Invalid input data');
        });
    });

    describe('generateToken', () => {
        it('should generate valid JWT token', async () => {
            // Arrange
            const user = await userRepository.findByEmail('admin@example.com');

            // Act
            const token = await authenticationService.generateToken(user);

            // Assert
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should fail when JWT_SECRET is not set', async () => {
            // Arrange
            const originalSecret = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;
            const user = await userRepository.findByEmail('admin@example.com');

            // Act & Assert
            await expect(authenticationService.generateToken(user))
                .rejects.toThrow('JWT_SECRET environment variable is required');

            // Cleanup
            process.env.JWT_SECRET = originalSecret;
        });
    });

    describe('verifyToken', () => {
        it('should verify valid JWT token', async () => {
            // Arrange
            const user = await userRepository.findByEmail('admin@example.com');
            const token = await authenticationService.generateToken(user);

            // Act
            const decoded = await authenticationService.verifyToken(token);

            // Assert
            expect(decoded).toBeDefined();
            expect(decoded.userId).toBe(user.id);
            expect(decoded.email).toBe(user.email);
            expect(decoded.role).toBe(user.role);
        });

        it('should fail with invalid token', async () => {
            // Arrange
            const invalidToken = 'invalid.token.here';

            // Act & Assert
            await expect(authenticationService.verifyToken(invalidToken))
                .rejects.toThrow();
        });
    });

    describe('hashPassword', () => {
        it('should hash password correctly', async () => {
            // Arrange
            const password = 'password123';

            // Act
            const hashedPassword = await authenticationService.hashPassword(password);

            // Assert
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.startsWith('$2b$')).toBe(true); // bcrypt format
        });
    });

    describe('comparePassword', () => {
        it('should compare password correctly', async () => {
            // Arrange
            const password = 'password123';
            const hashedPassword = await authenticationService.hashPassword(password);

            // Act
            const isValid = await authenticationService.comparePassword(password, hashedPassword);

            // Assert
            expect(isValid).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            // Arrange
            const password = 'password123';
            const wrongPassword = 'wrongpassword';
            const hashedPassword = await authenticationService.hashPassword(password);

            // Act
            const isValid = await authenticationService.comparePassword(wrongPassword, hashedPassword);

            // Assert
            expect(isValid).toBe(false);
        });
    });

    describe('refreshToken', () => {
        it('should refresh valid token', async () => {
            // Arrange
            const user = await userRepository.findByEmail('admin@example.com');
            const originalToken = await authenticationService.generateToken(user);

            // Act
            const result = await authenticationService.refreshToken(originalToken);

            // Assert
            expect(result.success).toBe(true);
            expect(result.data.token).toBeDefined();
            expect(result.data.user).toBeDefined();
        });

        it('should fail with invalid token', async () => {
            // Arrange
            const invalidToken = 'invalid.token.here';

            // Act
            const result = await authenticationService.refreshToken(invalidToken);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error.message).toBe('Invalid token');
        });
    });
});

module.exports = AuthenticationService; 