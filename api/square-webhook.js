import axios from 'axios';
import crypto from 'crypto';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

/**
 * Verify Square webhook signature to ensure the request is genuinely from Square.
 * Square uses HMAC-SHA256 with the webhook signature key.
 */
function verifySquareWebhook(req, body) {
  if (!SQUARE_WEBHOOK_SIGNATURE_KEY) {
    console.warn('SQUARE_WEBHOOK_SIGNATURE_KEY not set - skipping signature verification');
    return true; // Allow through if key not configured (set it up after first deploy)
  }

  const squareSignature = req.headers['x-square-hmacsha256-signature'];
  if (!squareSignature) {
    console.error('Missing Square webhook signature header');
    return false;
  }

  // Square signature = HMAC-SHA256(webhookSignatureKey, notificationUrl + rawBody)
  const notificationUrl = `https://wellness-revival.vercel.app/api/square-webhook`;
  const hmac = crypto.createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY);
  hmac.update(notificationUrl + body);
  const expectedSignature = hmac.digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(squareSignature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Find WooCommerce order by Square Order ID stored in transaction_id field.
 */
async function findWooOrderBySquareOrderId(squareOrderId) {
  try {
    const response = await axios.get(`${WOO_STORE_URL}/orders`, {
      params: {
        search: squareOrderId,
        per_page: 5,
      },
      auth: {
        username: WOO_CONSUMER_KEY,
        password: WOO_CONSUMER_SECRET,
      },
    });

    const orders = response.data;
    // Find the order where transaction_id matches the Square order ID
    const matchingOrder = orders.find(
      (order) => order.transaction_id === squareOrderId
    );

    return matchingOrder || null;
  } catch (error) {
    console.error('Error searching WooCommerce orders:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Update WooCommerce order status to 'processing' and mark as paid.
 */
async function updateWooOrderStatus(wooOrderId, squarePaymentId, squareOrderId) {
  try {
    const response = await axios.put(
      `${WOO_STORE_URL}/orders/${wooOrderId}`,
      {
        status: 'processing',
        set_paid: true,
        transaction_id: squarePaymentId || squareOrderId,
        meta_data: [
          {
            key: '_square_payment_id',
            value: squarePaymentId || '',
          },
          {
            key: '_square_order_id',
            value: squareOrderId || '',
          },
          {
            key: '_payment_confirmed_at',
            value: new Date().toISOString(),
          },
        ],
      },
      {
        auth: {
          username: WOO_CONSUMER_KEY,
          password: WOO_CONSUMER_SECRET,
        },
      }
    );

    console.log(`WooCommerce order #${wooOrderId} updated to 'processing' (paid)`);
    return response.data;
  } catch (error) {
    console.error(`Error updating WooCommerce order #${wooOrderId}:`, error.response?.data || error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-square-hmacsha256-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get raw body for signature verification
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // Verify the webhook is genuinely from Square
  if (!verifySquareWebhook(req, rawBody)) {
    console.error('Invalid Square webhook signature - rejecting request');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  console.log(`Square webhook received: ${event.type}`);

  // We care about payment completion events
  // Square fires 'payment.completed' when a payment is successfully processed
  if (event.type !== 'payment.completed' && event.type !== 'order.fulfillment.updated') {
    console.log(`Ignoring event type: ${event.type}`);
    return res.status(200).json({ received: true, action: 'ignored' });
  }

  try {
    let squareOrderId = null;
    let squarePaymentId = null;

    if (event.type === 'payment.completed') {
      const payment = event.data?.object?.payment;
      if (!payment) {
        console.error('No payment object in event');
        return res.status(200).json({ received: true, action: 'no_payment_data' });
      }

      squarePaymentId = payment.id;
      squareOrderId = payment.order_id;

      console.log(`Payment completed - Square Payment ID: ${squarePaymentId}, Order ID: ${squareOrderId}`);

      // Only process completed payments
      if (payment.status !== 'COMPLETED') {
        console.log(`Payment status is ${payment.status} - not updating WooCommerce`);
        return res.status(200).json({ received: true, action: 'payment_not_completed' });
      }
    } else if (event.type === 'order.fulfillment.updated') {
      squareOrderId = event.data?.object?.order_fulfillment_updated?.order_id;
      console.log(`Order fulfillment updated - Square Order ID: ${squareOrderId}`);
    }

    if (!squareOrderId) {
      console.error('Could not extract Square Order ID from webhook event');
      return res.status(200).json({ received: true, action: 'no_order_id' });
    }

    // Check WooCommerce credentials
    if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
      console.error('WooCommerce credentials not configured');
      return res.status(200).json({ received: true, action: 'woo_not_configured' });
    }

    // Find the matching WooCommerce order
    const wooOrder = await findWooOrderBySquareOrderId(squareOrderId);

    if (!wooOrder) {
      console.warn(`No WooCommerce order found for Square Order ID: ${squareOrderId}`);
      return res.status(200).json({ received: true, action: 'no_woo_order_found', squareOrderId });
    }

    console.log(`Found WooCommerce order #${wooOrder.id} with status: ${wooOrder.status}`);

    // Only update if currently pending or on-hold
    if (wooOrder.status !== 'pending' && wooOrder.status !== 'on-hold') {
      console.log(`WooCommerce order #${wooOrder.id} already has status: ${wooOrder.status} - skipping update`);
      return res.status(200).json({ received: true, action: 'already_updated', wooOrderId: wooOrder.id });
    }

    // Update the WooCommerce order to processing/paid
    await updateWooOrderStatus(wooOrder.id, squarePaymentId, squareOrderId);

    return res.status(200).json({
      received: true,
      action: 'order_updated',
      wooOrderId: wooOrder.id,
      squareOrderId,
      squarePaymentId,
    });

  } catch (error) {
    console.error('Webhook processing error:', error.message);
    // Always return 200 to Square so it doesn't retry
    return res.status(200).json({ received: true, error: error.message });
  }
}
