const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/user.model');
const Vendor = require('../../models/vendor.model');
const VendorKyc = require('../../models/vendor_kyc.model');
const VendorBankDetail = require('../../models/vendor_bank_detail.model');
const Booking = require('../../models/booking.model');
const Category = require('../../models/category.model');
const Service = require('../../models/service.model');
const Notification = require('../../models/notification.model');
const Policy = require('../../models/policy.model');
const Zone = require('../../models/zone.model');
const PlatformSetting = require('../../models/platform_setting.model');
const { SubscriptionPlan, VendorSubscription } = require('../../models/subscription.model');
const { sendEmailNotification } = require('../../helpers/notification.helper');
const { getSettings } = require('../../helpers/pricing.helper');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');

// ─── Zones ────────────────────────────────────────────────────────────────────

const zones = async (req, res) => {
  try {
    const allZones = await Zone.findAll({ order: [['created_at', 'DESC']] });
    const zonesData = allZones.map(z => ({
      ...z.toJSON(),
      coordinates: typeof z.coordinates === 'string' ? JSON.parse(z.coordinates) : (z.coordinates || [])
    }));
    res.render('admin/zones', { title: 'Zones', page: 'zones', zones: zonesData, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createZone = async (req, res) => {
  try {
    const { name, coordinates, color, is_active } = req.body;
    let coords = coordinates;
    
    if (typeof coordinates === 'string') {
      try { coords = JSON.parse(coordinates); }
      catch { req.flash('error', 'Invalid coordinates format'); return res.redirect('/admin/zones'); }
    }
    
    if (!Array.isArray(coords) || coords.length < 3) {
      req.flash('error', 'Minimum 3 markers required');
      return res.redirect('/admin/zones');
    }
    
    await Zone.create({ 
      name, 
      coordinates: coords, 
      color: color || '#6c47ff', 
      is_active: is_active === '1' 
    });
    
    req.flash('success', 'Zone created');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

const updateZone = async (req, res) => {
  try {
    const { name, coordinates, color, is_active } = req.body;
    let coords = coordinates;
    
    if (typeof coordinates === 'string') {
      try { coords = JSON.parse(coordinates); }
      catch { req.flash('error', 'Invalid coordinates format'); return res.redirect('/admin/zones'); }
    }
    
    if (coords && (!Array.isArray(coords) || coords.length < 3)) {
      req.flash('error', 'Minimum 3 markers required');
      return res.redirect('/admin/zones');
    }
    
    await Zone.update({ 
      name, 
      coordinates: coords, 
      color, 
      is_active: is_active === '1' 
    }, { where: { id: req.params.id } });
    
    req.flash('success', 'Zone updated');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

const deleteZone = async (req, res) => {
  try {
    await Zone.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Zone deleted');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

module.exports = {
  zones, createZone, updateZone, deleteZone,
};
