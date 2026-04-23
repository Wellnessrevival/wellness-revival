import { CheckCircle, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Success() {
  const [orderStatus, setOrderStatus] = useState('confirming'); // confirming | confirmed | error
  const [orderNumber, setOrderNumber] = useState(null);

  useEffect(() => {
    // Square redirects back with query params like:
    // ?transactionId=...&orderId=...&referenceId=...
    const params = new URLSearchParams(window.location.search);
    const squareOrderId = params.get('orderId') || params.get('transactionId') || params.get('referenceId');
    const afterpayToken = params.get('orderToken'); // Afterpay passes orderToken on redirect
    const afterpayStatus = params.get('status'); // Afterpay passes status=SUCCESS or CANCELLED

    console.log('Success page loaded. URL params:', Object.fromEntries(params));

    // Handle Afterpay redirect
    if (afterpayToken) {
      console.log(`Afterpay redirect. Token: ${afterpayToken}, Status: ${afterpayStatus}`);

      if (afterpayStatus === 'CANCELLED') {
        // Customer cancelled — redirect back to checkout
        window.location.href = '/#checkout';
        return;
      }

      const captureAfterpay = async () => {
        try {
          const response = await fetch('/api/afterpay-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: afterpayToken, status: afterpayStatus }),
          });
          const data = await response.json();
          console.log('Afterpay capture response:', data);
          if (data.success) {
            setOrderNumber(data.wooOrderId);
          }
          setOrderStatus('confirmed');
        } catch (err) {
          console.error('Afterpay capture error:', err);
          setOrderStatus('confirmed');
        }
      };

      captureAfterpay();
      return;
    }

    // Handle Square redirect
    if (!squareOrderId) {
      // No order ID in URL - still show success (customer may have paid)
      setOrderStatus('confirmed');
      return;
    }

    // Call our confirm-payment API to update WooCommerce order status
    const confirmPayment = async () => {
      try {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ squareOrderId }),
        });

        const data = await response.json();
        console.log('Confirm payment response:', data);

        if (data.success) {
          setOrderNumber(data.wooOrderId);
          setOrderStatus('confirmed');
        } else {
          console.warn('Payment confirmation issue:', data.error);
          // Still show success - Square only redirects here after successful payment
          setOrderStatus('confirmed');
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        // Still show success page - don't block the customer
        setOrderStatus('confirmed');
      }
    };

    confirmPayment();
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-b from-brand-green-dark to-brand-green flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {orderStatus === 'confirming' ? (
          <>
            <div className="flex justify-center mb-6">
              <Loader size={64} className="text-brand-gold animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-brand-green-dark mb-4">
              Confirming Your Order...
            </h1>
            <p className="text-brand-text-light">
              Please wait while we confirm your payment.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-green-500" />
            </div>

            <h1 className="text-3xl font-bold text-brand-green-dark mb-4">
              Thank You!
            </h1>

            <p className="text-brand-text-light mb-4">
              Your order has been successfully placed. Your Wellness Revival Kit will be shipped shortly.
            </p>

            {orderNumber && (
              <p className="text-sm font-semibold text-brand-green-dark mb-4">
                Order #{orderNumber}
              </p>
            )}

            <p className="text-sm text-brand-text-light mb-8">
              A confirmation email with your order details has been sent to your email address.
            </p>

            <div className="space-y-3">
              <p className="text-xs text-brand-text-light">
                📦 Free standard shipping included
              </p>
              <p className="text-xs text-brand-text-light">
                ✓ 30-day satisfaction guarantee
              </p>
              <p className="text-xs text-brand-text-light">
                💬 Questions? Contact us at hello@canna-oils.com.au
              </p>
            </div>

            <a
              href="/"
              className="inline-block mt-8 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Return to Home
            </a>
          </>
        )}
      </div>
    </section>
  );
}
