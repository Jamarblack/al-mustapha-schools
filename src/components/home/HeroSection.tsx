import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="text-center lg:text-left pt-20 lg:pt-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 text-gold text-sm font-medium mb-6 animate-fade-in">
              <GraduationCap className="w-4 h-4" />
              <span>Established 2014</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Excellence from{" "}
              <span className="text-gold relative">
                Cradle
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,8 Q50,0 100,8 T200,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gold/40"
                  />
                </svg>
              </span>{" "}
              to College
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Nurturing young minds with quality education rooted in moral values, 
              from early childhood through secondary education.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button asChild variant="hero">
                <Link to="/login">
                  Access Portal
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="hero-outline">
                <a href="#academics">
                  Explore Academics
                </a>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              {[
                { icon: Users, value: "2,500+", label: "Students" },
                { icon: BookOpen, value: "150+", label: "Teachers" },
                { icon: GraduationCap, value: "40+", label: "Years" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center lg:text-left">
                  <stat.icon className="w-6 h-6 text-gold mx-auto lg:mx-0 mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-primary-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-primary-foreground/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Element */}
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main Circle */}
              <div className="absolute inset-0 rounded-full border-4 border-gold/20 animate-float" />
              <div className="absolute inset-8 rounded-full border-2 border-gold/30" />
              
              {/* Center Content */}
              <div className="absolute inset-16 rounded-full bg-gold/10 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
                    <GraduationCap className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-display text-lg text-primary-foreground font-semibold">
                    Building Tomorrow's
                  </p>
                  <p className="text-gold font-display text-xl font-bold">
                    Leaders Today
                  </p>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-lg p-4 shadow-elevated animate-float" style={{ animationDelay: "0.5s" }}>
                <p className="text-sm font-semibold text-foreground">Nursery</p>
                <p className="text-xs text-muted-foreground">Early Years</p>
              </div>
              
              <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 bg-card rounded-lg p-4 shadow-elevated animate-float" style={{ animationDelay: "1s" }}>
                <p className="text-sm font-semibold text-foreground">Primary</p>
                <p className="text-xs text-muted-foreground">Foundation</p>
              </div>
              
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-card rounded-lg p-4 shadow-elevated animate-float" style={{ animationDelay: "1.5s" }}>
                <p className="text-sm font-semibold text-foreground">College</p>
                <p className="text-xs text-muted-foreground">Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-gold" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
