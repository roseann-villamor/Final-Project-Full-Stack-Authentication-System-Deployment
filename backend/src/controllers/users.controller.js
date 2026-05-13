const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../_helpers/db');
const validateRequest = require('../middleware/validate-request');

module.exports = {
    getAll,
    getById,
    createSchema,
    create,
    updateSchema,
    update,
    _delete
};

// ─── Get All Accounts (Admin) ────────────────────────────
async function getAll(req, res, next) {
    try {
        const accounts = await db.Account.findAll();
        res.json(accounts);
    } catch (err) {
        next(err);
    }
}

// ─── Get Account by ID ──────────────────────────────────
async function getById(req, res, next) {
    try {
        // Users can get their own account and admins can get any account
        if (Number(req.params.id) !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const account = await db.Account.findByPk(req.params.id);
        if (!account) throw new Error('Account not found');

        res.json(account);
    } catch (err) {
        next(err);
    }
}

// ─── Create Account (Admin) ─────────────────────────────

function createSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid('Admin', 'User').required()
    });
    validateRequest(req, next, schema);
}

async function create(req, res, next) {
    try {
        // Validate email is not already taken
        const existing = await db.Account.findOne({ where: { email: req.body.email } });
        if (existing) {
            throw new Error(`Email "${req.body.email}" is already registered`);
        }

        const account = new db.Account(req.body);
        account.passwordHash = await bcrypt.hash(req.body.password, 10);
        account.verified = new Date();
        account.created = new Date();

        await account.save();

        res.json(account);
    } catch (err) {
        next(err);
    }
}

// ─── Update Account ─────────────────────────────────────

function updateSchema(req, res, next) {
    const schemaRules = {
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
    };

    // Only admins can update role
    if (req.user.role === 'Admin') {
        schemaRules.role = Joi.string().valid('Admin', 'User').empty('');
    }

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

async function update(req, res, next) {
    try {
        // Users can update their own account and admins can update any account
        if (Number(req.params.id) !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const account = await db.Account.scope('withHash').findByPk(req.params.id);
        if (!account) throw new Error('Account not found');

        // Validate email change
        if (req.body.email && req.body.email !== account.email) {
            const existing = await db.Account.findOne({ where: { email: req.body.email } });
            if (existing) {
                throw new Error(`Email "${req.body.email}" is already taken`);
            }
        }

        // Hash password if it was entered
        if (req.body.password) {
            req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
        }

        // Copy params to account and save
        Object.assign(account, req.body);
        account.updated = new Date();
        await account.save();

        // Return updated account without hash
        const updatedAccount = await db.Account.findByPk(req.params.id);
        res.json(updatedAccount);
    } catch (err) {
        next(err);
    }
}

// ─── Delete Account ─────────────────────────────────────
async function _delete(req, res, next) {
    try {
        // Users can delete their own account and admins can delete any account
        if (Number(req.params.id) !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const account = await db.Account.findByPk(req.params.id);
        if (!account) throw new Error('Account not found');

        await account.destroy();

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        next(err);
    }
}
