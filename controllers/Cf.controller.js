const CfModel = require('../models/Cf.model');

const saveCf = async (req, res) => {
  try {
    const { sNo, date, amount } = req.body;

    if (sNo === undefined || !date || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'sNo, date and amount are required',
      });
    }

    const entry = await CfModel.create({ sNo, date, amount });

    return res.status(201).json({
      success: true,
      message: 'CF entry saved successfully',
      data: entry,
    });
  } catch (err) {
    console.error('Save CF Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save CF entry',
      error: err.message,
    });
  }
};

const clearCf = async (req, res) => {
  try {
    await CfModel.destroy({ where: {}, truncate: true });

    return res.status(200).json({
      success: true,
      message: 'All CF entries cleared',
    });
  } catch (err) {
    console.error('Clear CF Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear CF entries',
      error: err.message,
    });
  }
};

// optional helper to get all CF entries (useful for testing)
const getAllCf = async (req, res) => {
  try {
    const rows = await CfModel.findAll();
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Get All CF Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch CF entries', error: err.message });
  }
};

module.exports = { saveCf, clearCf, getAllCf };