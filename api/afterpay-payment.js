import axios from 'axios';

const AFTERPAY_MERCHANT_ID = process.env.AFTERPAY_MERCHANT_ID;
const AFTERPAY_SECRET_KEY = process.env.AFTERPAY_SECRET_KEY;
const AFTERPAY_BASE_URL = 'https://api.afterpay.com';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;

function getAfterPayAuthHeader() {
  const credentials = `${AFTERPAY_MERCHANT_ID}:${AFTERPAY_SECRET_KEY}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!AFTERPAY_MERCHANT_ID || !AFTERPAY_SECRET_KEY) {
    console.error('Afterpay credentials not configured');
    return res.status(500).json({
      success: false,
      error: 'Payment gateway not configured. Please contact support.',
    });
  }

  const { customerData, amount, quantity } = req.body;

  if (!customerData || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const origin = req.headers.origin || 'https://www.wellness-revival.com';
  const merchantReference = `WR-AP-${Date.now()}`;

  console.log(`Creating Afterpay checkout for ${customerData.firstName} ${customerData.lastName}, amount: $${amount}`);

  try {
    // Step 1: Create Afterpay checkout session
    const checkoutPayload = {
      amount: {
        amount: parseFloat(amount).toFixed(2),
        currency: 'AUD',
      },
      consumer: {
        givenNames: customerData.firstName,
        surname: customerData.lastName,
        email: customerData.email,
        phoneNumber: customerData.phone || '',
      },
      billing: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        line1: customerData.address,
        suburb: customerData.city,
        state: customerData.state,
        postcode: customerData.postcode,
        countryCode: 'AU',
        phoneNumber: customerData.phone || '',
      },
      shipping: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        line1: customerData.address,
        suburb: customerData.city,
        state: customerData.state,
        postcode: customerData.postcode,
        countryCode: 'AU',
        phoneNumber: customerData.phone || '',
      },
      items: [
        {
          name: 'Wellness Revival Kit',
          sku: 'WELLNESS-REVIVAL-KIT',
          quantity: parseInt(quantity) || 1,
          price: {
            amount: (59.95).toFixed(2),
            currency: 'AUD',
          },
        },
      ],
      merchant: {
        redirectConfirmUrl: `${origin}/success`,
        redirectCancelUrl: `${origin}/#checkout`,
        popupOriginUrl: origin,
      },
      merchantReference,
      taxAmount: {
        amount: (parseFloat(amount) * 0.1 / 1.1).toFixed(2),
        currency: 'AUD',
      },
      shippingAmount: {
        amount: '0.00',
        currency: 'AUD',
      },
    };

    const afterpayResponse = await axios.post(
      `${AFTERPAY_BASE_URL}/v2/checkouts`,
      checkoutPayload,
      {
        headers: {
          Authorization: getAfterPayAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'WellnessRevival/1.0',
        },
      }
    );

    const { token, redirectCheckoutUrl } = afterpayResponse.data;
    console.log(`Afterpay checkout created. Token: ${token}`);

    // Step 2: Create a pending WooCommerce order
    let wooOrderId = null;
    if (WOO_CONSUMER_KEY && WOO_CONSUMER_SECRET) {
      try {
        const wooOrder = await axios.post(
          `${WOO_STORE_URL}/orders`,
          {
            payment_method: 'afterpay',
            payment_method_title: 'Afterpay',
            set_paid: false,
            status: 'pending',
            transaction_id: token,
            billing: {
              first_name: customerData.firstName,
              last_name: customerData.lastName,
              address_1: customerData.address,
              city: customerData.city,
              state: customerData.state,
              postcode: customerData.postcode,
              country: 'AU',
              email: customerData.email,
              phone: customerData.phone || '',
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
                product_id: 11748,
                quantity: parseInt(quantity) || 1,
              },
            ],
            meta_data: [
              { key: '_afterpay_token', value: token },
              { key: '_merchant_reference', value: merchantReference },
            ],
          },
          {
            auth: {
              username: WOO_CONSUMER_KEY,
              password: WOO_CONSUMER_SECRET,
            },
          }
        );
        wooOrderId = wooOrder.data.id;
        console.log(`WooCommerce order created: #${wooOrderId}`);
      } catch (wooError) {
        console.error('WooCommerce order creation failed:', wooError.response?.data || wooError.message);
        // Continue — don't block the payment
      }
    }

    return res.status(200).json({
      success: true,
      token,
      redirectCheckoutUrl,
      wooOrderId,
      merchantReference,
    });
  } catch (error) {
    console.error('Afterpay error:', error.response?.data || error.message);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errorCode ||
      error.message ||
      'Failed to create Afterpay checkout';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
