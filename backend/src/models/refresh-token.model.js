const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        token: {
            type: DataTypes.STRING
        },
        expires: {
            type: DataTypes.DATE,
            allowNull: false
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        createdByIp: {
            type: DataTypes.STRING
        },
        revoked: {
            type: DataTypes.DATE
        },
        revokedByIp: {
            type: DataTypes.STRING
        },
        replacedByToken: {
            type: DataTypes.STRING
        }
    }, {
        timestamps: false
    });

    // Virtual field: isExpired
    RefreshToken.prototype.isExpired = function () {
        return Date.now() >= new Date(this.expires).getTime();
    };

    // Virtual field: isActive
    RefreshToken.prototype.isActive = function () {
        return !this.revoked && !this.isExpired();
    };

    return RefreshToken;
};
