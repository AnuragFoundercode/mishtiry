const { Op } = require('sequelize');
const Slot = require('../../models/slot.model');
const { success, error } = require('../../helpers/response.helper');

/**
 * POST /api/admin/slots
 * Body: { date, start_time, end_time, max_bookings }
 */
const createSlot = async (req, res) => {
  try {
    const { date, start_time, end_time, max_bookings } = req.body;
    if (!date || !start_time || !end_time) {
      return error(res, 'date, start_time and end_time are required', 400);
    }
    const slot = await Slot.create({ date, start_time, end_time, max_bookings });
    return success(res, { slot }, 'Slot created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/slots?date=2025-06-01
 */
const getSlots = async (req, res) => {
  try {
    const where = {};
    if (req.query.date) where.date = req.query.date;
    const slots = await Slot.findAll({ where, order: [['date', 'ASC'], ['start_time', 'ASC']] });
    return success(res, { slots });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/slots/:id
 * Body: { date, start_time, end_time, max_bookings, is_active }
 */
const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.id);
    if (!slot) return error(res, 'Slot not found', 404);
    const { date, start_time, end_time, max_bookings, is_active } = req.body;
    await slot.update({
      ...(date !== undefined && { date }),
      ...(start_time !== undefined && { start_time }),
      ...(end_time !== undefined && { end_time }),
      ...(max_bookings !== undefined && { max_bookings }),
      ...(is_active !== undefined && { is_active }),
    });
    return success(res, { slot }, 'Slot updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * DELETE /api/admin/slots/:id
 */
const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findByPk(req.params.id);
    if (!slot) return error(res, 'Slot not found', 404);
    await slot.destroy();
    return success(res, {}, 'Slot deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { createSlot, getSlots, updateSlot, deleteSlot };
