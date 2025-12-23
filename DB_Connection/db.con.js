require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.db_url, {
  dialect: 'postgres',
  dialectModule: require('pg'),
  logging: false, 
  ssl: true,   
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Connected to Neon PostgreSQL successfully!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

connectDB();

module.exports = sequelize;
