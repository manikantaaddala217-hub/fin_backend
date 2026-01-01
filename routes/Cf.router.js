const express = require('express');
const CfRouter = express.Router();
const { saveCf, clearCf, getAllCf } = require('../controllers/Cf.controller');

// POST /cf/save -> save a cf entry
CfRouter.post('/cf/save', saveCf);

// DELETE /cf/clear -> clear all cf entries
CfRouter.delete('/cf/clear', clearCf);

// GET /cf/all -> list all cf entries (for testing)
CfRouter.get('/cf/all', getAllCf);

module.exports = CfRouter;
