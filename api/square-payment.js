import axios from 'axios';
import crypto from 'crypto';

const WOO_STORE_URL = 'https://www.canna-oils.com.au/wp-json/wc/v3';
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || 'c00cb4c301';
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Auto-detect Square environment based on access token
// Production tokens start with EAAA, sandbox tokens start with EAAAl or are shorter
// The access token provided starts with EAAAEGetX75 which is a production token
const SQUARE_BASE_URL = process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_ACCESS_TOKEN.startsWith('EAAAlE')
  ? 'https://connect.squareupsandbox.com/v2'
  : 'https://connect.squareup.com/v2';

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

    // Check Square credentials
    if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
      console.error('Square credentials missing:', {
        hasToken: !!SQUARE_ACCESS_TOKEN,
        hasLocationId: !!SQUARE_LOCATION_ID,
      });
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not configured. Please contact support.',
      });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const idempotencyKey = crypto.randomUUID();
    const qty = parseInt(quantity) || 1;

    // Determine the redirect URL based on the request origin
    const origin = req.headers.origin || 'https://wellness-revival.vercel.app';
    const redirectUrl = `${origin}/success`;

    console.log(`Creating Square Payment Link for ${customerData.email}, amount: $${amount}, qty: ${qty}`);
    console.log(`Square Base URL: ${SQUARE_BASE_URL}`);
    console.log(`Location ID: ${SQUARE_LOCATION_ID}`);
    console.log(`Redirect URL: ${redirectUrl}`);

    // Create a Square Payment Link using the Checkout API
    const paymentLinkPayload = {
      idempotency_key: idempotencyKey,
      quick_pay: {
        name: `Wellness Revival Kit x${qty}`,
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
        buyer_address: {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          address_line_1: customerData.address || '',
          locality: customerData.city || '',
          administrative_district_level_1: customerData.state || '',
          postal_code: customerData.postcode || '',
          country: 'AU',
        },
      },
    };

    // Add phone if provided - Square requires E.164 format (+61XXXXXXXXX for Australia)
    if (customerData.phone) {
      let phone = customerData.phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
      // Convert Australian mobile (04XXXXXXXX) to E.164 (+614XXXXXXXX)
      if (phone.startsWith('0')) {
        phone = '+61' + phone.substring(1);
      } else if (!phone.startsWith('+')) {
        phone = '+61' + phone;
      }
      paymentLinkPayload.pre_populated_data.buyer_phone_number = phone;
    }

    console.log('Sending payment link request to Square...');

    const squareResponse = await axios.post(
      `${SQUARE_BASE_URL}/online-checkout/payment-links`,
      paymentLinkPayload,
      {
        headers: {
          Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-18',
        },
      }
    );

    if (squareResponse.data && squareResponse.data.payment_link) {
      const checkoutUrl = squareResponse.data.payment_link.long_url || squareResponse.data.payment_link.url;
      const squareOrderId = squareResponse.data.payment_link.order_id;

      console.log(`Square Payment Link created: ${checkoutUrl}`);
      console.log(`Square Order ID: ${squareOrderId}`);

      // Create WooCommerce order (pending payment - will be updated when Square confirms)
      let wooOrderId = null;
      if (WOO_CONSUMER_KEY && WOO_CONSUMER_SECRET) {
        try {
          const wooOrderData = {
            payment_method: 'square',
            payment_method_title: 'Credit Card (Square)',
            set_paid: false,
            status: 'pending',
            transaction_id: squareOrderId,
            billing: {
              first_name: customerData.firstName,
              last_name: customerData.lastName,
              email: customerData.email,
              phone: customerData.phone || '',
              address_1: customerData.address || '',
              city: customerData.city || '',
              state: customerData.state || '',
              postcode: customerData.postcode || '',
              country: 'AU',
            },
            shipping: {
              first_name: customerData.firstName,
              last_name: customerData.lastName,
              address_1: customerData.address || '',
              city: customerData.city || '',
              state: customerData.state || '',
              postcode: customerData.postcode || '',
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
                total: '0.00',
              },
            ],
            customer_note: `Order placed via Wellness Revival landing page. Square Order ID: ${squareOrderId}`,
          };

          const wooResponse = await axios.post(
            `${WOO_STORE_URL}/orders`,
            wooOrderData,
            {
              auth: {
                username: WOO_CONSUMER_KEY,
                password: WOO_CONSUMER_SECRET,
              },
            }
          );

          wooOrderId = wooResponse.data.id;
          console.log(`WooCommerce order created: #${wooOrderId}`);
        } catch (wooError) {
          console.error('WooCommerce order creation failed:', wooError.response?.data || wooError.message);
          // Don't fail the whole request - Square payment link was created successfully
        }
      } else {
        console.warn('WooCommerce credentials not configured - skipping order creation');
      }

      // Add customer to Mailchimp
      if (MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID) {
        try {
          const datacenter = MAILCHIMP_API_KEY.split('-')[1] || 'us17';
          const emailHash = crypto.createHash('md5').update(customerData.email.toLowerCase()).digest('hex');

          await axios.put(
            `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${emailHash}`,
            {
              email_address: customerData.email,
              status_if_new: 'subscribed',
              status: 'subscribed',
              merge_fields: {
                FNAME: customerData.firstName,
                LNAME: customerData.lastName,
                PHONE: customerData.phone || '',
                ADDRESS: {
                  addr1: customerData.address || '',
                  city: customerData.city || '',
                  state: customerData.state || '',
                  zip: customerData.postcode || '',
                  country: 'AU',
                },
              },
              tags: ['wellness-revival-customer', 'landing-page-purchase', 'square-payment'],
            },
            {
              headers: {
                Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(`Customer added to Mailchimp: ${customerData.email}`);
        } catch (mailchimpError) {
          console.error('Mailchimp subscription failed:', mailchimpError.response?.data || mailchimpError.message);
          // Don't fail the whole request
        }
      } else {
        console.warn('Mailchimp credentials not configured - skipping subscription');
      }

      return res.status(200).json({
        success: true,
        checkoutUrl,
        squareOrderId,
        wooOrderId,
        message: 'Payment link created successfully',
      });
    } else {
      console.error('Unexpected Square response:', JSON.stringify(squareResponse.data));
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment link. Please try again.',
      });
    }
  } catch (error) {
    console.error('Square payment error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errors?.[0]?.detail || error.message || 'Payment processing failed';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
