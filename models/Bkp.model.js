const { DataTypes } = require('sequelize');
const sequelize = require('../DB_Connection/db.con');

const BkpModel = sequelize.define(
  'BkpModel',
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

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    area: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: 'bkp_table',
    timestamps: false,
  }
);

module.exports = BkpModel;
