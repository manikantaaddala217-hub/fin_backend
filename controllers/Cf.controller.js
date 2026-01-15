const CfModel = require('../models/Cf.model');

const saveCf = async (req, res, next) => {
  try {
    const { sNo, date, amount } = req.body;

    if (sNo === undefined || !date || date === "Invalid date" || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'A valid date, sNo and amount are required',
      });
    }

    const entry = await CfModel.create({ sNo, date, amount });

    return res.status(201).json({
      success: true,
      message: 'CF entry saved successfully',
      data: entry,
    });
  } catch (err) {
    next(err);
  }
};

const clearCf = async (req, res, next) => {
  try {
    await CfModel.destroy({ where: {}, truncate: true });

    return res.status(200).json({
      success: true,
      message: 'All CF entries cleared',
    });
  } catch (err) {
    next(err);
  }
};

// optional helper to get all CF entries (useful for testing)
const getAllCf = async (req, res, next) => {
  try {
    const rows = await CfModel.findAll({
      order: [['sNo', 'ASC']]
    });
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveCf, clearCf, getAllCf };