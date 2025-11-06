import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/checkers_test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
