const express = require('express');
const LoanRouter = express.Router();

const {
    getAllLoans,
    createLoan,
    updateLoanById,
    deleteLoanById,
    saveTable,
    getTablesByLoanId,
    updateTableEntry,
} = require('../controllers/Loan.controller');

// POST /loan/create -> create a new loan
LoanRouter.post('/loan/create', createLoan);

// GET /loan/all -> get all loans
LoanRouter.get('/loan/all', getAllLoans);

// PUT /loan/update/:id -> update loan by ID
LoanRouter.put('/loan/update/:id', updateLoanById);

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
