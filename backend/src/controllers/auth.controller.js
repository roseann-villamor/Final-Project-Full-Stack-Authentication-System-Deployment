const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Joi = require('joi');
const db = require('../_helpers/db');
const sendEmail = require('../_helpers/send-email');
const validateRequest = require('../middleware/validate-request');

module.exports = {
    registerSchema,
    register,
    verifyEmailSchema,
    verifyEmail,
    authenticateSchema,
    authenticate,
    refreshToken,
    revokeTokenSchema,
    revokeToken,
    forgotPasswordSchema,
    forgotPassword,
    validateResetTokenSchema,
    validateResetToken,
    resetPasswordSchema,
    resetPassword
};

// ─── Validation Schemas ──────────────────────────────────

function registerSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function resetPasswordSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

// ─── Controller Functions ────────────────────────────────

async function register(req, res, next) {
    try {
        // Check if email already registered
        const existing = await db.Account.findOne({ where: { email: req.body.email } });
        if (existing) {
            // Don't reveal that email is already registered (security)
            return res.status(200).json({
                message: 'Registration successful, please check your email for verification instructions'
            });
        }

        // Create account
        const account = new db.Account(req.body);

        // Hash password
        account.passwordHash = await bcrypt.hash(req.body.password, 10);

        // Generate verification token
        account.verificationToken = randomTokenString();
        account.created = new Date();
        account.role = 'User';

        // Save account
        await account.save();

        // Send verification email
        await sendVerificationEmail(account, req.get('origin'));

        res.json({
            message: 'Registration successful, please check your email for verification instructions'
        });
    } catch (err) {
        next(err);
    }
}

async function verifyEmail(req, res, next) {
    try {
        const account = await db.Account.findOne({
            where: { verificationToken: req.body.token }
        });

        if (!account) throw new Error('Verification failed');

        account.verified = new Date();
        account.verificationToken = null;
        await account.save();

        res.json({ message: 'Verification successful, you can now login' });
    } catch (err) {
        next(err);
    }
}

async function authenticate(req, res, next) {
    try {
        const { email, password } = req.body;

        // Get account with password hash
        const account = await db.Account.scope('withHash').findOne({ where: { email } });

        if (!account || !account.isVerified() || !(await bcrypt.compare(password, account.passwordHash))) {
            throw new Error('Email or password is incorrect');
        }

        // Authentication successful — generate JWT and refresh token
        const jwtToken = generateJwtToken(account);
        const refreshTokenObj = await generateRefreshToken(account, ipAddress(req));

        // Set refresh token cookie
        setTokenCookie(res, refreshTokenObj.token);

        res.json({
            ...basicDetails(account),
            jwtToken
        });
    } catch (err) {
        next(err);
    }
}

async function refreshToken(req, res, next) {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw new Error('No refresh token in cookie');

        const refreshTokenObj = await getRefreshToken(token);
        const account = await refreshTokenObj.getAccount();

        // Replace old refresh token with a new one and save
        const newRefreshToken = await generateRefreshToken(account, ipAddress(req));
        refreshTokenObj.revoked = new Date();
        refreshTokenObj.revokedByIp = ipAddress(req);
        refreshTokenObj.replacedByToken = newRefreshToken.token;
        await refreshTokenObj.save();

        // Generate new JWT
        const jwtToken = generateJwtToken(account);

        // Set new refresh token cookie
        setTokenCookie(res, newRefreshToken.token);

        res.json({
            ...basicDetails(account),
            jwtToken
        });
    } catch (err) {
        next(err);
    }
}

async function revokeToken(req, res, next) {
    try {
        // Accept token from request body or cookie
        const token = req.body.token || req.cookies.refreshToken;
        if (!token) throw new Error('Token is required');

        // Users can revoke their own tokens and admins can revoke any tokens
        const owns = await req.user.ownsToken(token);
        if (!owns && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const refreshTokenObj = await getRefreshToken(token);
        refreshTokenObj.revoked = new Date();
        refreshTokenObj.revokedByIp = ipAddress(req);
        await refreshTokenObj.save();

        res.json({ message: 'Token revoked' });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const account = await db.Account.findOne({ where: { email: req.body.email } });

        // Always return ok response to prevent email enumeration
        if (!account) {
            return res.json({ message: 'Please check your email for password reset instructions' });
        }

        // Create reset token that expires after 24 hours
        account.resetToken = randomTokenString();
        account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await account.save();

        // Send password reset email
        await sendPasswordResetEmail(account, req.get('origin'));

        res.json({ message: 'Please check your email for password reset instructions' });
    } catch (err) {
        next(err);
    }
}

async function validateResetToken(req, res, next) {
    try {
        const account = await db.Account.findOne({
            where: {
                resetToken: req.body.token,
            }
        });

        if (!account || new Date() > account.resetTokenExpires) {
            throw new Error('Invalid token');
        }

        res.json({ message: 'Token is valid' });
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const account = await db.Account.findOne({
            where: { resetToken: req.body.token }
        });

        if (!account || new Date() > account.resetTokenExpires) {
            throw new Error('Invalid token');
        }

        // Update password and remove reset token
        account.passwordHash = await bcrypt.hash(req.body.password, 10);
        account.resetToken = null;
        account.resetTokenExpires = null;
        account.updated = new Date();
        await account.save();

        res.json({ message: 'Password reset successful, you can now login' });
    } catch (err) {
        next(err);
    }
}

// ─── Helper Functions ────────────────────────────────────

function basicDetails(account) {
    const { id, firstName, lastName, email, role, created, updated } = account;
    return { id, firstName, lastName, email, role, created, updated, isVerified: account.isVerified() };
}

function generateJwtToken(account) {
    return jwt.sign(
        { id: account.id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
}

async function generateRefreshToken(account, ip) {
    const token = randomTokenString();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const refreshToken = await db.RefreshToken.create({
        AccountId: account.id,
        token,
        expires,
        createdByIp: ip
    });

    return refreshToken;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive()) throw new Error('Invalid token');
    return refreshToken;
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function setTokenCookie(res, token) {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sameSite: 'None',
        secure: true
    };
    res.cookie('refreshToken', token, cookieOptions);
}

function ipAddress(req) {
    return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

async function sendVerificationEmail(account, origin) {
    let verifyUrl;
    if (origin) {
        verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
    } else {
        verifyUrl = `${process.env.CORS_ORIGIN}/account/verify-email?token=${account.verificationToken}`;
    }

    const message = `
        <h4>Verify Email</h4>
        <p>Thanks for registering!</p>
        <p>Please click the below link to verify your email address:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification - Verify Email',
        html: message
    });
}

async function sendPasswordResetEmail(account, origin) {
    let resetUrl;
    if (origin) {
        resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
    } else {
        resetUrl = `${process.env.CORS_ORIGIN}/account/reset-password?token=${account.resetToken}`;
    }

    const message = `
        <h4>Reset Password</h4>
        <p>Please click the below link to reset your password, the link will be valid for 24 hours:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
    `;

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification - Reset Password',
        html: message
    });
}
