// Fake backend helper — provides in-memory data for testing without MySQL
// This is a placeholder for development/testing purposes
// Set USE_FAKE_BACKEND=true in .env to enable

const bcrypt = require('bcryptjs');

let accounts = [];
let refreshTokens = [];

function initialize() {
    // Seed with a default admin account
    accounts = [
        {
            id: 1,
            title: 'Mr',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            passwordHash: bcrypt.hashSync('Admin123!', 10),
            role: 'Admin',
            verified: new Date(),
            created: new Date(),
            updated: new Date()
        }
    ];
    refreshTokens = [];
    console.log('⚠️  Fake backend initialized with default admin: admin@example.com / Admin123!');
}

function getAccounts() {
    return accounts;
}

function getRefreshTokens() {
    return refreshTokens;
}

module.exports = {
    initialize,
    getAccounts,
    getRefreshTokens
};
