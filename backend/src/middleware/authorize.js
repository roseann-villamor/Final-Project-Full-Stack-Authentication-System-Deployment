const jwt = require('jsonwebtoken');
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
    // roles param can be a single role string (e.g. 'Admin')
    // or an array of roles (e.g. ['Admin', 'User'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // Authenticate JWT token
        async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get account from database
                const account = await db.Account.findByPk(decoded.id);
                if (!account) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                // Check role authorization
                if (roles.length && !roles.includes(account.role)) {
                    return res.status(403).json({ message: 'Forbidden' });
                }

                // Get refresh tokens for this account
                account.ownsToken = async (token) => {
                    const refreshToken = await db.RefreshToken.findOne({
                        where: { token, AccountId: account.id }
                    });
                    return !!refreshToken;
                };

                // Attach account to request
                req.user = account;
                next();
            } catch (err) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
        }
    ];
}
