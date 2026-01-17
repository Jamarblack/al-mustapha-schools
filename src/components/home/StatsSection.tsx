import { Award, Laptop, BookHeart, Trophy, CheckCircle } from "lucide-react";

const stats = [
  {
    icon: Trophy,
    value: "100%",
    label: "WAEC Success Rate",
    description: "Consistent excellence in public examinations",
  },
  {
    icon: BookHeart,
    value: "Montessori",
    label: "Teaching Method",
    description: "Child-centered learning approach",
  },
  {
    icon: Laptop,
    value: "Digital",
    label: "Smart Campus",
    description: "Modern ICT-enabled classrooms",
  },
];

const achievements = [
  "State-of-the-art Science Laboratories",
  "Well-stocked Library & E-Library",
  "Sports Complex & Swimming Pool",
  "Air-conditioned Classrooms",
  "School Bus Service Available",
  "24/7 Security & CCTV Coverage",
];

const StatsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pattern-dots opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Stats Row */}
        {/* <div className="grid md:grid-cols-1 gap-8 lg:gap-12 mb-16 stagger-children">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-8 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
                <stat.icon className="w-8 h-8 text-gold" />
              </div>
              <p className="font-display text-4xl md:text-5xl font-bold text-gold mb-2">
                {stat.value}
              </p>
              <p className="text-lg font-semibold text-primary-foreground mb-2">
                {stat.label}
              </p>
              <p className="text-sm text-primary-foreground/60">
                {stat.description}
              </p>
            </div>
          ))}
        </div> */}

        {/* Divider */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px bg-primary-foreground/20" />
          <Award className="w-8 h-8 text-gold" />
          <div className="flex-1 h-px bg-primary-foreground/20" />
        </div>

        {/* Achievements Grid */}
        <div className="text-center mb-12">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            World-Class Facilities
          </h3>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            We provide an enabling environment for learning with modern facilities
            that support holistic development.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10"
            >
              <CheckCircle className="w-5 h-5 text-gold shrink-0" />
              <span className="text-primary-foreground font-medium">
                {achievement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
