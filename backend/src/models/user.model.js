const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Account = sequelize.define('Account', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('Admin', 'User'),
            allowNull: false,
            defaultValue: 'User'
        },
        verificationToken: {
            type: DataTypes.STRING
        },
        verified: {
            type: DataTypes.DATE
        },
        resetToken: {
            type: DataTypes.STRING
        },
        resetTokenExpires: {
            type: DataTypes.DATE
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated: {
            type: DataTypes.DATE
        }
    }, {
        timestamps: false,
        defaultScope: {
            // exclude password hash by default
            attributes: { exclude: ['passwordHash'] }
        },
        scopes: {
            // include hash when needed
            withHash: { attributes: {} }
        }
    });

    // Instance method to check if verified
    Account.prototype.isVerified = function () {
        return !!this.verified;
    };

    return Account;
};
