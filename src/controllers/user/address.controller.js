const Address = require('../../models/address.model');
const { success, error } = require('../../helpers/response.helper');

// ─── GET /api/user/addresses ──────────────────────────────────────────────────
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });
    return success(res, { addresses });
  } catch (err) { return error(res, err.message); }
};

// ─── POST /api/user/addresses ─────────────────────────────────────────────────
const createAddress = async (req, res) => {
  try {
    const { label, full_address, landmark, latitude, longitude, city, state, pincode, is_default } = req.body;

    if (!full_address) return error(res, 'full_address is required', 400);

    // If this is set as default, unset other defaults
    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    // If user has no addresses yet, make this the default
    const count = await Address.count({ where: { user_id: req.user.id } });
    const makeDefault = is_default || count === 0;

    const address = await Address.create({
      user_id: req.user.id,
      label: label || 'Home',
      full_address,
      landmark: landmark || null,
      latitude: latitude || null,
      longitude: longitude || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      is_default: makeDefault,
    });

    return success(res, { address }, 'Address saved', 201);
  } catch (err) { return error(res, err.message); }
};

// ─── PUT /api/user/addresses/:id ──────────────────────────────────────────────
const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return error(res, 'Address not found', 404);

    const { label, full_address, landmark, latitude, longitude, city, state, pincode, is_default } = req.body;

    // If setting as default, unset others
    if (is_default) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    await address.update({
      ...(label !== undefined && { label }),
      ...(full_address !== undefined && { full_address }),
      ...(landmark !== undefined && { landmark }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(is_default !== undefined && { is_default }),
    });

    return success(res, { address }, 'Address updated');
  } catch (err) { return error(res, err.message); }
};

// ─── DELETE /api/user/addresses/:id ───────────────────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return error(res, 'Address not found', 404);

    await address.destroy();

    // If deleted address was default, make the most recent one default
    if (address.is_default) {
      const latest = await Address.findOne({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
      });
      if (latest) await latest.update({ is_default: true });
    }

    return success(res, null, 'Address deleted');
  } catch (err) { return error(res, err.message); }
};

// ─── PUT /api/user/addresses/:id/set-default ──────────────────────────────────
const setDefault = async (req, res) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) return error(res, 'Address not found', 404);

    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    await address.update({ is_default: true });

    return success(res, { address }, 'Default address updated');
  } catch (err) { return error(res, err.message); }
};

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefault };
