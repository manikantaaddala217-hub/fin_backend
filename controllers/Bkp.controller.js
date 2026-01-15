const BkpModel = require('../models/Bkp.model');

const saveBkp = async (req, res, next) => {
  try {
    const { sNo, name, amount, area } = req.body;

    if (sNo === undefined || !name || amount === undefined || !area) {
      return res.status(400).json({
        success: false,
        message: 'sNo, name, amount, area are required',
      });
    }

    const entry = await BkpModel.create({ sNo, name, amount, area });

    return res.status(201).json({
      success: true,
      message: 'BKP entry saved successfully',
      data: entry,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBkp = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required (use /bkp/delete/:id or /bkp/delete?id=UUID)' });
    }

    const record = await BkpModel.findByPk(id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'BKP entry not found' });
    }

    await record.destroy();

    return res.status(200).json({ success: true, message: 'BKP entry deleted' });
  } catch (err) {
    next(err);
  }
};

const getAllBkp = async (req, res, next) => {
  try {
    const rows = await BkpModel.findAll({
      order: [['sNo', 'ASC']]
    });
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveBkp, deleteBkp, getAllBkp };


