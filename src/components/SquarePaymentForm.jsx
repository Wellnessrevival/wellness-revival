import { useEffect, useRef, useState } from 'react';

export default function SquarePaymentForm({ amount, onPaymentSuccess, onPaymentError, isProcessing }) {
  const [payments, setPayments] = useState(null);
  const [web, setWeb] = useState(null);
  const cardContainerRef = useRef(null);
  const [isCardReady, setIsCardReady] = useState(false);

  useEffect(() => {
    initializeSquare();
  }, []);

  const initializeSquare = async () => {
    try {
      // Initialize Square Web Payments SDK
      const payments = window.Square.payments('sq0idp-AHIhhliilE8-btpRt5dT9g');
      setPayments(payments);

      // Create Web Payments instance
      const web = await payments.web();
      setWeb(web);

      // Initialize card payment method
      const card = await payments.card();
      await card.attach(cardContainerRef.current);
      card.addEventListener('change', (state) => {
        setIsCardReady(state.complete);
      });
    } catch (error) {
      console.error('Square initialization error:', error);
      onPaymentError('Failed to initialize payment form');
    }
  };

  const handlePayment = async () => {
    if (!payments || !isCardReady) {
      onPaymentError('Please enter valid card details');
      return;
    }

    try {
      // Request a payment token
      const result = await payments.requestCardNonce();

      if (result.status === 'OK') {
        const nonce = result.nonce;
        // Send nonce to backend for processing
        onPaymentSuccess(nonce);
      } else if (result.errors && result.errors.length > 0) {
        onPaymentError(result.errors[0].message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('Failed to process payment');
    }
  };

  return (
    <div className="space-y-4">
      <div
        ref={cardContainerRef}
        className="border border-gray-300 rounded-lg p-4 bg-white"
        style={{ minHeight: '200px' }}
      />
      <button
        onClick={handlePayment}
        disabled={isProcessing || !isCardReady}
        className="w-full bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </button>
    </div>
  );
}
