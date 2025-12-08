import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-primary-foreground">
                  Al-Mustapha
                </h3>
                <p className="text-xs text-primary-foreground/70">
                  Nursery, Primary & College
                </p>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Excellence from Cradle to College. Nurturing young minds with 
              quality education rooted in moral values.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {["About Us", "Admissions", "Academics", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-primary-foreground/70 hover:text-gold transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Our Sections
            </h4>
            <ul className="space-y-2">
              {["Nursery School", "Primary School", "College (Secondary)"].map(
                (section) => (
                  <li key={section}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/70 hover:text-gold transition-colors duration-200"
                    >
                      {section}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4 text-gold">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span className="text-sm text-primary-foreground/70">
                  Al-Mustapha, Ogidi, Ilorin, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <span className="text-sm text-primary-foreground/70">
                  +234 800 123 4567
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold shrink-0" />
                <span className="text-sm text-primary-foreground/70">
                  info@almustapha.edu.ng
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Al-Mustapha Schools. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-primary-foreground/60 hover:text-gold transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-primary-foreground/60 hover:text-gold transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
