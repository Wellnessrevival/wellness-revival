import { Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "I was skeptical at first — I'd tried so many things. But after a few weeks with Ultra, I started waking up feeling more like myself. I have more energy for my grandkids and the afternoon slump has eased so much.",
      name: 'Margaret T.',
      location: 'Brisbane, QLD',
      detail: 'Ultra BCP Oil',
    },
    {
      quote: "The Bodease Balm has been a game-changer for my shoulders and lower back. I apply it before bed and the difference in how I feel in the morning is remarkable. I wish I'd found this sooner.",
      name: 'Sarah K.',
      location: 'Melbourne, VIC',
      detail: "Bodease Balm",
    },
    {
      quote: "Between work stress and the cost of everything going up, my sleep was terrible. Sleep in a Bottle has helped me drift off more naturally. I feel calmer and more in control of my day now.",
      name: 'Linda M.',
      location: 'Sydney, NSW',
      detail: 'Sleep in a Bottle',
    },
    {
      quote: "I love that it's natural and works with my body, not against it. I was nervous about relying on medications long-term, and Canna Oils has been a wonderful complement to the changes I've been making.",
      name: 'Diane R.',
      location: 'Perth, WA',
      detail: 'Ultra BCP Oil',
    },
  ];

  return (
    <section id="stories" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-brand-gold font-semibold text-sm uppercase tracking-widest">Real Stories, Real People</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark mt-3 leading-tight">
            Hear From Our Community
          </h2>
          <p className="text-brand-text-light mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Thousands of people worldwide are discovering what it feels like to support their body naturally. Here's what some of them have shared.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-brand-cream rounded-2xl p-6 md:p-8 border border-brand-cream-dark hover:shadow-md transition-shadow">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="text-brand-gold fill-brand-gold" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-brand-text leading-relaxed text-sm sm:text-base mb-6 italic">
                "{t.quote}"
              </blockquote>

              {/* Attribution */}
              <div className="flex items-center justify-between border-t border-brand-cream-dark pt-4">
                <div>
                  <p className="font-semibold text-brand-green-dark text-sm">{t.name}</p>
                  <p className="text-brand-text-light text-xs">{t.location}</p>
                </div>
                <span className="text-xs bg-brand-green-dark/10 text-brand-green-dark px-3 py-1 rounded-full font-medium">
                  {t.detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof stats */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: '5,000+', label: 'Happy Customers' },
            { number: '4.8/5', label: 'Average Rating' },
            { number: '92%', label: 'Would Recommend' },
            { number: '100%', label: 'Natural Ingredients' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4">
              <p className="text-3xl md:text-4xl font-bold text-brand-green-dark font-[var(--font-heading)]">{stat.number}</p>
              <p className="text-brand-text-light text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
