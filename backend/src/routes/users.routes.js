const express = require('express');
const router = express.Router();
const authorize = require('../middleware/authorize');
const usersController = require('../controllers/users.controller');

// All routes require authentication
// Admin-only routes
router.get('/', authorize('Admin'), usersController.getAll);
router.post('/', authorize('Admin'), usersController.createSchema, usersController.create);

// Authenticated routes (user can access own, admin can access any)
router.get('/:id', authorize(), usersController.getById);
router.put('/:id', authorize(), usersController.updateSchema, usersController.update);
router.delete('/:id', authorize(), usersController._delete);

module.exports = router;
