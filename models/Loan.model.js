const { DataTypes } = require("sequelize");
const sequelize = require("../DB_Connection/db.con");

const LoanUser = sequelize.define(
  "LoanUser",
  {
    loanId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    sno: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    section: {
      type: DataTypes.ENUM("Monthly", "Weekly", "Daily", "Interest"),
      allowNull: false,
    },

    area: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    day: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },

    name: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    address: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    phoneNumber: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    alternativeNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },

    work: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    houseWifeOrSonOf: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    referName: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    referNumber: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },

    givenAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    paid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    interestPercent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    interest: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    tamount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    givenDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    lastDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    additionalInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    verifiedBy: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },

    verifiedByNo: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "loan_user",
    timestamps: true,
  }
);

//
// 🔹 COMMON CALCULATION FUNCTION
//
const calculateLoan = (loan) => {
  /* =========================================
     1️⃣ Calculate Day
  ========================================= */
  if (loan.givenDate) {
    const date = new Date(loan.givenDate);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    loan.day = days[date.getDay()];
  }

  /* =========================================
     2️⃣ Safe numeric values
  ========================================= */
  const principal = Number(loan.givenAmount) || 0;
  const percent = Number(loan.interestPercent) || 0;
  let interestAmount = 0;

  /* =========================================
     3️⃣ Interest Logic
  ========================================= */
  if (loan.section === "Interest") {
    // 🔥 Backend calculates interest
    interestAmount = Math.round((principal * percent) / 100);
    loan.interest = interestAmount;
  } else {
    // ✅ Interest comes from frontend
    loan.interest = Number(loan.interest) || 0;
  }

  /* =========================================
     4️⃣ Total Amount
  ========================================= */
  loan.tamount = principal + loan.interest;
};

//
// 🔹 HOOKS
//
LoanUser.beforeCreate(calculateLoan);

// Optional but safe (covers both)
// LoanUser.beforeSave(calculateLoan);

module.exports = LoanUser;



