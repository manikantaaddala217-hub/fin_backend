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

    sNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    section: {
      type: DataTypes.ENUM("Monthly", "Weekly", "Daily", "Intrest"),
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

    phno: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },

    alternativeno: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },

    work: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    h_o_W_o: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    refername: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },

    referno: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
    },

    gamount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    interestPercnt: {
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
// 🔹 HOOKS
//
LoanUser.beforeCreate((loan) => {

  // 🔹 Calculate Day from givenDate
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

  // 🔹 Safe defaults
  const principal = loan.gamount || 0;
  const percent = loan.interestPercnt || 0;

  let interestAmount = 0;

  // 🔹 Interest calculation
  if (loan.section === "Intrest") {
    interestAmount = Math.round(principal * (percent / 100));
    loan.interest = interestAmount;
  }


  loan.tamount = principal + loan.interest;
});

module.exports = LoanUser;
