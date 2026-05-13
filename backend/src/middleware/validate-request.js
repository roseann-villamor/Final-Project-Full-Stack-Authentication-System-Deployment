module.exports = validateRequest;

function validateRequest(req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true  // remove unknown props
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
        // Throw as Joi ValidationError so the error handler catches it with 400 status
        const validationError = new Error(error.details.map(x => x.message).join(', '));
        validationError.name = 'ValidationError';
        next(validationError);
    } else {
        req.body = value;
        next();
    }
}
