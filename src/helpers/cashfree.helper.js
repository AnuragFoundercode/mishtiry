const { Cashfree, CFEnvironment } = require('cashfree-pg');
require('dotenv').config();

// In cashfree-pg v6, constructor: Cashfree(XEnvironment, XClientId, XClientSecret)
const cashfree = new Cashfree(
  process.env.NODE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

/**
 * Create a Cashfree order
 */
const createCashfreeOrder = async ({ orderId, amount, customerName, customerPhone, customerEmail, returnUrl }) => {
  const request = {
    order_id: orderId,
    order_amount: parseFloat(amount).toFixed(2),
    order_currency: 'INR',
    customer_details: {
      customer_id: `cust_${orderId}`,
      customer_name: customerName || 'Customer',
      customer_phone: customerPhone,
      customer_email: customerEmail || `${customerPhone}@mistry.app`,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: process.env.CASHFREE_WEBHOOK_URL || '',
    },
  };

  const response = await cashfree.PGCreateOrder(request);
  return response.data;
};

/**
 * Verify Cashfree payment by cf_order_id
 */
const verifyCashfreePayment = async (cfOrderId) => {
  const response = await cashfree.PGFetchOrder(cfOrderId);
  return response.data;
};

module.exports = { createCashfreeOrder, verifyCashfreePayment };
