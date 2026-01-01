const express = require('express');
const BkpRouter = express.Router();
const { saveBkp, deleteBkp, getAllBkp } = require('../controllers/Bkp.controller');

// POST /bkp/save -> save a bkp entry
BkpRouter.post('/bkp/save', saveBkp);
// DELETE /bkp/delete/:id or /bkp/delete?id=UUID -> delete a bkp entry by id (route param or query)
// support optional :id param
BkpRouter.delete('/bkp/delete/', deleteBkp);

// GET /bkp/all -> list all bkp entries (for testing)
BkpRouter.get('/bkp/all', getAllBkp);

module.exports = BkpRouter;
