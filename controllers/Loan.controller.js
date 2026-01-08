const LoanUser = require("../models/Loan.model");
const LoanTable = require("../models/Table.model");
const { Sequelize } = require("sequelize");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Op } = require("sequelize");

// 🔹 Get All Loans
const getAllLoans = async (req, res) => {
  const { section } = req.query;
  try {
    const loans = await LoanUser.findAll({ where: { section: section } });
    res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch loans",
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
        section: loanData.section,
      },
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
      message: "Loan created successfully",
      data: newLoan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create loan",
      error: error.message,
    });
  }
};

const getTablesByLoanId = async (req, res) => {
  try {
    const { loanId } = req.query;
    const details = await LoanUser.findOne({
      where: { loanId },
    });
    const entries = await LoanTable.findAll({
      where: { loanId },
    });
    res.status(200).json({
      success: true,
      data: entries,
      user: details,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch table entries for loan",
      error: error.message,
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
      where: { loanId: id },
    });
    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete loan",
      error: error.message,
    });
  }
};

// 🔹 Update Loan by ID
const updateLoanById = async (req, res) => {
  try {
    const updateData = req.body;

    if (!updateData.loanId) {
      return res.status(400).json({
        success: false,
        message: "loanId is required",
      });
    }

    // 🔹 Fetch existing loan
    const existingLoan = await LoanUser.findOne({
      where: { loanId: updateData.loanId },
    });

    if (!existingLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // 🔹 Map correct model fields
    let {
      givenAmount = existingLoan.givenAmount,
      interestPercent = existingLoan.interestPercent || 0,
      interest = existingLoan.interest || 0,
      section = existingLoan.section,
    } = updateData;

    // 🔥 Interest calculation
    if (section === "Interest") {
      // Backend calculates interest
      interest = Math.round((Number(givenAmount) * Number(interestPercent)) / 100);
    }
    // else → interest comes from frontend

    // 🔹 Total amount
    const tamount = Number(givenAmount) + Number(interest);

    const finalUpdateData = {
      ...updateData,
      givenAmount,
      interest,
      tamount,
    };

    // 🔹 Update DB
    const [updatedRows] = await LoanUser.update(finalUpdateData, {
      where: { loanId: updateData.loanId },
    });

    if (updatedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing updated",
      });
    }

    const updatedLoan = await LoanUser.findOne({
      where: { loanId: updateData.loanId },
    });

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update loan",
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
    const { loanId, date, amount, newDate } = req.body;

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
        [Sequelize.literal("SUM(tamount - paid)"), "balanceAmount"],
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
        [Sequelize.literal("SUM(tamount - paid)"), "balanceAmount"],
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

const downloadReport = async (req, res) => {
  try {
    const { dataType, section, areas, day, fromDate, toDate } = req.body;

    if (!dataType || !fromDate || !toDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* ======================================================
       1️⃣ CUSTOMER DATA → EXCEL
    ====================================================== */
    if (dataType === "Customer Data") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Customers");
      sheet.columns = [
      { header: "S.No", key: "sno", width: 8 },
      { header: "Loan ID", key: "loanId", width: 36 },
      { header: "Section", key: "section", width: 12 },
      { header: "Area", key: "area", width: 12 },
      { header: "Day", key: "day", width: 12 },
      { header: "Name", key: "name", width: 20 },
      { header: "Address", key: "address", width: 25 },
      { header: "Phone", key: "phoneNumber", width: 15 },
      { header: "Alt Phone", key: "alternativeNumber", width: 15 },
      { header: "Work", key: "work", width: 15 },
      { header: "H/O / W/O", key: "houseWifeOrSonOf", width: 18 },
      { header: "Refer Name", key: "referName", width: 18 },
      { header: "Refer Number", key: "referNumber", width: 18 },
      { header: "Given Amount", key: "givenAmount", width: 15 },
      { header: "Paid", key: "paid", width: 12 },
      { header: "Interest %", key: "interestPercent", width: 12 },
      { header: "Interest", key: "interest", width: 12 },
      { header: "Total Amount", key: "tamount", width: 15 },
      { header: "Given Date", key: "givenDate", width: 15 },
      { header: "Last Date", key: "lastDate", width: 15 },
      { header: "Additional Info", key: "additionalInfo", width: 25 },
      { header: "Verified By", key: "verifiedBy", width: 15 },
      { header: "Verified No", key: "verifiedByNo", width: 15 },
    ];

      const where = {
        givenDate: { [Op.between]: [fromDate, toDate] },
      };

      if (section) where.section = section;
      if (areas?.length) where.area = { [Op.in]: areas };
      if (section === "Weekly" && day) where.day = day;

      const users = await LoanUser.findAll({ where });

      users.forEach((u, i) => sheet.addRow({ sno: i + 1, ...u.toJSON() }));

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=customers_${Date.now()}.xlsx`
      );
      await workbook.xlsx.write(res);
      return res.end();
    }

    /* ======================================================
       2️⃣ COLLECTION DATA → EXCEL
    ====================================================== */
    if (dataType === "Collection") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Collections");

      sheet.columns = [
        { header: "Customer Name", key: "name", width: 20 },
        { header: "Area", key: "area", width: 12 },
        { header: "Section", key: "section", width: 12 },
        { header: "Paid Amount", key: "amount", width: 15 },
        { header: "Collection Date", key: "date", width: 15 },
      ];

      const users = await LoanUser.findAll({
        where: {
          ...(section && { section }),
          ...(areas?.length && { area: { [Op.in]: areas } }),
          ...(section === "Weekly" && day && { day }),
        },
      });

      for (const user of users) {
        const collections = await LoanTable.findAll({
          where: {
            loanId: user.loanId,
            date: { [Op.between]: [fromDate, toDate] },
          },
        });

        collections.forEach((c) => {
          sheet.addRow({
            name: user.name,
            area: user.area,
            section: user.section,
            amount: c.amount,
            date: c.date,
          });
        });
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=collections_${Date.now()}.xlsx`
      );
      await workbook.xlsx.write(res);
      return res.end();
    }

    /* ======================================================
       3️⃣ FULL DATA → PDF (USER → TABLE)
    ====================================================== */
    if (dataType === "Full Data") {
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=full_report_${Date.now()}.pdf`
      );

      doc.pipe(res);

      const users = await LoanUser.findAll({
        where: {
          ...(section && { section }),
          ...(areas?.length && { area: { [Op.in]: areas } }),
          ...(section === "Weekly" && day && { day }),
        },
      });

      for (const user of users) {
        doc.fontSize(14).text(`Customer: ${user.name}`, { underline: true });
        doc.fontSize(10).text(`
Area: ${user.area}
Phone: ${user.phoneNumber}
Loan Amount: ${user.givenAmount}
Interest: ${user.interest}
Total: ${user.tamount}
        `);

        doc.moveDown(0.5);
        doc.text("Collections:", { bold: true });

        const collections = await LoanTable.findAll({
          where: {
            loanId: user.loanId,
            date: { [Op.between]: [fromDate, toDate] },
          },
        });

        if (!collections.length) {
          doc.text("No collection records");
        }

        collections.forEach((c) => {
          doc.text(`• ${c.date} → ₹${c.amount}`);
        });

        doc.addPage();
      }

      doc.end();
      return;
    }

    res.status(400).json({ message: "Invalid dataType" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Report generation failed" });
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
  downloadReport,
};
