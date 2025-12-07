import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-gold/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-gold/10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
            Join Our Family
          </span>
          
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Give Your Child the Gift of{" "}
            <span className="text-gold">Quality Education</span>
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Enrollment is now open for the new academic session. Take the first step 
            towards securing your child's bright future with Al-Mustapha Schools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold-dark font-semibold px-8">
              <Link to="/login">
                Access Student Portal
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5">
              <a href="tel:+2348001234567">
                <Phone className="w-5 h-5 mr-2" />
                Contact Admissions
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-12 border-t border-border">
            <p className="text-sm text-muted-foreground mb-6">
              Trusted by parents and recognized for excellence
            </p>
            <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">NTI</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">WAEC</p>
                <p className="text-xs text-muted-foreground">Center</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">NECO</p>
                <p className="text-xs text-muted-foreground">Center</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">JAMB</p>
                <p className="text-xs text-muted-foreground">CBT Center</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
