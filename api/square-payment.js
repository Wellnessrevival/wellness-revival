import axios from 'axios';
import crypto from 'crypto';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Use sandbox URL for sandbox credentials, production for live
const SQUARE_BASE_URL = SQUARE_ACCESS_TOKEN && SQUARE_ACCESS_TOKEN.startsWith('EAAA')
  ? 'https://connect.squareupsandbox.com/v2'
  : 'https://connect.squareup.com/v2';

const squareClient = axios.create({
  baseURL: SQUARE_BASE_URL,
  headers: {
    Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Square-Version': '2024-01-18',
  },
});

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
    const { customerData, amount, quantity } = req.body;

    // Validate required fields
    if (!customerData || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerData, amount',
      });
    }

    if (!customerData.firstName || !customerData.lastName || !customerData.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required customer information',
      });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const idempotencyKey = crypto.randomUUID();
    const qty = parseInt(quantity) || 1;

    // Determine the redirect URL based on the request origin
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://wellness-revival.vercel.app';
    const redirectUrl = `${origin}/success`;

    console.log(`Creating Square Payment Link for ${customerData.email}, amount: $${amount}, qty: ${qty}`);
    console.log(`Square Base URL: ${SQUARE_BASE_URL}`);
    console.log(`Location ID: ${SQUARE_LOCATION_ID}`);
    console.log(`Redirect URL: ${redirectUrl}`);

    // Create a Square Payment Link using the Checkout API
    const paymentLinkPayload = {
      idempotency_key: idempotencyKey,
      quick_pay: {
        name: 'Wellness Revival Kit',
        price_money: {
          amount: amountInCents,
          currency: 'AUD',
        },
        location_id: SQUARE_LOCATION_ID,
      },
      checkout_options: {
        redirect_url: redirectUrl,
        ask_for_shipping_address: false,
        accepted_payment_methods: {
          apple_pay: true,
          google_pay: true,
        },
      },
      pre_populated_data: {
        buyer_email: customerData.email,
        buyer_phone_number: customerData.phone || undefined,
        buyer_address: {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          address_line_1: customerData.address,
          locality: customerData.city,
          administrative_district_level_1: customerData.state,
          postal_code: customerData.postcode,
          country: 'AU',
        },
      },
      payment_note: `Wellness Revival Kit - ${customerData.firstName} ${customerData.lastName} (${customerData.email})`,
    };

    // Remove undefined fields from pre_populated_data
    if (!customerData.phone) {
      delete paymentLinkPayload.pre_populated_data.buyer_phone_number;
    }

    console.log('Sending payment link request to Square...');

    const response = await squareClient.post('/online-checkout/payment-links', paymentLinkPayload);

    if (response.data && response.data.payment_link) {
      const checkoutUrl = response.data.payment_link.long_url || response.data.payment_link.url;
      const squareOrderId = response.data.payment_link.order_id;

      console.log(`Square Payment Link created: ${checkoutUrl}`);
      console.log(`Square Order ID: ${squareOrderId}`);

      // Store customer data for later use by the success/webhook handler
      // We'll also create the WooCommerce order and add to Mailchimp now
      // since we have the customer data available
      try {
        // Create WooCommerce order (set as pending payment)
        const orderData = {
          payment_method: 'square',
          payment_method_title: 'Credit Card (Square)',
          set_paid: false, // Will be set to paid when Square confirms payment
          status: 'pending',
          transaction_id: squareOrderId,
          billing: {
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            email: customerData.email,
            phone: customerData.phone || '',
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
              product_id: 11748,
              quantity: qty,
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

        const wooResponse = await axios.post(`${WOO_STORE_URL}/orders`, orderData, {
          auth: {
            username: WOO_CONSUMER_KEY,
            password: WOO_CONSUMER_SECRET,
          },
        });

        console.log(`WooCommerce order created: ${wooResponse.data.id} (pending)`);
      } catch (wooError) {
        console.error('WooCommerce order creation error (non-blocking):', wooError.response?.data || wooError.message);
        // Don't block the checkout if WooCommerce fails
      }

      // Add to Mailchimp
      try {
        const datacenter = MAILCHIMP_API_KEY?.split('-')[1];
        if (datacenter) {
          const subscriberHash = crypto
            .createHash('md5')
            .update(customerData.email.toLowerCase())
            .digest('hex');

          await axios.put(
            `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
            {
              email_address: customerData.email,
              status: 'subscribed',
              merge_fields: {
                FNAME: customerData.firstName,
                LNAME: customerData.lastName,
                PHONE: customerData.phone || '',
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
          console.log(`Added ${customerData.email} to Mailchimp`);
        }
      } catch (mcError) {
        console.error('Mailchimp error (non-blocking):', mcError.response?.data || mcError.message);
        // Don't block the checkout if Mailchimp fails
      }

      return res.status(200).json({
        success: true,
        checkoutUrl: checkoutUrl,
        squareOrderId: squareOrderId,
        message: 'Payment link created successfully',
      });
    } else {
      console.error('Square response missing payment_link:', JSON.stringify(response.data));
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment link',
      });
    }
  } catch (error) {
    console.error('Square payment link error:', error.response?.data || error.message);

    const errorDetail = error.response?.data?.errors?.[0]?.detail ||
                       error.response?.data?.errors?.[0]?.message ||
                       error.message ||
                       'Payment setup failed';

    return res.status(500).json({
      success: false,
      error: errorDetail,
    });
  }
}
