import axios from 'axios';
import crypto from 'crypto';

const WOOCOMMERCE_URL = 'https://www.canna-oils.com.au';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

// Validate environment variables
if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
  console.warn('Warning: WooCommerce API credentials not configured');
}

if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
  console.warn('Warning: Mailchimp credentials not configured');
}

// WooCommerce API client
const wooClient = axios.create({
  baseURL: `${WOOCOMMERCE_URL}/wp-json/wc/v3`,
  auth: {
    username: WOO_CONSUMER_KEY,
    password: WOO_CONSUMER_SECRET,
  },
});

// Mailchimp API client - datacenter is extracted from API key (e.g. key-us17 -> us17)
const MAILCHIMP_DC = MAILCHIMP_API_KEY ? MAILCHIMP_API_KEY.split('-').pop() : 'us17';
const mailchimpClient = axios.create({
  baseURL: `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0`,
  headers: {
    Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
  },
});

/**
 * Create an order in WooCommerce
 */
async function createWooCommerceOrder(orderData) {
  try {
    const response = await wooClient.post('/orders', {
      payment_method: orderData.paymentMethod === 'paypal' ? 'paypal' : 'square',
      payment_method_title: orderData.paymentMethod === 'paypal' ? 'PayPal' : 'Credit/Debit Card (Square)',
      set_paid: false,
      billing: {
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        email: orderData.email,
        phone: orderData.phone || '',
        address_1: orderData.address,
        city: orderData.city,
        state: orderData.state,
        postcode: orderData.postcode,
        country: 'AU',
      },
      shipping: {
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        address_1: orderData.address,
        city: orderData.city,
        state: orderData.state,
        postcode: orderData.postcode,
        country: 'AU',
      },
      line_items: [
        {
          product_id: 11748,
          quantity: orderData.quantity || 1,
          total: orderData.amount,
        },
      ],
      shipping_lines: [
        {
          method_id: 'free_shipping',
          method_title: 'Free Shipping',
          total: '0',
        },
      ],
    });

    return response.data;
  } catch (error) {
    console.error('WooCommerce API Error:', error.response?.data || error.message);
    throw new Error(`WooCommerce Error: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Add customer to Mailchimp list
 */
async function addToMailchimp(customerData) {
  try {
    const subscriberHash = crypto
      .createHash('md5')
      .update(customerData.email.toLowerCase())
      .digest('hex');

    const response = await mailchimpClient.put(
      `/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        email_address: customerData.email,
        status_if_new: 'subscribed',
        status: 'subscribed',
        merge_fields: {
          FNAME: customerData.firstName,
          LNAME: customerData.lastName,
          PHONE: customerData.phone || '',
        },
        tags: ['wellness-revival-customer', 'landing-page-purchase'],
      }
    );

    return response.data;
  } catch (error) {
    console.error('Mailchimp API Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main handler for processing orders
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, address, city, state, postcode, paymentMethod, amount, quantity } = req.body;

    if (!firstName || !lastName || !email || !paymentMethod || !address || !city || !state || !postcode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const wooOrder = await createWooCommerceOrder({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      postcode,
      paymentMethod,
      amount,
      quantity,
    });

    await addToMailchimp({
      firstName,
      lastName,
      email,
      phone,
    });

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      orderId: wooOrder.id,
      orderNumber: wooOrder.number,
    });
  } catch (error) {
    console.error('Order Processing Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process order',
    });
  }
}
