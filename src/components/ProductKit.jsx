import { Droplets, Sparkles, Shield, Leaf } from 'lucide-react';

export default function ProductKit() {
  return (
    <section id="kit" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-brand-gold font-semibold text-sm uppercase tracking-widest">Exclusive Introductory Offer</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark mt-3 leading-tight">
            The Wellness Revival Kit
          </h2>
          <p className="text-brand-text-light mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to start supporting your body's natural balance — curated for new customers at an exceptional introductory price.
          </p>
        </div>

        {/* Kit showcase */}
        <div className="bg-gradient-to-br from-brand-cream to-brand-cream-dark rounded-3xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-0">
              {/* Product visual side */}
            <div className="bg-gradient-to-br from-brand-green-dark to-brand-green p-8 md:p-12 flex flex-col justify-center items-center text-center">
              <div className="w-full max-w-sm mb-8">
                <img src="/src/assets/product-kit-showcase.png" alt="Wellness Revival Kit" className="w-full h-auto object-contain" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">What's Inside</h3>
              <div className="space-y-3 text-white/80 text-sm">
                <div className="flex items-center gap-3">
                  <Droplets size={18} className="text-brand-gold flex-shrink-0" />
                  <span><strong className="text-white">Canna Oils Ultra</strong> — 15ml BCP oil for systemic support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-brand-gold flex-shrink-0" />
                  <span><strong className="text-white">Bodease Balm</strong> — 10g topical for targeted relief</span>
                </div>
                <div className="flex items-center gap-3">
                  <Leaf size={18} className="text-brand-gold flex-shrink-0" />
                  <span><strong className="text-white">Wellness Guide</strong> — Tips to complement your journey</span>
                </div>
              </div>
            </div>

            {/* Pricing & CTA side */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <span className="inline-block bg-brand-gold/10 text-brand-gold font-semibold text-xs uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  New Customers Only
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-brand-green-dark mb-2">
                  Start Your Revival
                </h3>
                <p className="text-brand-text-light leading-relaxed">
                  Experience the Canna Oils difference with our specially curated introductory kit. Two powerful products working together to support your body from the inside out and the outside in.
                </p>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cream-dark mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-brand-green-dark">$59.95</span>
                  <span className="text-lg text-brand-text-light line-through">$80.00</span>
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full">SAVE 25%</span>
                </div>
                <div className="text-brand-text-light text-xs mt-3 space-y-1">
                  <div>1 x 15ml Ultra BCP Oil (valued at $45)</div>
                  <div>1 x 10g Bodease Balm (valued at $25)</div>
                  <div>Free standard shipping (valued at $10)</div>
                  <div className="font-semibold mt-2">Total value: $80</div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                {[
                  'Systemic BCP support for balance from within',
                  'Targeted topical relief for aches and discomfort',
                  'Perfect low-risk introduction to natural wellness',
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-brand-text text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="#checkout"
                className="block w-full bg-brand-gold hover:bg-brand-gold-light text-white text-center px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Your Wellness Revival Kit
              </a>
              <p className="text-center text-brand-text-light text-xs mt-3">
                Secure checkout with multiple payment options available
              </p>
            </div>
          </div>
        </div>

        {/* Individual products */}
        <div className="mt-16">
          <h3 className="text-center text-2xl font-bold text-brand-green-dark mb-8">Also Available Individually</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Droplets size={32} className="text-brand-green" />,
                name: 'Ultra BCP Oil',
                desc: 'Our hero product. Supports your endocannabinoid system (CB2 receptors) to help restore balance from the inside out.',
                tag: 'Systemic Support',
              },
              {
                icon: <Sparkles size={32} className="text-brand-green" />,
                name: "Bodease Balm",
                desc: 'Targeted topical support for localised pain and inflammation. Apply directly where you need it most.',
                tag: 'Topical Relief',
              },
              {
                icon: <Shield size={32} className="text-brand-green" />,
                name: 'Sleep in a Bottle',
                desc: 'Supports your sleep and nervous system, helping you drift off naturally and wake feeling restored.',
                tag: 'Sleep Support',
              },
            ].map((product, i) => (
              <div key={i} className="bg-brand-cream rounded-2xl p-6 text-center border border-brand-cream-dark hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {product.icon}
                </div>
                <span className="text-brand-gold text-xs font-semibold uppercase tracking-wider">{product.tag}</span>
                <h4 className="text-xl font-bold text-brand-green-dark mt-2 mb-3">{product.name}</h4>
                <p className="text-brand-text-light text-sm leading-relaxed">{product.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
