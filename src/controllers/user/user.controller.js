const User = require('../../models/user.model');
const Category = require('../../models/category.model');
const Service = require('../../models/service.model');
const Booking = require('../../models/booking.model');
const Slot = require('../../models/slot.model');
const Policy = require('../../models/policy.model');
const AppSetting = require('../../models/app_setting.model');
const Testimonial = require('../../models/testimonial.model');
const sequelize = require('../../config/database');
const { success, error } = require('../../helpers/response.helper');

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'mobile', 'profile_image', 'role', 'created_at'],
    });
    return success(res, user);
  } catch (e) { return error(res, e.message); }
};

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
    return success(res, { id: user.id, name: user.name, email: user.email, mobile: user.mobile, profile_image: user.profile_image }, 'Profile updated');
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true, parent_id: null },
      attributes: ['id', 'name', 'image'],
      include: [{
        model: Category, as: 'subcategories',
        where: { is_active: true }, attributes: ['id', 'name', 'image'], required: false,
      }],
      order: [['name', 'ASC']],
    });
    return success(res, categories);
  } catch (e) { return error(res, e.message); }
};

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
      attributes: ['id', 'name', 'description', 'price', 'discount_percent', 'final_price', 'rating', 'rating_count', 'faqs', 'includes', 'how_its_done', 'does_not_include', 'estimated_time', 'images'],
      limit: parseInt(limit), offset: parseInt(offset),
      order: [['name', 'ASC']],
    });

    return success(res, {
      category: { id: category.id, name: category.name, image: category.image },
      total: count, page: parseInt(page), pages: Math.ceil(count / limit),
      services: rows,
    });
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/services/:id
const getServiceDetail = async (req, res) => {
  try {
    const service = await Service.findOne({
      where: { id: req.params.id, is_active: true },
      attributes: ['id', 'name', 'description', 'price', 'discount_percent', 'final_price', 'rating', 'rating_count', 'faqs', 'includes', 'how_its_done', 'does_not_include', 'estimated_time', 'images'],
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);
    return success(res, { service });
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/services/popular
const getPopularServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      attributes: {
        include: [
          [
            sequelize.literal(`(SELECT COUNT(*) FROM bookings WHERE bookings.service_id = Service.id)`),
            'booking_count',
          ],
        ],
      },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [
        [sequelize.literal('booking_count'), 'DESC'],
        ['rating', 'DESC'],
      ],
      limit: 10,
    });

    return success(res, services);
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/slots?date=2025-06-01
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return error(res, 'date query param is required', 400);

    const slots = await Slot.findAll({
      where: { date, is_active: true },
      attributes: {
        include: [
          [
            sequelize.literal(`(SELECT COUNT(*) FROM bookings WHERE bookings.slot_id = Slot.id)`),
            'current_bookings',
          ],
        ],
      },
      order: [['start_time', 'ASC']],
    });

    // Filter out fully booked slots
    const available = slots
      .map((s) => s.toJSON())
      .filter((s) => s.current_bookings < s.max_bookings);

    return success(res, available);
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/policies
const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'slug','icon'],
      order: [['title', 'ASC']],
    });
    return success(res, { policies });
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/policies/:slug
const getPolicyBySlug = async (req, res) => {
  try {
    const policy = await Policy.findOne({
      where: { slug: req.params.slug, is_active: true },
      attributes: ['id', 'title', 'slug', 'content', 'updated_at'],
    });
    if (!policy) return error(res, 'Policy not found', 404);
    return success(res, { policy });
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/support
const getSupport = async (req, res) => {
  try {
    let settings = await AppSetting.findOne({ order: [['id', 'ASC']] });
    if (!settings) settings = await AppSetting.create({});
    return success(res, {
      support: {
        phone: settings.support_phone,
        email: settings.support_email,
        help_email: settings.help_email,
        careers_email: settings.careers_email,
      },
      business: {
        country: settings.country,
        gst_number: settings.gst_number,
        address: settings.business_address,
      },
      social: {
        facebook: settings.facebook_url,
        instagram: settings.instagram_url,
        twitter: settings.twitter_url,
        youtube: settings.youtube_url,
        linkedin: settings.linkedin_url,
        whatsapp: settings.whatsapp_number,
      },
      app_links: {
        play_store: settings.play_store_url,
        app_store: settings.app_store_url,
        website: settings.website_url,
      },
    });
  } catch (e) { return error(res, e.message); }
};

// GET /api/user/testimonials
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'designation', 'image', 'rating', 'message'],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    });
    return success(res, { testimonials });
  } catch (e) { return error(res, e.message); }
};

module.exports = { updateProfile, getProfile, getCategories, getServicesByCategory, getServiceDetail, getPopularServices, getAvailableSlots, getPolicies, getPolicyBySlug, getSupport, getTestimonials };
