export default function Empathy() {
  return (
    <section id="why" className="py-16 md:py-24 bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-brand-gold font-semibold text-sm uppercase tracking-widest">We Understand</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-green-dark mt-3 leading-tight">
            Feeling the Weight of the World?
          </h2>
        </div>

        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-brand-text-light">
          <p>
            Between the rising cost of groceries, the fuel crisis, and the constant juggle of work and family — it's no wonder your body is feeling the strain. The stress doesn't just stay in your mind. It settles into your shoulders, your lower back, your restless nights.
          </p>
          <p>
            Maybe you're waking up feeling like you barely slept. Perhaps the afternoon slump hits harder than ever, and you find yourself reaching for another coffee just to get through the day. The aches that used to come and go now seem to linger. And that spark of energy you once had? It feels like a distant memory.
          </p>
          <p className="text-brand-text font-medium text-lg sm:text-xl">
            You're not imagining it. And you're certainly not alone.
          </p>
          <p>
            When life puts your body under constant pressure, your internal systems — especially your endocannabinoid system — can struggle to keep up. The result? Pain that won't ease, sleep that won't come, and a growing sense that you're losing touch with the person you used to be.
          </p>
        </div>

        {/* Pain points grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          {[
            { emoji: '😴', text: 'Waking up sore and exhausted, no matter how long you sleep' },
            { emoji: '😓', text: 'Hitting a wall of fatigue every afternoon' },
            { emoji: '🌙', text: 'Lying awake at night, worrying about tomorrow' },
            { emoji: '💪', text: 'Persistent aches that stop you enjoying daily life' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-brand-cream-dark flex items-start gap-4">
              <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
              <p className="text-brand-text text-sm sm:text-base leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl sm:text-2xl font-[var(--font-heading)] text-brand-green-dark font-semibold italic">
            "Your well-being isn't a luxury — it's essential."
          </p>
          <p className="text-brand-text-light mt-4 text-base sm:text-lg max-w-2xl mx-auto">
            That's why we created something to help you take that first step back to balance — without the big financial commitment.
          </p>
        </div>
      </div>
    </section>
  );
}
