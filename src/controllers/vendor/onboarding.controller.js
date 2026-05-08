const Vendor = require('../../models/vendor.model');
const VendorKyc = require('../../models/vendor_kyc.model');
const VendorBankDetail = require('../../models/vendor_bank_detail.model');
const { success, error } = require('../../helpers/response.helper');

const getVendor = (userId) => Vendor.findOne({ where: { user_id: userId } });

// ─── GET onboarding status ────────────────────────────────────────────────────
// GET /api/vendor/onboarding/status
const getOnboardingStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { user_id: req.user.id },
      include: [
        { model: VendorKyc, attributes: ['aadhaar_number', 'pan_number', 'gst_number'] },
        { model: VendorBankDetail, attributes: ['account_holder_name', 'bank_name', 'ifsc_code', 'upi_id'] },
      ],
    });

    if (!vendor) return success(res, { onboarding_step: 'profile', steps_completed: { profile: false, kyc: false, bank: false } });

    const hasKyc = !!(await VendorKyc.findOne({ where: { vendor_id: vendor.id } }));
    const hasBank = !!(await VendorBankDetail.findOne({ where: { vendor_id: vendor.id } }));

    return success(res, {
      vendor,
      kyc_status: vendor.kyc_status,
      kyc_rejection_reason: vendor.kyc_rejection_reason,
      is_approved: vendor.is_approved,
      is_suspended: vendor.is_suspended,
      steps_completed: { profile: !!vendor.business_name, kyc: hasKyc, bank: hasBank },
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── Step 1: Save/Update business profile ────────────────────────────────────
// POST /api/vendor/onboarding/profile
// Body (multipart): business_name, description, address, latitude, longitude, working_hours (JSON string)
// Files: logo (optional), banner (optional)
const saveProfile = async (req, res) => {
  try {
    const { business_name, description, address, latitude, longitude, working_hours } = req.body;
    if (!business_name) return error(res, 'Business name is required', 400);

    const logo = req.files?.logo?.[0]?.filename || null;
    const banner = req.files?.banner?.[0]?.filename || null;

    let parsedHours = null;
    if (working_hours) {
      try { parsedHours = typeof working_hours === 'string' ? JSON.parse(working_hours) : working_hours; }
      catch { return error(res, 'working_hours must be valid JSON', 400); }
    }

    let vendor = await getVendor(req.user.id);
    if (vendor) {
      await vendor.update({
        business_name, description, address, latitude, longitude,
        ...(parsedHours && { working_hours: parsedHours }),
        ...(logo && { logo }),
        ...(banner && { banner }),
      });
    } else {
      vendor = await Vendor.create({
        user_id: req.user.id,
        business_name, description, address, latitude, longitude,
        working_hours: parsedHours, logo, banner,
      });
    }

    return success(res, {
      vendor_id: vendor.id,
      business_name: vendor.business_name,
      logo: vendor.logo,
      banner: vendor.banner,
    }, 'Profile saved successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/vendor/onboarding/profile
const getProfile = async (req, res) => {
  try {
    const vendor = await getVendor(req.user.id);
    if (!vendor) return error(res, 'Profile not found', 404);
    return success(res, { vendor });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── Step 2: Save/Update KYC documents ───────────────────────────────────────
// POST /api/vendor/onboarding/kyc
// Body: aadhaar_number, pan_number, gst_number (optional)
// Files: aadhaar_front, aadhaar_back, pan_document, gst_document (optional), selfie
const saveKyc = async (req, res) => {
  try {
    const vendor = await getVendor(req.user.id);
    if (!vendor) return error(res, 'Complete business profile first', 400);

    const { aadhaar_number, pan_number, gst_number } = req.body;
    if (!aadhaar_number || !pan_number) return error(res, 'Aadhaar and PAN number required', 400);

    const files = req.files || {};
    const docFields = {};
    if (files.aadhaar_front?.[0]) docFields.aadhaar_front = files.aadhaar_front[0].filename;
    if (files.aadhaar_back?.[0]) docFields.aadhaar_back = files.aadhaar_back[0].filename;
    if (files.pan_document?.[0]) docFields.pan_document = files.pan_document[0].filename;
    if (files.gst_document?.[0]) docFields.gst_document = files.gst_document[0].filename;
    if (files.selfie?.[0]) docFields.selfie = files.selfie[0].filename;

    const existing = await VendorKyc.findOne({ where: { vendor_id: vendor.id } });
    if (existing) {
      await existing.update({ aadhaar_number, pan_number, gst_number: gst_number || null, ...docFields });
    } else {
      await VendorKyc.create({ vendor_id: vendor.id, aadhaar_number, pan_number, gst_number: gst_number || null, ...docFields });
    }

    // Move to under_review only if was pending
    if (vendor.kyc_status === 'pending' || vendor.kyc_status === 'rejected') {
      await vendor.update({ kyc_status: 'under_review', kyc_rejection_reason: null });
    }

    return success(res, { kyc_status: vendor.kyc_status === 'approved' ? 'approved' : 'under_review' }, 'KYC documents submitted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/vendor/onboarding/kyc
const getKyc = async (req, res) => {
  try {
    const vendor = await getVendor(req.user.id);
    if (!vendor) return error(res, 'Profile not found', 404);
    const kyc = await VendorKyc.findOne({ where: { vendor_id: vendor.id } });
    return success(res, {
      kyc: kyc || null,
      kyc_status: vendor.kyc_status,
      kyc_rejection_reason: vendor.kyc_rejection_reason,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── Step 3: Save/Update bank details ────────────────────────────────────────
// POST /api/vendor/onboarding/bank
// Body: account_holder_name, account_number, ifsc_code, bank_name, branch_name, upi_id (optional)
// File: passbook_image (optional)
const saveBankDetails = async (req, res) => {
  try {
    const vendor = await getVendor(req.user.id);
    if (!vendor) return error(res, 'Complete business profile first', 400);

    const { account_holder_name, account_number, ifsc_code, bank_name, branch_name, upi_id } = req.body;
    if (!account_holder_name || !account_number || !ifsc_code) {
      return error(res, 'Account holder name, account number and IFSC are required', 400);
    }

    const passbook_image = req.file?.filename || null;

    const existing = await VendorBankDetail.findOne({ where: { vendor_id: vendor.id } });
    if (existing) {
      await existing.update({
        account_holder_name, account_number, ifsc_code,
        bank_name: bank_name || null, branch_name: branch_name || null,
        upi_id: upi_id || null,
        ...(passbook_image && { passbook_image }),
      });
    } else {
      await VendorBankDetail.create({
        vendor_id: vendor.id,
        account_holder_name, account_number, ifsc_code,
        bank_name: bank_name || null, branch_name: branch_name || null,
        upi_id: upi_id || null, passbook_image,
      });
    }

    return success(res, {}, 'Bank details saved successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/vendor/onboarding/bank
const getBankDetails = async (req, res) => {
  try {
    const vendor = await getVendor(req.user.id);
    if (!vendor) return error(res, 'Profile not found', 404);
    const bank = await VendorBankDetail.findOne({ where: { vendor_id: vendor.id } });
    // Mask account number for security
    if (bank) {
      const masked = { ...bank.toJSON() };
      masked.account_number = masked.account_number.replace(/.(?=.{4})/g, '*');
      return success(res, { bank: masked });
    }
    return success(res, { bank: null });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getOnboardingStatus, saveProfile, getProfile, saveKyc, getKyc, saveBankDetails, getBankDetails };
