// Test setup file for Jest
require('dotenv').config({ path: '.env.test' });

// Set test environment variables if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs during tests unless explicitly needed
if (process.env.NODE_ENV === 'test') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();
}

// Global test utilities
global.testUtils = {
    // Create a mock user object
    createMockUser: (overrides = {}) => ({
        id: 'test-user-id',
        email: 'test@example.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK6e',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    }),

    // Create a mock request object
    createMockRequest: (overrides = {}) => ({
        body: {},
        query: {},
        params: {},
        headers: {},
        ip: '127.0.0.1',
        method: 'GET',
        path: '/test',
        get: jest.fn(),
        ...overrides
    }),

    // Create a mock response object
    createMockResponse: () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        return res;
    },

    // Create a mock next function
    createMockNext: () => jest.fn()
}; 