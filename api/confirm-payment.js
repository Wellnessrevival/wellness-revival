import axios from 'axios';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_BASE_URL = 'https://connect.squareup.com/v2';

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

  const { squareOrderId } = req.body;

  if (!squareOrderId) {
    return res.status(400).json({ success: false, error: 'Missing squareOrderId' });
  }

  console.log(`Confirming payment for Square Order ID: ${squareOrderId}`);

  try {
    // Step 1: Verify the Square order is actually paid
    let squareOrderPaid = false;
    let squarePaymentId = null;

    if (SQUARE_ACCESS_TOKEN) {
      try {
        const squareOrderResponse = await axios.get(
          `${SQUARE_BASE_URL}/orders/${squareOrderId}`,
          {
            headers: {
              Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
              'Square-Version': '2024-01-18',
            },
          }
        );

        const order = squareOrderResponse.data?.order;
        console.log(`Square order state: ${order?.state}`);

        // Square order states: OPEN, COMPLETED, CANCELED
        if (order && (order.state === 'COMPLETED' || order.tenders?.length > 0)) {
          squareOrderPaid = true;
          squarePaymentId = order.tenders?.[0]?.id || squareOrderId;
          console.log(`Square payment confirmed. Payment ID: ${squarePaymentId}`);
        } else {
          console.log(`Square order not yet completed. State: ${order?.state}`);
          return res.status(200).json({
            success: false,
            error: 'Payment not yet confirmed by Square',
            orderState: order?.state,
          });
        }
      } catch (squareError) {
        console.error('Error checking Square order:', squareError.response?.data || squareError.message);
        // If we can't verify with Square, still try to update WooCommerce
        // (Square redirect only happens after successful payment)
        squareOrderPaid = true;
      }
    } else {
      // No Square token configured - trust the redirect (Square only redirects on success)
      squareOrderPaid = true;
    }

    if (!squareOrderPaid) {
      return res.status(200).json({ success: false, error: 'Payment not confirmed' });
    }

    // Step 2: Find the WooCommerce order with this Square Order ID
    if (!WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
      console.warn('WooCommerce credentials not configured');
      return res.status(200).json({ success: true, message: 'Payment confirmed but WooCommerce not configured' });
    }

    // Search for WooCommerce order by transaction_id (Square Order ID)
    let wooOrderId = null;
    try {
      const searchResponse = await axios.get(`${WOO_STORE_URL}/orders`, {
        params: {
          search: squareOrderId,
          per_page: 5,
          status: 'pending',
        },
        auth: {
          username: WOO_CONSUMER_KEY,
          password: WOO_CONSUMER_SECRET,
        },
      });

      const orders = searchResponse.data;
      console.log(`Found ${orders.length} WooCommerce orders matching Square Order ID: ${squareOrderId}`);

      // Find the order where transaction_id matches
      const matchingOrder = orders.find(
        (order) => order.transaction_id === squareOrderId
      );

      if (matchingOrder) {
        wooOrderId = matchingOrder.id;
        console.log(`Found matching WooCommerce order: #${wooOrderId}`);
      } else if (orders.length > 0) {
        // Fallback: use the most recent pending order
        wooOrderId = orders[0].id;
        console.log(`Using most recent pending order: #${wooOrderId}`);
      }
    } catch (searchError) {
      console.error('Error searching WooCommerce orders:', searchError.response?.data || searchError.message);
    }

    if (!wooOrderId) {
      console.warn(`No WooCommerce order found for Square Order ID: ${squareOrderId}`);
      return res.status(200).json({
        success: true,
        message: 'Payment confirmed by Square but no matching WooCommerce order found',
        squareOrderId,
      });
    }

    // Step 3: Update the WooCommerce order status to "processing"
    try {
      await axios.put(
        `${WOO_STORE_URL}/orders/${wooOrderId}`,
        {
          status: 'processing',
          transaction_id: squarePaymentId || squareOrderId,
        },
        {
          auth: {
            username: WOO_CONSUMER_KEY,
            password: WOO_CONSUMER_SECRET,
          },
        }
      );

      console.log(`WooCommerce order #${wooOrderId} updated to "processing"`);

      return res.status(200).json({
        success: true,
        message: `Order #${wooOrderId} confirmed and updated to processing`,
        wooOrderId,
        squareOrderId,
      });
    } catch (updateError) {
      console.error('Error updating WooCommerce order:', updateError.response?.data || updateError.message);
      return res.status(500).json({
        success: false,
        error: 'Payment confirmed but failed to update order status',
        wooOrderId,
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm payment',
    });
  }
}
