const { DataTypes } = require('sequelize');
const sequelize = require('../DB_Connection/db.con');

const CfModel = sequelize.define(
  'CfModel',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },

    sNo: {
      type: DataTypes.INTEGER,
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
    tableName: 'cf_table',
    timestamps: false,
  }
);

module.exports = CfModel;
