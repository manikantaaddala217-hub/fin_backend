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
    const { loanId, sno, section, ...updateFields } = req.body;

    if (!loanId || sno === undefined || !section) {
      return res.status(400).json({
        success: false,
        message: "loanId, sno, and section are required",
      });
    }

    // 🔹 Find record with SAME loanId + sno + section
    const exactMatch = await LoanUser.findOne({
      where: { loanId },
    });

    // 🔹 Check if sno already exists for same loanId but DIFFERENT section
    const snoConflict = await LoanUser.findOne({
      where: {
        sno,
        section
      },
    });

    if (exactMatch.loanId !== snoConflict.loanId) {
      return res.status(400).json({
        success: false,
        message: "S.No already allocated for another section",
      });
    }

    if (!exactMatch) {
      return res.status(404).json({
        success: false,
        message: "Loan record not found for given loanId, sno and section",
      });
    }

    // Helper to safely convert numbers
    const safeNum = (val, fallback) => {
      if (val === undefined || val === null || val === "") return fallback;
      const num = Number(val);
      return isNaN(num) ? fallback : num;
    };

    const givenAmount = safeNum(
      updateFields.givenAmount,
      exactMatch.givenAmount
    );

    const interestPercent = safeNum(
      updateFields.interestPercent,
      exactMatch.interestPercent || 0
    );

    let interest = safeNum(
      updateFields.interest,
      exactMatch.interest || 0
    );

    // 🔥 Calculate interest only for Interest section
    if (section === "Interest") {
      interest = Math.round((givenAmount * interestPercent) / 100);
    }

    const tamount = givenAmount + interest;

    const finalUpdateData = {
      ...updateFields,
      givenAmount,
      interest,
      interestPercent,
      tamount,
    };

    // 🔹 Update using loanId + sno + section
    await LoanUser.update(finalUpdateData, {
      where: { loanId, sno, section },
    });

    const updatedLoan = await LoanUser.findOne({
      where: { loanId, sno, section },
    });

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("Update Loan Error:", error);
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
        { header: "Loan ID", key: "loanId", width: 30 },
        { header: "Section", key: "section", width: 12 },
        { header: "Area", key: "area", width: 12 },
        { header: "Day", key: "day", width: 10 },
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
        { header: "Pending", key: "pending", width: 12 },
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

      let totalGiven = 0,
        totalPaid = 0,
        totalAmount = 0;

      users.forEach((u) => {
        const paid = Number(u.paid || 0);
        const total = Number(u.tamount || 0);

        totalGiven += Number(u.givenAmount || 0);
        totalPaid += paid;
        totalAmount += total;

        sheet.addRow({
          ...u.toJSON(),
          pending: total - paid,
        });
      });

      const totalRow = sheet.addRow({
        name: "TOTAL",
        givenAmount: totalGiven,
        paid: totalPaid,
        pending: totalAmount - totalPaid,
        tamount: totalAmount,
      });
      totalRow.font = { bold: true };

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
        { header: "S.No", key: "sno", width: 8 },
        { header: "Name", key: "name", width: 20 },
        { header: "Date", key: "date", width: 15 },
        { header: "Amount", key: "amount", width: 15 },
      ];

      const collections = await LoanTable.findAll({
        where: { date: { [Op.between]: [fromDate, toDate] } },
        order: [["date", "ASC"]],
      });

      const loanIds = [...new Set(collections.map((c) => c.loanId))];

      const users = await LoanUser.findAll({
        where: { loanId: { [Op.in]: loanIds } },
        attributes: ["loanId", "name", "sno"],
      });

      const userMap = {};
      users.forEach((u) => (userMap[u.loanId] = u));

      let totalAmount = 0;

      collections.forEach((c) => {
        totalAmount += Number(c.amount || 0);
        sheet.addRow({
          sno: userMap[c.loanId]?.sno,
          name: userMap[c.loanId]?.name,
          date: c.date,
          amount: c.amount,
        });
      });

      const totalRow = sheet.addRow({
        name: "TOTAL",
        amount: totalAmount,
      });
      totalRow.font = { bold: true };

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=collections_${Date.now()}.xlsx`
      );
      await workbook.xlsx.write(res);
      return res.end();
    }

    /* ======================================================
       3️⃣ FULL DATA → PDF (ALL CUSTOMER FIELDS + COLLECTION TABLE)
    ====================================================== */
    if (dataType === "Full Data") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=full_report_${Date.now()}.pdf`
      );

      doc.pipe(res);

      doc.fontSize(16).font("Helvetica-Bold")
        .text("Full Customer Loan Report", { align: "center" });
      doc.moveDown(1);

      const users = await LoanUser.findAll({
        where: {
          givenDate: { [Op.between]: [fromDate, toDate] },
          ...(section && { section }),
          ...(areas?.length && { area: { [Op.in]: areas } }),
          ...(section === "Weekly" && day && { day }),
        },
        order: [["givenDate", "ASC"]],
      });

      for (const u of users) {
        const paid = Number(u.paid || 0);
        const total = Number(u.tamount || 0);
        const pending = total - paid;

        /* -------- CUSTOMER DETAILS -------- */
        doc.fontSize(12).font("Helvetica-Bold")
          .text(`Customer : ${u.name} (S.No: ${u.sno})`);
        doc.moveDown(0.3);

        doc.fontSize(9).font("Helvetica");

        const fields = [
          ["Loan ID", u.loanId], ["Section", u.section],
          ["Area", u.area], ["Day", u.day],
          ["Address", u.address], ["Phone", u.phoneNumber],
          ["Alt Phone", u.alternativeNumber], ["Work", u.work],
          ["H/O / W/O", u.houseWifeOrSonOf],
          ["Refer Name", u.referName],
          ["Refer Number", u.referNumber],
          ["Given Amount", u.givenAmount],
          ["Paid", paid], ["Pending", pending],
          ["Interest %", u.interestPercent],
          ["Interest", u.interest],
          ["Total Amount", total],
          ["Given Date", u.givenDate],
          ["Last Date", u.lastDate],
          ["Additional Info", u.additionalInfo],
          ["Verified By", u.verifiedBy],
          ["Verified No", u.verifiedByNo],
        ];

        fields.forEach((f, i) => {
          const x = i % 2 === 0 ? 40 : 300;
          doc.text(`${f[0]} : ${f[1] || "-"}`, x);
          if (i % 2 !== 0) doc.moveDown(0.2);
        });

        doc.moveDown(0.5);

        /* -------- COLLECTION TABLE -------- */
        doc.font("Helvetica-Bold").fontSize(10).text("Collections");

        const tableTop = doc.y + 5;
        const colX = [40, 120, 260];
        const rowHeight = 18;

        // Header
        doc
          .rect(colX[0], tableTop, 60, rowHeight).stroke()
          .rect(colX[1], tableTop, 140, rowHeight).stroke()
          .rect(colX[2], tableTop, 100, rowHeight).stroke();

        doc.text("S.No", colX[0] + 5, tableTop + 5);
        doc.text("Date", colX[1] + 5, tableTop + 5);
        doc.text("Amount", colX[2] + 5, tableTop + 5);

        let y = tableTop + rowHeight;
        let sno = 1;
        let totalCollected = 0;

        const collections = await LoanTable.findAll({
          where: { loanId: u.loanId },
          order: [["date", "ASC"]],
        });

        if (!collections.length) {
          doc.text("No collection records", colX[0] + 5, y + 5);
          y += rowHeight;
        } else {
          collections.forEach(c => {
            totalCollected += Number(c.amount || 0);

            doc
              .rect(colX[0], y, 60, rowHeight).stroke()
              .rect(colX[1], y, 140, rowHeight).stroke()
              .rect(colX[2], y, 100, rowHeight).stroke();

            doc.text(sno++, colX[0] + 5, y + 5);
            doc.text(c.date, colX[1] + 5, y + 5);
            doc.text(`₹${c.amount}`, colX[2] + 5, y + 5);

            y += rowHeight;

            // Page break safety
            if (y > 750) {
              doc.addPage();
              y = 50;
            }
          });
        }

        // Total Row
        doc.font("Helvetica-Bold");
        doc.text(`Total Collected : ₹${totalCollected}`, colX[2], y + 10);

        // Divider between customers
        doc.moveDown(2);
        doc.moveTo(30, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(1);
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
