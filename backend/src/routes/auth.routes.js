const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authorize');
const authController = require('../controllers/auth.controller');

// Public routes (no auth required)
router.post('/register', authController.registerSchema, authController.register);
router.post('/verify-email', authController.verifyEmailSchema, authController.verifyEmail);
router.post('/authenticate', authController.authenticateSchema, authController.authenticate);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPasswordSchema, authController.forgotPassword);
router.post('/validate-reset-token', authController.validateResetTokenSchema, authController.validateResetToken);
router.post('/reset-password', authController.resetPasswordSchema, authController.resetPassword);

// Authenticated routes
router.post('/revoke-token', authorize(), authController.revokeTokenSchema, authController.revokeToken);

module.exports = router;
