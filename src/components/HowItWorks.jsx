export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Your Body Has a Built-In Balance System',
      description: 'Your endocannabinoid system (ECS) plays a vital role in regulating pain, sleep, mood, and inflammation. When it\'s functioning well, you feel balanced and energised. When it\'s not, things start to unravel.',
    },
    {
      number: '02',
      title: 'Stress & Modern Life Can Disrupt It',
      description: 'Chronic stress, poor sleep, and the daily pressures of modern life can leave your ECS struggling to keep up. The result? Persistent discomfort, restless nights, and that feeling of being "not quite yourself."',
    },
    {
      number: '03',
      title: 'BCP Supports Your CB2 Receptors',
      description: 'Beta-Caryophyllene (BCP), the hero ingredient in Canna Oils Ultra, naturally interacts with your CB2 receptors — part of your endocannabinoid system — to help support your body\'s own ability to restore balance.',
    },
    {
      number: '04',
      title: 'Your Body Begins to Find Its Balance',
      description: 'With daily use as part of your wellness routine, many of our customers report feeling calmer, sleeping more soundly, and moving through their day with greater ease. It\'s not a quick fix — it\'s lasting support.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-brand-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="text-brand-gold font-semibold text-sm uppercase tracking-widest">The Science, Made Simple</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark mt-3 leading-tight">
            How Canna Oils Supports You
          </h2>
          <p className="text-brand-text-light mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            There's no single silver bullet for wellness. But understanding how your body works is the first step towards supporting it naturally.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-cream-dark hover:shadow-md transition-shadow">
              <span className="text-5xl font-bold text-brand-gold/20 absolute top-4 right-6 font-[var(--font-heading)]">
                {step.number}
              </span>
              <div className="relative">
                <h3 className="text-xl font-bold text-brand-green-dark mb-3 pr-12">{step.title}</h3>
                <p className="text-brand-text-light leading-relaxed text-sm sm:text-base">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key message */}
        <div className="mt-14 bg-brand-green-dark rounded-2xl p-8 md:p-10 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            It's Not About a Quick Fix
          </h3>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            We don't believe in magic pills. Canna Oils is designed to be an excellent addition to your wellness toolkit — supporting your body, complementing lifestyle changes, and helping you feel like your old self again, one day at a time.
          </p>
          <a
            href="#kit"
            className="inline-block bg-brand-gold hover:bg-brand-gold-light text-white px-8 py-3.5 rounded-full text-base font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Support Your System Today
          </a>
        </div>
      </div>
    </section>
  );
}
