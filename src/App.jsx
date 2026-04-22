import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Empathy from './components/Empathy';
import ProductKit from './components/ProductKit';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Checkout from './components/Checkout';
import Footer from './components/Footer';
import Success from './components/Success';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Check if we're on the success page
    if (window.location.pathname === '/success') {
      setCurrentPage('success');
    } else {
      setCurrentPage('home');
    }
  }, []);

  if (currentPage === 'success') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Success />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Empathy />
      <ProductKit />
      <HowItWorks />
      <Testimonials />
      <Checkout />
      <Footer />
    </div>
  );
}
