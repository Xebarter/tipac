export function Features() {
  const features = [
    {
      title: "Creative Expression",
      description: "We provide a safe space for children to express themselves through theatre, dance, and music.",
      icon: "🎭",
    },
    {
      title: "Skills Development",
      description: "Children learn valuable life skills including teamwork, communication, and public speaking.",
      icon: "💪",
    },
    {
      title: "Cultural Heritage",
      description: "We celebrate and preserve Uganda's rich cultural heritage through traditional storytelling.",
      icon: "🏛️",
    },
    {
      title: "Community Building",
      description: "Our programs bring communities together and create lasting connections among participants.",
      icon: "🤝",
    },
  ];

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">What We Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-background rounded-lg border border-border p-6 shadow-sm">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
