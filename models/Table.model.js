const { DataTypes } = require("sequelize");
const sequelize = require("../DB_Connection/db.con");

const LoanTable = sequelize.define(
  "LoanTable",
  {
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "loan_table",
    timestamps: false,
  }
);

module.exports = LoanTable;
