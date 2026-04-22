import axios from 'axios';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const PRODUCT_ID = 11748; // Wellness Revival Kit product ID

// PayPal IPN verification
async function verifyPayPalIPN(body) {
  try {
    const verifyParams = new URLSearchParams(body);
    verifyParams.append('cmd', '_notify-validate');

    const response = await axios.post('https://www.paypal.com/cgi-bin/webscr', verifyParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data === 'VERIFIED';
  } catch (error) {
    console.error('PayPal IPN verification error:', error);
    return false;
  }
}

// Create WooCommerce order
async function createWooCommerceOrder(customerData, amount, paymentMethod) {
  try {
    const orderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card',
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
    // Verify PayPal IPN
    const isVerified = await verifyPayPalIPN(req.body);
    if (!isVerified) {
      console.error('PayPal IPN verification failed');
      return res.status(400).json({ error: 'IPN verification failed' });
    }

    // Check if this is a completed payment
    if (req.body.payment_status !== 'Completed') {
      return res.status(200).json({ message: 'Payment not completed' });
    }

    // Parse customer data from PayPal custom field
    let customerData;
    try {
      customerData = JSON.parse(req.body.custom);
    } catch (error) {
      console.error('Error parsing customer data:', error);
      return res.status(400).json({ error: 'Invalid customer data' });
    }

    // Create WooCommerce order
    const wooOrder = await createWooCommerceOrder(
      customerData,
      req.body.mc_gross,
      'paypal'
    );

    // Add customer to Mailchimp
    await addToMailchimp(customerData.email, customerData.firstName, customerData.lastName);

    console.log('Order created successfully:', wooOrder.id);
    return res.status(200).json({
      success: true,
      orderId: wooOrder.id,
      message: 'Order created and customer added to mailing list',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
