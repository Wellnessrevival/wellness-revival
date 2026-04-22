import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import ReactGA from 'react-ga4';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-brand-green-dark/95 backdrop-blur-sm fixed w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="#" className="text-white font-[var(--font-heading)] text-xl md:text-2xl font-semibold tracking-wide">
              Canna Oils
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#why" onClick={() => ReactGA.event({category: 'navigation', action: 'section_clicked', label: 'why_canna_oils'})} className="text-white/80 hover:text-white text-sm font-medium transition-colors">Why Canna Oils</a>
            <a href="#kit" onClick={() => ReactGA.event({category: 'navigation', action: 'section_clicked', label: 'the_kit'})} className="text-white/80 hover:text-white text-sm font-medium transition-colors">The Kit</a>
            <a href="#how-it-works" onClick={() => ReactGA.event({category: 'navigation', action: 'section_clicked', label: 'how_it_works'})} className="text-white/80 hover:text-white text-sm font-medium transition-colors">How It Works</a>
            <a href="#stories" onClick={() => ReactGA.event({category: 'navigation', action: 'section_clicked', label: 'stories'})} className="text-white/80 hover:text-white text-sm font-medium transition-colors">Stories</a>
            <a
              href="#checkout"
              onClick={() => ReactGA.event({category: 'navigation', action: 'cta_clicked', label: 'get_your_kit'})}
              className="bg-brand-gold hover:bg-brand-gold-light text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Get Your Kit
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-white/10">
            <div className="flex flex-col space-y-3 pt-4">
              <a href="#why" onClick={() => {setIsOpen(false); ReactGA.event({category: 'navigation', action: 'mobile_section_clicked', label: 'why_canna_oils'});}} className="text-white/80 hover:text-white text-sm font-medium px-2 py-1">Why Canna Oils</a>
              <a href="#kit" onClick={() => {setIsOpen(false); ReactGA.event({category: 'navigation', action: 'mobile_section_clicked', label: 'the_kit'});}} className="text-white/80 hover:text-white text-sm font-medium px-2 py-1">The Kit</a>
              <a href="#how-it-works" onClick={() => {setIsOpen(false); ReactGA.event({category: 'navigation', action: 'mobile_section_clicked', label: 'how_it_works'});}} className="text-white/80 hover:text-white text-sm font-medium px-2 py-1">How It Works</a>
              <a href="#stories" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-sm font-medium px-2 py-1">Stories</a>
              <a
                href="#checkout"
                onClick={() => setIsOpen(false)}
                className="bg-brand-gold hover:bg-brand-gold-light text-white px-6 py-2.5 rounded-full text-sm font-semibold text-center transition-all"
              >
                Get Your Kit
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
