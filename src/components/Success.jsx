import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';

export default function Success() {
  useEffect(() => {
    // Track successful purchase
    ReactGA.event({
      category: 'checkout',
      action: 'purchase_completed',
      label: 'success_page_viewed',
    });
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-b from-brand-green-dark to-brand-green flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-brand-green-dark mb-4">
          Thank You!
        </h1>
        
        <p className="text-brand-text-light mb-6">
          Your order has been successfully placed. Your Wellness Revival Kit will be shipped shortly.
        </p>
        
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
      </div>
    </section>
  );
}
