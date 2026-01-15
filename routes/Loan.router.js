const express = require('express');
const LoanRouter = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

const {
    getAllLoans,
    createLoan,
    updateLoanById,
    deleteLoanById,
    saveTable,
    getTablesByLoanId,
    updateTableEntry,
    getLoanSummary,
    downloadReport,
    renewLoan
} = require('../controllers/Loan.controller');

// Apply authMiddleware to all routes in this router
LoanRouter.use(authMiddleware);

// POST /loan/create -> create a new loan
LoanRouter.post('/loan/create', createLoan);
// POST /loan/download -> download loan data as Excel
LoanRouter.post('/loan/download', downloadReport);

//total collections
LoanRouter.get("/loan/summary", getLoanSummary);

// GET /loan/all -> get all loans
LoanRouter.get('/loan/all', getAllLoans);

// PUT /loan/update/:id -> update loan by ID
LoanRouter.put('/loan/update', updateLoanById);

// PUT /loan/renew -> renew loan (reset paid, update dates, clear history)
LoanRouter.put('/loan/renew', renewLoan);

// DELETE /loan/delete -> delete loan by ID (Query Param)
LoanRouter.delete('/loan/delete', deleteLoanById);

// 🔹 Table Routes
// POST /table/save
LoanRouter.post('/table/save', saveTable);

// PUT /table/update/:id
LoanRouter.put('/table/update', updateTableEntry);

// GET /table/loan -> Get tables by loanId (Query Param)
LoanRouter.get('/table/loan', getTablesByLoanId);

module.exports = LoanRouter;
