const { DataTypes } = require("sequelize");
const sequelize = require('../DB_Connection/db.con')

const Users = sequelize.define("Users", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(25),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phoneNo: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  linesHandle: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  role: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: "subadmin"
  }
}, {
  tableName: "users",
  timestamps: true
});

module.exports = Users;
