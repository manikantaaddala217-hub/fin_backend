const LoanUser = require('../models/Loan.model');
const LoanTable = require('../models/Table.model');

// 🔹 Get All Loans
const getAllLoans = async (req, res) => {
    const filters = req.query;
    try {
        const loans = await LoanUser.findAll({ where: filters });
        res.status(200).json({
            success: true,
            data: loans,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loans',
            error: error.message,
        });
    }
};

// 🔹 Create New Loan
const createLoan = async (req, res) => {
    try {
        const loanData = req.body;

        // Check for existing loan with same sNo and section
        const existingLoan = await LoanUser.findOne({
            where: {
                sNo: loanData.sNo,
                section: loanData.section
            }
        });

        if (existingLoan) {
            return res.status(400).json({
                success: false,
                message: `Loan with sNo ${loanData.sNo} and section ${loanData.section} already exists.`,
            });
        }

        const newLoan = await LoanUser.create(loanData);
        res.status(201).json({
            success: true,
            message: 'Loan created successfully',
            data: newLoan,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to create loan',
            error: error.message,
        });
    }
};


const getTablesByLoanId = async (req, res) => {
    try {
        const { loanId } = req.query;
        const details = await LoanUser.findOne({
            where: { loanId }
        });
        const entries = await LoanTable.findAll({
            where: { loanId }
        });
        res.status(200).json({
            success: true,
            data: entries,
            user: details
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch table entries for loan",
            error: error.message
        });
    }
};


const deleteLoanById = async (req, res) => {
    try {
        const { id } = req.query;

        const deletedRows = await LoanUser.destroy({
            where: { loanId: id },
        });
        await LoanTable.destroy({
            where: { loanId: id }
        });
        if (deletedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Loan deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete loan',
            error: error.message,
        });
    }
};

// 🔹 Update Loan by ID
const updateLoanById = async (req, res) => {
    try {
        const { id } = req.params; // Expecting loanId in params
        const updateData = req.body;

        const [updatedRows] = await LoanUser.update(updateData, {
            where: { loanId: id },
        });

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        const updatedLoan = await LoanUser.findOne({ where: { loanId: id } });

        res.status(200).json({
            success: true,
            message: 'Loan updated successfully',
            data: updatedLoan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update loan',
            error: error.message,
        });
    }
};

// 🔹 Table CRUD Operations
const saveTable = async (req, res) => {
    try {
        const { loanId, date, amount } = req.body;

        if (!loanId || !date || !amount) {
            return res.status(400).json({
                success: false,
                message: "loanId, date, and amount are required"
            });
        }

        // 1. Find the LoanUser to update
        const loan = await LoanUser.findOne({ where: { loanId } });
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            });
        }

        // 2. Create the Table Entry
        const newEntry = await LoanTable.create({
            loanId,
            date,
            amount
        });

        // 3. Update the LoanUser paid amount
        // Use parseFloat/parseInt to ensure we are doing math, not string concatenation if types are loose
        const currentPaid = parseFloat(loan.paid) || 0;
        const entryAmount = parseFloat(amount);
        const newPaid = currentPaid + entryAmount;

        await LoanUser.update(
            { paid: newPaid },
            { where: { loanId } }
        );

        res.status(201).json({
            success: true,
            message: "Table entry created and loan paid amount updated successfully",
            data: newEntry,
            updatedPaid: newPaid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create table entry",
            error: error.message
        });
    }
};

// 🔹 Update Table Entry
const updateTableEntry = async (req, res) => {
    try {
        const { id } = req.query; // Table entry ID
        const { amount, date } = req.body;

        // 1. Find the existing table entry
        const tableEntry = await LoanTable.findByPk(date);
        if (!tableEntry) {
            return res.status(404).json({
                success: false,
                message: "Table entry not found"
            });
        }

        const oldAmount = parseFloat(tableEntry.amount);
        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;

        // 2. Calculate difference
        const difference = newAmount - oldAmount;

        // 3. Update the table entry
        if (amount !== undefined) tableEntry.amount = newAmount;
        if (date !== undefined) tableEntry.date = date;
        await tableEntry.save();

        // 4. Update LoanUser if amount changed
        if (difference !== 0) {
            const loan = await LoanUser.findOne({ where: { loanId: tableEntry.loanId } });
            if (loan) {
                const currentPaid = parseFloat(loan.paid) || 0;
                await LoanUser.update(
                    { paid: currentPaid + difference },
                    { where: { loanId: tableEntry.loanId } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: "Table entry updated successfully",
            data: tableEntry
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update table entry",
            error: error.message
        });
    }
};

module.exports = {
    getAllLoans,
    createLoan,
    updateLoanById,
    deleteLoanById,
    saveTable,
    getTablesByLoanId,
    updateTableEntry,
};
