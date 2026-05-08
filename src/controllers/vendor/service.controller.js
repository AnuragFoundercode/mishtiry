const Service = require('../../models/service.model');
const Category = require('../../models/category.model');
const { SubscriptionPlan, VendorSubscription } = require('../../models/subscription.model');
const Vendor = require('../../models/vendor.model');
const { success, error } = require('../../helpers/response.helper');

// Check vendor service limit based on subscription
const checkServiceLimit = async (vendorId) => {
  const count = await Service.count({ where: { vendor_id: vendorId, is_active: true } });
  const activeSub = await VendorSubscription.findOne({
    where: { vendor_id: vendorId, status: 'active' },
    include: [{ model: SubscriptionPlan }],
  });
  const limit = activeSub?.SubscriptionPlan?.service_limit ?? 5; // default basic limit
  return { count, limit, canAdd: count < limit };
};

// POST /api/vendor/services
const addService = async (req, res) => {
  try {
    const { category_id, name, description, price, estimated_time } = req.body;
    if (!category_id || !name || !price) return error(res, 'category_id, name and price are required', 400);

    const { canAdd, count, limit } = await checkServiceLimit(req.user.vendorId);
    if (!canAdd) return error(res, `Service limit reached (${count}/${limit}). Upgrade your plan.`, 403);

    const images = req.files?.map(f => f.filename) || [];
    const service = await Service.create({
      vendor_id: req.user.vendorId,
      category_id, name, description, price, estimated_time, images,
    });
    return success(res, { service }, 'Service added', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/vendor/services
const getMyServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { vendor_id: req.user.vendorId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    const { count, limit } = await checkServiceLimit(req.user.vendorId);
    return success(res, { services, usage: { used: count, limit } });
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/vendor/services/:id
const getService = async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, vendor_id: req.user.vendorId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);
    return success(res, { service });
  } catch (err) {
    return error(res, err.message);
  }
};

// PUT /api/vendor/services/:id
// Body: category_id, name, description, price, estimated_time
// Files: images[] (optional - replaces existing images if sent)
const updateService = async (req, res) => {
  try {
    const service = await Service.findOne({ where: { id: req.params.id, vendor_id: req.user.vendorId } });
    if (!service) return error(res, 'Service not found', 404);

    const { category_id, name, description, price, estimated_time } = req.body;
    const newImages = req.files?.map(f => f.filename);

    await service.update({
      ...(category_id && { category_id }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(estimated_time !== undefined && { estimated_time }),
      ...(newImages?.length && { images: newImages }),
    });
    return success(res, { service }, 'Service updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// DELETE /api/vendor/services/:id
const deleteService = async (req, res) => {
  try {
    const deleted = await Service.destroy({ where: { id: req.params.id, vendor_id: req.user.vendorId } });
    if (!deleted) return error(res, 'Service not found', 404);
    return success(res, {}, 'Service deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { addService, getMyServices, getService, updateService, deleteService };
