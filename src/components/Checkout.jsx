import { useState, useRef } from 'react';
import ReactGA from 'react-ga4';
import { CreditCard, Shield, Lock } from 'lucide-react';

export default function Checkout() {
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSquareForm, setShowSquareForm] = useState(false);
  const [isCardReady, setIsCardReady] = useState(false);
  const cardContainerRef = useRef(null);
  const paymentsRef = useRef(null);
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
  });

  const kitPrice = 59.95;
  const total = (kitPrice * quantity).toFixed(2);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.city || !formData.state || !formData.postcode) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handlePayPalPayment = () => {
    if (!validateForm()) return;

    // Track payment method selection
    ReactGA.event({
      category: 'checkout',
      action: 'payment_method_selected',
      label: 'paypal',
      value: parseFloat(total),
    });

    // Track form submission
    ReactGA.event({
      category: 'checkout',
      action: 'form_submitted',
      label: 'paypal_payment',
      value: parseFloat(total),
    });

    setIsProcessing(true);
    
    // Construct PayPal redirect URL
    const paypalParams = new URLSearchParams({
      cmd: '_xclick',
      business: 'W7GGQ7GFAJ2L6', // PayPal Merchant ID
      item_name: 'Wellness Revival Kit',
      item_number: 'WELLNESS-REVIVAL-KIT',
      amount: total,
      currency_code: 'AUD',
      quantity: quantity,
      invoice: `WR-${Date.now()}`,
      custom: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
      }),
      return: `${window.location.origin}/success`,
      cancel_return: `${window.location.origin}`,
      notify_url: `${window.location.origin}/api/paypal-webhook`,
    });

    // Redirect to PayPal
    window.location.href = `https://www.paypal.com/cgi-bin/webscr?${paypalParams.toString()}`;
  };

  const initializeSquarePayment = async () => {
    if (showSquareForm) {
      setShowSquareForm(false);
      return;
    }

    if (!validateForm()) return;

    try {
      setShowSquareForm(true);
      
      // Initialize Square Web Payments SDK
      if (!window.Square) {
        throw new Error('Square SDK not loaded');
      }

      const payments = window.Square.payments('sq0idp-AHIhhliilE8-btpRt5dT9g');
      paymentsRef.current = payments;

      // Create card payment method
      const card = await payments.card();
      cardRef.current = card;
      
      await card.attach(cardContainerRef.current);
      
      card.addEventListener('change', (state) => {
        setIsCardReady(state.complete);
      });
    } catch (error) {
      console.error('Square initialization error:', error);
      alert('Failed to initialize payment form. Please try again.');
      setShowSquareForm(false);
    }
  };

  const handleSquarePayment = async (e) => {
    e.preventDefault();
    
    if (!isCardReady) {
      alert('Please enter valid card details');
      return;
    }

    setIsProcessing(true);

    try {
      // Track payment method selection
      ReactGA.event({
        category: 'checkout',
        action: 'payment_method_selected',
        label: 'square',
        value: parseFloat(total),
      });

      // Track form submission
      ReactGA.event({
        category: 'checkout',
        action: 'form_submitted',
        label: 'square_payment',
        value: parseFloat(total),
      });

      // Request a payment token
      const result = await paymentsRef.current.requestCardNonce();

      if (result.status === 'OK') {
        const sourceId = result.nonce;

        // Send payment to backend for processing
        const response = await fetch('/api/square-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerData: formData,
            amount: total,
            quantity: quantity,
            sourceId: sourceId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Track successful order
          ReactGA.event({
            category: 'checkout',
            action: 'order_completed',
            label: 'square_payment',
            value: parseFloat(total),
          });

          alert(`Order Confirmed!\n\nOrder ID: ${data.orderId}\n\nThank you for your purchase. Your Wellness Revival Kit will be shipped shortly.\n\nA confirmation email has been sent to ${formData.email}`);
          
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postcode: '',
          });
          setShowSquareForm(false);
          setSelectedPayment('paypal');
        } else {
          alert(`Payment processing failed: ${data.error || 'Please try again.'}`);
        }
      } else if (result.errors && result.errors.length > 0) {
        alert(`Card error: ${result.errors[0].message}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedPayment === 'paypal') {
      handlePayPalPayment();
    } else if (selectedPayment === 'square') {
      if (showSquareForm) {
        handleSquarePayment(e);
      } else {
        initializeSquarePayment();
      }
    }
  };

  const paymentMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <CreditCard size={20} />,
      description: 'Pay securely with your PayPal account or credit card',
      color: 'bg-blue-50 border-blue-200',
      activeColor: 'bg-blue-50 border-blue-500 ring-2 ring-blue-200',
    },
    {
      id: 'square',
      name: 'Credit / Debit Card',
      icon: <CreditCard size={20} />,
      description: 'Visa, Mastercard, AMEX — powered by Square',
      color: 'bg-gray-50 border-gray-200',
      activeColor: 'bg-gray-50 border-gray-500 ring-2 ring-gray-200',
    },
  ];

  return (
    <section id="checkout" className="py-16 md:py-24 bg-brand-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-brand-gold font-semibold text-sm uppercase tracking-widest">Secure Checkout</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark mt-3 leading-tight">
            Start Your Revival Journey
          </h2>
          <p className="text-brand-text-light mt-4 text-base sm:text-lg max-w-2xl mx-auto">
            Choose your preferred payment method and take the first step towards feeling like yourself again.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Your Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      placeholder="Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      placeholder="0412 345 678"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Shipping Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1.5">Street Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      placeholder="123 Wellness Street"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-1.5">City / Suburb</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        placeholder="Sydney"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-1.5">State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      >
                        <option value="">Select</option>
                        <option value="NSW">NSW</option>
                        <option value="VIC">VIC</option>
                        <option value="QLD">QLD</option>
                        <option value="WA">WA</option>
                        <option value="SA">SA</option>
                        <option value="TAS">TAS</option>
                        <option value="ACT">ACT</option>
                        <option value="NT">NT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-1.5">Postcode</label>
                      <input
                        type="text"
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        placeholder="2000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Payment Method</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPayment === method.id ? method.activeColor : method.color
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => {
                          setSelectedPayment(e.target.value);
                          setShowSquareForm(false);
                        }}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {method.icon}
                          <span className="font-semibold text-brand-text">{method.name}</span>
                        </div>
                        <p className="text-sm text-brand-text-light mt-1">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Square Card Form */}
                {selectedPayment === 'square' && showSquareForm && (
                  <div className="mt-6 p-4 border-2 border-brand-gold rounded-xl bg-brand-cream">
                    <label className="block text-sm font-medium text-brand-text mb-3">Card Details</label>
                    <div
                      ref={cardContainerRef}
                      className="bg-white rounded-lg p-4 border border-gray-300"
                      style={{ minHeight: '200px' }}
                    />
                  </div>
                )}

                {selectedPayment === 'paypal' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    You will be securely redirected to PayPal to complete your payment.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark sticky top-24">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Order Summary</h3>

                {/* Product */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-brand-text">Wellness Revival Kit</p>
                      <p className="text-sm text-brand-text-light">Ultra BCP Oil + Bodease Balm</p>
                    </div>
                    <p className="font-semibold text-brand-text">${kitPrice}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-sm text-brand-text">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-light">Subtotal</span>
                    <span className="text-brand-text font-medium">${total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-light">Shipping</span>
                    <span className="text-brand-text font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-gold font-medium">You save</span>
                    <span className="text-brand-gold font-medium">-$29.95</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mb-6 pb-6 border-t-2 border-b-2 border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-brand-text">Total</span>
                    <span className="text-3xl font-bold text-brand-gold">${total}</span>
                  </div>
                  <p className="text-xs text-brand-text-light mt-1">AUD incl. GST</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-brand-gold hover:bg-brand-gold-dark text-white font-bold py-4 px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {isProcessing ? 'Processing...' : showSquareForm && selectedPayment === 'square' ? `Pay $${total}` : 'Complete Your Order'}
                </button>

                {/* Trust Badges */}
                <div className="space-y-2 text-xs text-brand-text-light">
                  <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>256-bit SSL encrypted checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={14} />
                    <span>30-day satisfaction guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} />
                    <span>Free standard shipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
