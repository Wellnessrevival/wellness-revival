export default function Footer() {
  return (
    <footer className="bg-brand-green-dark text-white">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-[var(--font-heading)] text-xl font-semibold mb-4">Canna Oils</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Helping Australians feel like themselves again through natural, plant-based wellness support.
            </p>
            <p className="text-white/50 text-xs">Australian Owned & Operated</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-brand-gold">Quick Links</h4>
            <ul className="space-y-2.5">
              <li><a href="#why" className="text-white/70 hover:text-white text-sm transition-colors">Why Canna Oils</a></li>
              <li><a href="#kit" className="text-white/70 hover:text-white text-sm transition-colors">Wellness Revival Kit</a></li>
              <li><a href="#how-it-works" className="text-white/70 hover:text-white text-sm transition-colors">How It Works</a></li>
              <li><a href="#stories" className="text-white/70 hover:text-white text-sm transition-colors">Customer Stories</a></li>
              <li><a href="#checkout" className="text-white/70 hover:text-white text-sm transition-colors">Shop Now</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-brand-gold">Support</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">FAQs</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-brand-gold">Connect</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Facebook</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Instagram</a></li>
              <li><a href="#" className="text-white/70 hover:text-white text-sm transition-colors">Email Newsletter</a></li>
            </ul>
            <div className="mt-6">
              <p className="text-white/50 text-xs leading-relaxed">
                Have questions? We're here to help.<br />
                <a href="mailto:hello@canna-oils.com.au" className="text-brand-gold hover:text-brand-gold-light transition-colors">
                  hello@canna-oils.com.au
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-white/40 text-xs leading-relaxed text-center max-w-3xl mx-auto">
            <strong>Disclaimer:</strong> Canna Oils products are not intended to diagnose, treat, cure, or prevent any disease. The information provided on this website is for educational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare professional before starting any new supplement or wellness program. Individual results may vary.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-white/30 text-xs text-center">
            &copy; {new Date().getFullYear()} Canna Oils Pty Ltd. All rights reserved. Australian Owned & Operated.
          </p>
        </div>
      </div>
    </footer>
  );
}
