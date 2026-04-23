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

  const { token, status } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing token' });
  }

  // If Afterpay redirected back with status=CANCELLED, don't capture
  if (status === 'CANCELLED') {
    console.log(`Afterpay payment cancelled for token: ${token}`);
    return res.status(200).json({ success: false, cancelled: true });
  }

  console.log(`Capturing Afterpay payment for token: ${token}`);

  try {
    // Step 1: Capture the Afterpay payment
    const captureResponse = await axios.post(
      `${AFTERPAY_BASE_URL}/v2/payments/capture`,
      { token },
      {
        headers: {
          Authorization: getAfterPayAuthHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'WellnessRevival/1.0',
        },
      }
    );

    const payment = captureResponse.data;
    console.log(`Afterpay payment captured. Status: ${payment.status}, ID: ${payment.id}`);

    if (payment.status !== 'APPROVED') {
      return res.status(200).json({
        success: false,
        error: `Payment status: ${payment.status}`,
        paymentStatus: payment.status,
      });
    }

    // Step 2: Update WooCommerce order to processing
    let wooOrderId = null;
    if (WOO_CONSUMER_KEY && WOO_CONSUMER_SECRET) {
      try {
        // Find the WooCommerce order by Afterpay token (stored in transaction_id)
        const searchResponse = await axios.get(`${WOO_STORE_URL}/orders`, {
          params: {
            search: token,
            per_page: 5,
            status: 'pending',
          },
          auth: {
            username: WOO_CONSUMER_KEY,
            password: WOO_CONSUMER_SECRET,
          },
        });

        const orders = searchResponse.data;
        const matchingOrder = orders.find((o) => o.transaction_id === token);
        const targetOrder = matchingOrder || orders[0];

        if (targetOrder) {
          wooOrderId = targetOrder.id;
          await axios.put(
            `${WOO_STORE_URL}/orders/${wooOrderId}`,
            {
              status: 'processing',
              transaction_id: payment.id,
              meta_data: [
                { key: '_afterpay_payment_id', value: payment.id },
                { key: '_afterpay_token', value: token },
              ],
            },
            {
              auth: {
                username: WOO_CONSUMER_KEY,
                password: WOO_CONSUMER_SECRET,
              },
            }
          );
          console.log(`WooCommerce order #${wooOrderId} updated to processing`);
        }
      } catch (wooError) {
        console.error('WooCommerce update failed:', wooError.response?.data || wooError.message);
      }
    }

    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      paymentStatus: payment.status,
      wooOrderId,
    });
  } catch (error) {
    console.error('Afterpay capture error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to capture payment',
    });
  }
}
