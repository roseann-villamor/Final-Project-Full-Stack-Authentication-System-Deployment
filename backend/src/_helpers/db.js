const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
    }
);

const db = {};

// Import models
db.Account = require('../models/user.model')(sequelize);
db.RefreshToken = require('../models/refresh-token.model')(sequelize);

// Relationships
db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
db.RefreshToken.belongsTo(db.Account);

// Initialize (sync tables)
db.initialize = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connection established successfully.');

        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized.');
    } catch (error) {
        console.error('❌ Unable to connect to MySQL:', error.message);
        throw error;
    }
};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
