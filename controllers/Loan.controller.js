const LoanUser = require('../models/Loan.model');
const LoanTable = require('../models/Table.model');
const { Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");

// 🔹 Get All Loans
const getAllLoans = async (req, res) => {
    const {section} = req.query;
    try {
        const loans = await LoanUser.findAll({ where: {section : section  } });
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
        console.log(loanData);  
        // Check for existing loan with same sNo and section
        const existingLoan = await LoanUser.findOne({
            where: {
                sno: loanData.sno,
                section: loanData.section
            }
        });
        console.log(existingLoan);
        if (existingLoan) {
            return res.status(400).json({
                success: false,
                message: `Loan with sNo ${loanData.sno} and section ${loanData.section} already exists.`,
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
        // const { id } = req.params; // Expecting loanId in params
        const updateData = req.body;

        const [updatedRows] = await LoanUser.update(updateData, {
            where: { loanId: updateData.loanId },
        });

        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found',
            });
        }

        const updatedLoan = await LoanUser.findOne({ where: { loanId: updateData.loanId} });

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
        message: "loanId, date, and amount are required",
      });
    }

    // 1️⃣ Check loan exists
    const loan = await LoanUser.findOne({ where: { loanId } });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // 2️⃣ Check SAME loanId + date already exists
    const existingEntry = await LoanTable.findOne({
      where: {
        loanId,
        date,
      },
    });

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: "Entry for this date already exists for this loan",
      });
    }

    // 3️⃣ Create new table entry
    const newEntry = await LoanTable.create({
      loanId,
      date,
      amount: Number(amount),
    });

    // 4️⃣ Update paid amount
    const newPaid = (Number(loan.paid) || 0) + Number(amount);

    await loan.update({ paid: newPaid });

    res.status(201).json({
      success: true,
      message: "Entry created successfully",
      data: newEntry,
      updatedPaid: newPaid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create table entry",
      error: error.message,
    });
  }
};


// 🔹 Update Table Entry
const updateTableEntry = async (req, res) => {
  try {
    const {loanId, date, amount, newDate } = req.body;

    if (!loanId || !date) {
      return res.status(400).json({
        success: false,
        message: "loanId and date are required",
      });
    }

    // 1️⃣ Find table entry by loanId + date
    const tableEntry = await LoanTable.findOne({
      where: { loanId, date },
    });

    if (!tableEntry) {
      return res.status(404).json({
        success: false,
        message: "Table entry not found",
      });
    }

    const oldAmount = Number(tableEntry.amount) || 0;
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;

    // 2️⃣ Calculate difference
    const difference = newAmount - oldAmount;

    // 3️⃣ Update table entry
    tableEntry.amount = newAmount;
    if (newDate) tableEntry.date = newDate;
    await tableEntry.save();

    // 4️⃣ Update LoanUser paid
    if (difference !== 0) {
      const loan = await LoanUser.findOne({ where: { loanId } });
      if (loan) {
        const updatedPaid = (Number(loan.paid) || 0) + difference;
        await loan.update({ paid: updatedPaid });
      }
    }

    res.status(200).json({
      success: true,
      message: "Table entry updated successfully",
      data: tableEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update table entry",
      error: error.message,
    });
  }
};



const getLoanSummary = async (req, res) => {
  try {
    // 🔹 Section-wise summary
    const sectionSummary = await LoanUser.findAll({
      attributes: [
        "section",
        [Sequelize.fn("SUM", Sequelize.col("tamount")), "totalAmount"],
        [Sequelize.fn("SUM", Sequelize.col("paid")), "paidAmount"],
        [
          Sequelize.literal("SUM(tamount - paid)"),
          "balanceAmount",
        ],
      ],
      where: {
        section: ["Daily", "Weekly", "Monthly"],
      },
      group: ["section"],
    });

    // 🔹 Overall total summary
    const totalSummary = await LoanUser.findOne({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("tamount")), "totalAmount"],
        [Sequelize.fn("SUM", Sequelize.col("paid")), "paidAmount"],
        [
          Sequelize.literal("SUM(tamount - paid)"),
          "balanceAmount",
        ],
      ],
    });

    return res.status(200).json({
      success: true,
      sections: sectionSummary,
      total: totalSummary,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan summary",
    });
  }
};





const downloadExcel = async (req, res) => {
  try {
    const {
      dataType,   // "customer" | "collection"
      section,    // Daily | Weekly | Monthly | Intrest
      areas,      // array of areas
      day,        // only for Weekly
      fromDate,   // YYYY-MM-DD
      toDate      // YYYY-MM-DD
    } = req.body;

    if (!dataType || !fromDate || !toDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let data = [];

    // ===================== CUSTOMER DATA =====================
    if (dataType === "customer") {
      const whereClause = {
        givenDate: { [Op.between]: [fromDate, toDate] }
      };

      if (section) whereClause.section = section;
      if (areas?.length) whereClause.area = { [Op.in]: areas };
      if (section === "Weekly" && day) whereClause.day = day;

      data = await LoanUser.findAll({ where: whereClause });
    }

    // ===================== COLLECTION DATA =====================
    if (dataType === "collection") {
      const whereClause = {
        collectionDate: { [Op.between]: [fromDate, toDate] }
      };

      if (section) whereClause.section = section;
      if (areas?.length) whereClause.area = { [Op.in]: areas };
      if (section === "Weekly" && day) whereClause.day = day;

      data = await Collection.findAll({ where: whereClause });
    }

    // ===================== CREATE EXCEL =====================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      dataType === "customer" ? "Customers" : "Collections"
    );

    // ---------- CUSTOMER COLUMNS ----------
    if (dataType === "customer") {
      worksheet.columns = [
        { header: "S.No", key: "sNo", width: 8 },
        { header: "Section", key: "section", width: 12 },
        { header: "Area", key: "area", width: 12 },
        { header: "Day", key: "day", width: 12 },
        { header: "Name", key: "name", width: 20 },
        { header: "Address", key: "address", width: 25 },
        { header: "Phone Number", key: "phno", width: 15 },
        { header: "Alternative Number", key: "alternativeno", width: 18 },
        { header: "Work", key: "work", width: 15 },
        { header: "H/O / W/O", key: "h_o_W_o", width: 18 },
        { header: "Refer Name", key: "refername", width: 18 },
        { header: "Refer Number", key: "referno", width: 18 },
        { header: "Given Amount", key: "gamount", width: 15 },
        { header: "Paid Amount", key: "paid", width: 15 },
        { header: "Interest %", key: "interestPercnt", width: 12 },
        { header: "Interest Amount", key: "interest", width: 15 },
        { header: "Total Amount", key: "tamount", width: 15 },
        { header: "Given Date", key: "givenDate", width: 15 },
        { header: "Last Date", key: "lastDate", width: 15 },
        { header: "Additional Info", key: "additionalInfo", width: 25 }
      ];
    }

    // ---------- COLLECTION COLUMNS ----------
    if (dataType === "collection") {
      worksheet.columns = [
        { header: "Customer Name", key: "name", width: 20 },
        { header: "Section", key: "section", width: 15 },
        { header: "Area", key: "area", width: 15 },
        { header: "Amount Paid", key: "amount", width: 15 },
        { header: "Collection Date", key: "collectionDate", width: 15 }
      ];
    }

    // ---------- ADD ROWS ----------
    data.forEach(row => worksheet.addRow(row.toJSON()));

    // ---------- SEND FILE ----------
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${dataType}_report_${fromDate}_to_${toDate}.xlsx`
    );

    res.status(200).send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Excel download failed" });
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
    getLoanSummary,
    downloadExcel
};
