import axios from 'axios';
import crypto from 'crypto';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const PRODUCT_ID = 11748; // Wellness Revival Kit product ID

// Square API client
const squareClient = axios.create({
  baseURL: 'https://connect.squareup.com/v2',
  headers: {
    Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Square-Version': '2024-01-18',
  },
});

// Create WooCommerce order
async function createWooCommerceOrder(customerData, amount, squarePaymentId) {
  try {
    const orderData = {
      payment_method: 'square',
      payment_method_title: 'Credit Card',
      set_paid: true,
      transaction_id: squarePaymentId,
      billing: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        address_1: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postcode: customerData.postcode,
        country: 'AU',
      },
      shipping: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        address_1: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postcode: customerData.postcode,
        country: 'AU',
      },
      line_items: [
        {
          product_id: PRODUCT_ID,
          quantity: customerData.quantity || 1,
        },
      ],
      shipping_lines: [
        {
          method_id: 'free_shipping',
          method_title: 'Free Shipping',
          total: '0',
        },
      ],
    };

    const response = await axios.post(`${WOO_STORE_URL}/orders`, orderData, {
      auth: {
        username: WOO_CONSUMER_KEY,
        password: WOO_CONSUMER_SECRET,
      },
    });

    return response.data;
  } catch (error) {
    console.error('WooCommerce order creation error:', error.response?.data || error.message);
    throw error;
  }
}

// Add customer to Mailchimp
async function addToMailchimp(email, firstName, lastName, phone) {
  try {
    const datacenter = MAILCHIMP_API_KEY.split('-')[1];
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const response = await axios.put(
      `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          PHONE: phone || '',
        },
        tags: ['wellness-revival-customer', 'landing-page-purchase'],
      },
      {
        auth: {
          username: 'anystring',
          password: MAILCHIMP_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    // If subscriber already exists, that's okay
    if (error.response?.status === 400 && error.response?.data?.title === 'Member Exists') {
      console.log('Subscriber already exists in Mailchimp');
      return { status: 'already_exists' };
    }
    console.error('Mailchimp error:', error.response?.data || error.message);
    throw error;
  }
}

// Process payment with Square
async function processSquarePayment(sourceId, amount, customerEmail) {
  try {
    const amountInCents = Math.round(parseFloat(amount) * 100);
    const idempotencyKey = crypto.randomUUID();

    const paymentData = {
      source_id: sourceId,
      amount_money: {
        amount: amountInCents,
        currency: 'AUD',
      },
      location_id: SQUARE_LOCATION_ID,
      idempotency_key: idempotencyKey,
      customer_id: customerEmail, // Use email as customer identifier
      note: `Wellness Revival Kit Purchase - ${customerEmail}`,
    };

    const response = await squareClient.post('/payments', paymentData);

    if (response.data.payment) {
      return {
        success: true,
        paymentId: response.data.payment.id,
        status: response.data.payment.status,
        receiptUrl: response.data.payment.receipt_url,
      };
    } else {
      throw new Error('Payment response missing payment data');
    }
  } catch (error) {
    console.error('Square payment error:', error.response?.data || error.message);
    
    // Extract error message from Square API response
    const errorMessage = error.response?.data?.errors?.[0]?.detail || 
                        error.response?.data?.errors?.[0]?.message ||
                        error.message ||
                        'Payment processing failed';
    
    throw new Error(errorMessage);
  }
}

export default async function handler(req, res) {
  // CORS headers
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
    const { customerData, amount, quantity, sourceId } = req.body;

    // Validate required fields
    if (!customerData || !amount || !sourceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerData, amount, sourceId',
      });
    }

    // Validate customer data
    if (!customerData.firstName || !customerData.lastName || !customerData.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required customer information',
      });
    }

    // Ensure customerData has quantity for order creation
    if (quantity) {
      customerData.quantity = quantity;
    }

    // Process payment with Square
    console.log(`Processing Square payment for ${customerData.email}, amount: $${amount}`);
    const paymentResult = await processSquarePayment(sourceId, amount, customerData.email);

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment processing failed',
      });
    }

    // Create WooCommerce order
    console.log(`Creating WooCommerce order for payment ${paymentResult.paymentId}`);
    const wooOrder = await createWooCommerceOrder(customerData, amount, paymentResult.paymentId);

    // Add customer to Mailchimp
    console.log(`Adding customer ${customerData.email} to Mailchimp`);
    await addToMailchimp(
      customerData.email,
      customerData.firstName,
      customerData.lastName,
      customerData.phone
    );

    console.log(`Order completed successfully: WooCommerce ID ${wooOrder.id}, Square Payment ID ${paymentResult.paymentId}`);

    return res.status(200).json({
      success: true,
      orderId: wooOrder.id,
      orderNumber: wooOrder.number,
      paymentId: paymentResult.paymentId,
      message: 'Payment processed successfully and order created',
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment processing failed. Please try again.',
    });
  }
}
