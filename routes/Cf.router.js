const express = require('express');
const CfRouter = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { saveCf, clearCf, getAllCf } = require('../controllers/Cf.controller');

// Apply authMiddleware to all routes in this router
CfRouter.use(authMiddleware);

// POST /cf/save -> save a cf entry
CfRouter.post('/cf/save', saveCf);

// DELETE /cf/clear -> clear all cf entries
CfRouter.delete('/cf/clear', clearCf);

// GET /cf/all -> list all cf entries (for testing)
CfRouter.get('/cf/all', getAllCf);

module.exports = CfRouter;
