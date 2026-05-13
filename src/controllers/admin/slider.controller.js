const Slider = require('../../models/slider.model');
const { success, error } = require('../../helpers/response.helper');

// ─── Admin Web ────────────────────────────────────────────────────────────────

const sliders = async (req, res) => {
  try {
    const all = await Slider.findAll({ order: [['sort_order', 'ASC'], ['created_at', 'DESC']] });
    res.render('admin/sliders', {
      title: 'Sliders', page: 'sliders', sliders: all,
      adminName: req.session.adminName,
      success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createSlider = async (req, res) => {
  try {
    const image = req.file?.filename;
    if (!image) { req.flash('error', 'Image is required'); return res.redirect('/admin/sliders'); }
    const { title, subtitle, type, link, sort_order, is_active } = req.body;
    await Slider.create({ title, subtitle, image, type, link, sort_order: sort_order || 0, is_active: is_active === '1' });
    req.flash('success', 'Slider created');
    res.redirect('/admin/sliders');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/sliders'); }
};

const updateSlider = async (req, res) => {
  try {
    const slider = await Slider.findByPk(req.params.id);
    if (!slider) { req.flash('error', 'Slider not found'); return res.redirect('/admin/sliders'); }
    const image = req.file?.filename;
    const { title, subtitle, type, link, sort_order, is_active } = req.body;
    await slider.update({
      title, subtitle, type, link,
      sort_order: sort_order || 0,
      is_active: is_active === '1',
      ...(image && { image }),
    });
    req.flash('success', 'Slider updated');
    res.redirect('/admin/sliders');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/sliders'); }
};

const deleteSlider = async (req, res) => {
  try {
    await Slider.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Slider deleted');
    res.redirect('/admin/sliders');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/sliders'); }
};

// ─── API (User & Vendor) ──────────────────────────────────────────────────────

const getSliders = async (req, res) => {
  try {
    const role = req.user.role; // 'user' or 'vendor'
    const sliderList = await Slider.findAll({
      where: { is_active: true, type: ['both', role] },
      attributes: ['id', 'title', 'subtitle', 'image', 'link', 'sort_order'],
      order: [['sort_order', 'ASC']],
    });
    return success(res, sliderList);
  } catch (e) { return error(res, e.message); }
};

module.exports = { sliders, createSlider, updateSlider, deleteSlider, getSliders };
