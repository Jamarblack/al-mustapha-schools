import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const academicSections = [
  {
    icon: Baby,
    title: "Early Years",
    subtitle: "Nursery Section",
    description: "A nurturing environment for children ages 2-5, using the Montessori method to foster curiosity, creativity, and social skills through play-based learning.",
    features: ["Montessori Curriculum", "Play-Based Learning", "Safe Environment", "Qualified Caregivers"],
    color: "bg-rose-500",
    colorLight: "bg-rose-50",
    textColor: "text-rose-600",
  },
  {
    icon: BookOpen,
    title: "Basic Education",
    subtitle: "Primary Section",
    description: "Building strong academic foundations for children ages 6-11, with a balanced curriculum that develops reading, writing, numeracy, and critical thinking.",
    features: ["Nigerian Curriculum", "ICT Integration", "Extra-Curricular", "Moral Education"],
    color: "bg-blue-600",
    colorLight: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    icon: GraduationCap,
    title: "College",
    subtitle: "Secondary Section",
    description: "Preparing students ages 12-18 for WAEC/NECO examinations with rigorous academics, career guidance, and character development for future success.",
    features: ["WAEC Excellence", "Science & Arts", "Career Counseling", "Leadership Programs"],
    color: "bg-gold",
    colorLight: "bg-amber-50",
    textColor: "text-amber-600",
  },
];

const AcademicsSection = () => {
  return (
    <section id="academics" className="py-20 md:py-28 bg-background relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-grid" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Our Programs
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Academic Excellence at Every Level
          </h2>
          <p className="text-lg text-muted-foreground">
            From early childhood education to college-preparatory programs, 
            we provide a seamless educational journey for every student.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger-children">
          {academicSections.map((section, idx) => (
            <Card
              key={idx}
              className="group relative bg-card border-border hover:border-gold/50 transition-all duration-300 hover:shadow-elevated overflow-hidden"
            >
              {/* Colored Top Bar */}
              <div className={`h-1.5 ${section.color} w-full`} />

              <CardHeader className="pb-4">
                <div className={`w-14 h-14 rounded-xl ${section.colorLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <section.icon className={`w-7 h-7 ${section.textColor}`} />
                </div>
                <CardTitle className="font-display text-2xl">{section.title}</CardTitle>
                <CardDescription className="text-sm font-medium text-gold">
                  {section.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {section.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {section.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-sm text-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full ${section.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button variant="ghost" className="group/btn p-0 h-auto text-primary hover:text-gold">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcademicsSection;
