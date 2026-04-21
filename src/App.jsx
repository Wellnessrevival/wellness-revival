import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Empathy from './components/Empathy';
import ProductKit from './components/ProductKit';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Checkout from './components/Checkout';
import Footer from './components/Footer';

export default function App() {
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
