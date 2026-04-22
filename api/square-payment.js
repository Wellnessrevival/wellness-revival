import axios from 'axios';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const SQUARE_API_KEY = process.env.SQUARE_API_KEY;
const PRODUCT_ID = 11748; // Wellness Revival Kit product ID

// Create WooCommerce order
async function createWooCommerceOrder(customerData, amount) {
  try {
    const orderData = {
      payment_method: 'square',
      payment_method_title: 'Credit Card',
      set_paid: true,
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
async function addToMailchimp(email, firstName, lastName) {
  try {
    const datacenter = MAILCHIMP_API_KEY.split('-')[1];
    const response = await axios.post(
      `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sourceId, customerData, amount } = req.body;

    if (!sourceId || !customerData || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Process payment with Square (if SQUARE_API_KEY is configured)
    // For now, we'll just create the order
    // In production, you would call Square's API to process the payment

    // Create WooCommerce order
    const wooOrder = await createWooCommerceOrder(customerData, amount);

    // Add customer to Mailchimp
    await addToMailchimp(customerData.email, customerData.firstName, customerData.lastName);

    console.log('Order created successfully:', wooOrder.id);
    return res.status(200).json({
      success: true,
      orderId: wooOrder.id,
      message: 'Order created and customer added to mailing list',
    });
  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: 'Payment processing failed' });
  }
}
