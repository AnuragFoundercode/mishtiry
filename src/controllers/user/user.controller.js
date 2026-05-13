const User = require('../../models/user.model');
const Category = require('../../models/category.model');
const Service = require('../../models/service.model');
const Vendor = require('../../models/vendor.model');
const { success, error } = require('../../helpers/response.helper');
const { Op } = require('sequelize');

// ─── Profile Update ───────────────────────────────────────────────────────────
// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, fcm_token } = req.body;
    const profile_image = req.file?.filename;

    const user = await User.findByPk(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    await user.update({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(fcm_token !== undefined && { fcm_token }),
      ...(profile_image && { profile_image }),
    });

    return success(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profile_image: user.profile_image,
      role: user.role,
    }, 'Profile updated successfully');
  } catch (e) { return error(res, e.message); }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'mobile', 'profile_image', 'role', 'created_at'],
    });
    return success(res, user);
  } catch (e) { return error(res, e.message); }
};

// ─── Categories ───────────────────────────────────────────────────────────────
// GET /api/user/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true, parent_id: null },
      attributes: ['id', 'name', 'image'],
      include: [{
        model: Category,
        as: 'subcategories',
        where: { is_active: true },
        attributes: ['id', 'name', 'image'],
        required: false,
      }],
      order: [['name', 'ASC']],
    });
    return success(res, categories);
  } catch (e) { return error(res, e.message); }
};

// ─── Services by Category ─────────────────────────────────────────────────────
// GET /api/user/categories/:id/services
const getServicesByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const category = await Category.findOne({ where: { id, is_active: true } });
    if (!category) return error(res, 'Category not found', 404);

    const { count, rows } = await Service.findAndCountAll({
      where: { category_id: id, is_active: true },
      attributes: ['id', 'name', 'description', 'price', 'estimated_time', 'images'],
      include: [{
        model: Vendor,
        attributes: ['id', 'business_name', 'address', 'avg_rating', 'total_reviews', 'logo'],
        where: { is_approved: true, is_suspended: false },
        required: true,
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return success(res, {
      category: { id: category.id, name: category.name, image: category.image },
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      services: rows,
    });
  } catch (e) { return error(res, e.message); }
};

module.exports = { updateProfile, getProfile, getCategories, getServicesByCategory };
