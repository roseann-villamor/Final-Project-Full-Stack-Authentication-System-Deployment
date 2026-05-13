module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    switch (true) {
        case typeof err === 'string':
            // Custom application error
            const is404 = err.toLowerCase().endsWith('not found');
            const statusCode = is404 ? 404 : 400;
            return res.status(statusCode).json({ message: err });

        case err.name === 'ValidationError':
            // Joi validation error
            return res.status(400).json({ message: err.message });

        case err.name === 'UnauthorizedError':
            // JWT authentication error
            return res.status(401).json({ message: 'Unauthorized' });

        default:
            // Determine status from error message for known application errors
            const msg = err.message || 'Internal Server Error';
            const isAuthError = msg.toLowerCase().includes('email or password is incorrect')
                || msg.toLowerCase().includes('verification failed')
                || msg.toLowerCase().includes('invalid token')
                || msg.toLowerCase().includes('no refresh token');
            const status = isAuthError ? 400 : 500;

            if (status === 500) {
                console.error('❌ Unhandled error:', err);
            }
            return res.status(status).json({ message: msg });
    }
}
