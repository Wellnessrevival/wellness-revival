import { useState } from 'react';
import { CreditCard, ShoppingBag, Shield, Lock } from 'lucide-react';

export default function Checkout() {
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleAfterpayPayment = () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    // Create Afterpay order token
    const orderToken = `WR-${Date.now()}`;
    const apiKey = '0c54227b-5bbd-4fcb-b068-352d35d605b1';
    
    // Construct Afterpay checkout URL with proper parameters
    const afterpayCheckoutUrl = new URL('https://checkout.afterpay.com/checkout');
    
    const orderData = {
      token: orderToken,
      amount: parseFloat(total),
      currency: 'AUD',
      merchantId: '154331',
      consumer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      items: [
        {
          name: 'Wellness Revival Kit',
          description: 'Ultra BCP Oil (15ml) + Bodease Balm (10g) + Free Shipping',
          sku: 'WELLNESS-REVIVAL-KIT',
          quantity: parseInt(quantity),
          price: kitPrice,
        },
      ],
      shipping: {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        suburb: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: 'AU',
      },
      redirectConfirmUrl: `${window.location.origin}?order=${orderToken}&status=success`,
      redirectCancelUrl: `${window.location.origin}?order=${orderToken}&status=cancelled`,
    };

    // Encode the order data and redirect to Afterpay
    const encodedData = btoa(JSON.stringify(orderData));
    window.location.href = `https://checkout.afterpay.com/checkout?data=${encodedData}&key=${apiKey}`;
  };

  const handleSquarePayment = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    alert(`Square payment processing for $${total} AUD\n\nIn a production environment, this would securely process your card payment.\n\nOrder ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nYour Wellness Revival Kit will be shipped shortly.`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedPayment === 'paypal') {
      handlePayPalPayment();
    } else if (selectedPayment === 'afterpay') {
      handleAfterpayPayment();
    } else if (selectedPayment === 'square') {
      handleSquarePayment(e);
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
    {
      id: 'afterpay',
      name: 'Afterpay',
      icon: <ShoppingBag size={20} />,
      description: `4 interest-free payments of $${(kitPrice / 4).toFixed(2)}`,
      color: 'bg-teal-50 border-teal-200',
      activeColor: 'bg-teal-50 border-teal-500 ring-2 ring-teal-200',
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
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

              {/* Payment Method Selection */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Payment Method</h3>
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPayment === method.id ? method.activeColor : method.color
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-brand-green-dark mt-1">{method.icon}</div>
                        <div>
                          <h4 className="font-semibold text-brand-green-dark text-sm">{method.name}</h4>
                          <p className="text-xs text-brand-text-light mt-1">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* PayPal Info */}
                {selectedPayment === 'paypal' && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                    <p className="text-sm text-brand-text">You will be securely redirected to PayPal to complete your payment.</p>
                  </div>
                )}

                {/* Square Payment Form */}
                {selectedPayment === 'square' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <p className="text-sm text-brand-text mb-4">Enter your card details below to complete your purchase securely.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-brand-text mb-1.5">Expiration</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-brand-text mb-1.5">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-brand-text mb-1.5">Postal Code</label>
                          <input
                            type="text"
                            placeholder="2000"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Afterpay Info */}
                {selectedPayment === 'afterpay' && (
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 mb-6">
                    <p className="text-sm text-brand-text">You will be securely redirected to Afterpay to complete your purchase with 4 interest-free payments.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark sticky top-24 h-fit">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Order Summary</h3>

                {/* Product */}
                <div className="space-y-4 pb-6 border-b border-brand-cream-dark">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-brand-green-dark">Wellness Revival Kit</p>
                      <p className="text-xs text-brand-text-light mt-1">Ultra BCP Oil + Bodease Balm</p>
                    </div>
                    <p className="font-semibold text-brand-green-dark">${kitPrice.toFixed(2)}</p>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-brand-text">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3 py-6 border-b border-brand-cream-dark">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text">Subtotal</span>
                    <span className="text-brand-text font-medium">${(kitPrice * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text">Shipping</span>
                    <span className="text-brand-text font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text">You save</span>
                    <span className="text-red-600 font-medium">-${(29.95 * quantity).toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="py-6 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-brand-text font-medium">Total</span>
                    <span className="text-3xl font-bold text-brand-green-dark">${total}</span>
                  </div>
                  <p className="text-xs text-brand-text-light mt-2">AUD incl. GST</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg mb-4"
                >
                  {isProcessing ? 'Processing...' : 'Complete Your Order'}
                </button>

                {/* Trust Badges */}
                <div className="space-y-3 text-xs text-brand-text-light">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-brand-gold" />
                    <span>256-bit SSL encrypted checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-brand-gold" />
                    <span>30-day satisfaction guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-brand-gold" />
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
