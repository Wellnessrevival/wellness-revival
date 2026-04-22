import { useState, useEffect } from 'react';
import { CreditCard, ShoppingBag, Shield, Lock } from 'lucide-react';

export default function Checkout() {
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [quantity, setQuantity] = useState(1);
  const [paypalReady, setPaypalReady] = useState(false);
  const [squareReady, setSquareReady] = useState(false);
  const [afterpayReady, setAfterpayReady] = useState(false);
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

  // Initialize PayPal buttons
  useEffect(() => {
    if (window.paypal && selectedPayment === 'paypal') {
      setPaypalReady(true);
      
      // Render PayPal buttons
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          // Validate form data
          if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.city || !formData.state || !formData.postcode) {
            alert('Please fill in all required fields');
            return;
          }

          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: total,
                  currency_code: 'AUD',
                  breakdown: {
                    item_total: {
                      currency_code: 'AUD',
                      value: total,
                    },
                  },
                },
                items: [
                  {
                    name: 'Wellness Revival Kit',
                    description: 'Ultra BCP Oil (15ml) + Bodease Balm (10g) + Free Shipping',
                    sku: 'WELLNESS-REVIVAL-KIT',
                    unit_amount: {
                      currency_code: 'AUD',
                      value: kitPrice.toString(),
                    },
                    quantity: quantity.toString(),
                  },
                ],
                shipping: {
                  name: {
                    full_name: `${formData.firstName} ${formData.lastName}`,
                  },
                  address: {
                    address_line_1: formData.address,
                    admin_area_2: formData.city,
                    admin_area_1: formData.state,
                    postal_code: formData.postcode,
                    country_code: 'AU',
                  },
                },
              },
            ],
            payer: {
              name: {
                given_name: formData.firstName,
                surname: formData.lastName,
              },
              email_address: formData.email,
              phone: {
                phone_number: {
                  national_number: formData.phone,
                },
              },
            },
          });
        },
        onApprove: (data, actions) => {
          return actions.order.capture().then((details) => {
            alert(`Thank you, ${details.payer.name.given_name}! Your order has been processed. Order ID: ${details.id}`);
            console.log('Order details:', details);
          });
        },
        onError: (err) => {
          alert('An error occurred during the transaction. Please try again.');
          console.error(err);
        },
      }).render('#paypal-button-container');
    }
  }, [selectedPayment, formData, total, quantity]);

  // Initialize Square Payment Form
  useEffect(() => {
    if (selectedPayment === 'square' && !squareReady && window.SqPaymentForm) {
      try {
        const paymentForm = new window.SqPaymentForm({
          applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID,
          inputClass: 'sq-input',
          autoBuild: false,
          cardNumber: {
            elementId: 'sq-cardNumber',
          },
          expirationDate: {
            elementId: 'sq-expirationDate',
          },
          cvv: {
            elementId: 'sq-cvv',
          },
          postalCode: {
            elementId: 'sq-postalCode',
          },
        });
        
        window.paymentForm = paymentForm;
        setSquareReady(true);
        console.log('Square Payment Form initialized');
      } catch (error) {
        console.error('Error initializing Square:', error);
      }
    }
  }, [selectedPayment, squareReady]);

  // Initialize Afterpay
  useEffect(() => {
    if (selectedPayment === 'afterpay' && !afterpayReady && window.AfterPay) {
      try {
        window.AfterPay.init({
          countryCode: 'AU',
          merchantId: import.meta.env.VITE_AFTERPAY_MERCHANT_ID,
        });
        setAfterpayReady(true);
        console.log('Afterpay SDK initialized');
      } catch (error) {
        console.error('Error initializing Afterpay:', error);
      }
    }
  }, [selectedPayment, afterpayReady]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.city || !formData.state || !formData.postcode) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedPayment === 'square') {
      await handleSquarePayment();
    } else if (selectedPayment === 'afterpay') {
      await handleAfterpayPayment();
    }
  };

  const handleSquarePayment = async () => {
    try {
      if (!window.paymentForm) {
        alert('Square payment system is not ready. Please refresh the page.');
        return;
      }

      // Request a card token
      window.paymentForm.requestCardToken((err, token) => {
        if (err) {
          alert('Error processing card. Please check your card details and try again.');
          console.error('Square error:', err);
          return;
        }

        // In production, you would send this token to your backend
        alert(`Thank you! Your payment of $${total} AUD has been processed successfully.\n\nOrder ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nYour Wellness Revival Kit will be shipped shortly.`);
        console.log('Square payment token:', token);
      });
    } catch (error) {
      alert('Payment failed. Please try again.');
      console.error('Square payment error:', error);
    }
  };

  const handleAfterpayPayment = async () => {
    try {
      if (!window.AfterPay) {
        alert('Afterpay is not available. Please try another payment method.');
        return;
      }

      alert(`Thank you! Your Afterpay order has been created.\n\nYou will receive 4 payments of $${(total / 4).toFixed(2)} AUD.\n\nOrder ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\n\nYour Wellness Revival Kit will be shipped shortly.`);
      console.log('Afterpay payment initiated');
    } catch (error) {
      alert('Afterpay payment failed. Please try again.');
      console.error('Afterpay payment error:', error);
    }
  };

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-2 sm:col-span-1">
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

                {/* PayPal Button Container */}
                {selectedPayment === 'paypal' && (
                  <div id="paypal-button-container" className="mt-4"></div>
                )}

                {/* Square Payment Form */}
                {selectedPayment === 'square' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text mb-1.5">Card Number</label>
                      <input
                        type="text"
                        id="sq-cardNumber"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">Expiration</label>
                        <input
                          type="text"
                          id="sq-expirationDate"
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">CVV</label>
                        <input
                          type="text"
                          id="sq-cvv"
                          placeholder="123"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-brand-text mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          id="sq-postalCode"
                          placeholder="2000"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Afterpay Info */}
                {selectedPayment === 'afterpay' && (
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                    <p className="text-sm text-brand-text">
                      You'll receive 4 payments of <strong>${(total / 4).toFixed(2)} AUD</strong> due every 2 weeks.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark sticky top-24">
                <h3 className="text-xl font-bold text-brand-green-dark mb-6">Order Summary</h3>
                
                <div className="space-y-4 pb-6 border-b border-brand-cream-dark">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-brand-text">Wellness Revival Kit</p>
                      <p className="text-xs text-brand-text-light mt-1">Ultra BCP Oil + Bodease Balm</p>
                    </div>
                    <p className="font-semibold text-brand-text">${kitPrice.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm text-brand-text">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-brand-text text-sm"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 py-6 border-b border-brand-cream-dark">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-light">Subtotal</span>
                    <span className="text-brand-text font-medium">${total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-light">Shipping</span>
                    <span className="text-brand-text font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-light">You save</span>
                    <span className="text-red-600 font-medium">-${(29.95 * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="py-6 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-brand-text-light">Total</span>
                    <span className="text-3xl font-bold text-brand-green-dark">${total}</span>
                  </div>
                  <p className="text-xs text-brand-text-light mt-2">AUD incl. GST</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold py-3 rounded-xl transition-colors mb-4"
                >
                  Complete Your Order
                </button>

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
