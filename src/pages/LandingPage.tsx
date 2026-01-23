import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, School, Phone, Mail, MapPin, Menu, X, ArrowRight, BookOpen, Trophy, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logo from "/Almustapha.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- 🎨 NEW NAVY-DOMINANT CHECK PATTERN ---
  // Background is solid Navy. Green lines cross it.
  const checkPatternStyle = {
    backgroundColor: '#020617', // Base: Very Dark Navy (slate-950)
    backgroundImage: `
      /* 1. Thin Red Lines (Accents) - Top Layer */
      linear-gradient(90deg, transparent 49%, rgba(220, 38, 38, 0.8) 49%, rgba(220, 38, 38, 0.8) 50%, transparent 50%),
      linear-gradient(0deg, transparent 49%, rgba(220, 38, 38, 0.8) 49%, rgba(220, 38, 38, 0.8) 50%, transparent 50%),
      
      /* 2. Thin White Lines (Offset Accents) - Middle Layer */
      linear-gradient(90deg, transparent 44%, rgba(255, 255, 255, 0.15) 44%, rgba(255, 255, 255, 0.15) 45%, transparent 45%),
      linear-gradient(0deg, transparent 44%, rgba(255, 255, 255, 0.15) 44%, rgba(255, 255, 255, 0.15) 45%, transparent 45%),

      /* 3. Green Stripes (The Grid) - Bottom Layer */
      /* Note: We use transparent gaps so the Navy background shows through most of the time */
      linear-gradient(90deg, transparent 15%, rgba(22, 163, 74, 0.4) 15%, rgba(22, 163, 74, 0.4) 35%, transparent 35%),
      linear-gradient(0deg, transparent 15%, rgba(22, 163, 74, 0.4) 15%, rgba(22, 163, 74, 0.4) 35%, transparent 35%)
    `,
    backgroundSize: '80px 80px', // Slightly larger to show more Navy space
  };

  const galleryImages = [
    { src: "https://placehold.co/600x400/1e3a8a/ffffff?text=Academic+Excellence", alt: "Students in Library" },
    { src: "https://placehold.co/600x400/ca8a04/ffffff?text=Sports+Day", alt: "Sports Activities" },
    { src: "https://placehold.co/600x400/15803d/ffffff?text=Graduation", alt: "Graduation" },
    { src: "https://placehold.co/600x400/ea580c/ffffff?text=Science+Lab", alt: "Laboratory" },
    { src: "https://placehold.co/600x400/7c3aed/ffffff?text=Cultural+Day", alt: "Cultural Events" },
  ];

  return (
    // Background: Cream (#FDFBF7) for the "Shirt" body
    <div className="min-h-screen font-sans bg-yellow-250/50 overflow-x-hidden selection:bg-blue-200">
      
      {/* --- INJECTED CSS FOR SCROLLING ANIMATION --- */}
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* --- NAVBAR --- */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-xl py-0' : 'bg-yellow-200/25 py-4'}`}>
        <div className={`absolute inset-0 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`} style={checkPatternStyle}>
            {/* Minimal overlay so the Navy pattern is clearly visible */}
            <div className="absolute inset-0 bg-slate-950/20" /> 
        </div>

        <div className="container mx-auto px-4 flex justify-between items-center relative z-10 h-16">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full shadow-md">
                <img src={logo} alt="Al-Mustapha Logo" className="w-10 h-10 md:w-14 md:h-14 rounded-full" />
            </div>
            <div>
                {/* Text switches to White on scroll, Navy on Cream background */}
                <h1 className={`font-bold text-lg md:text-xl leading-tight ${scrolled ? 'text-white' : 'text-blue-950'}`}>Almustapha Model Schools</h1>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${scrolled ? 'text-yellow-400' : 'text-yellow-600'}`}>Knowledge is Light</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['about', 'gallery', 'proprietor', 'contact'].map(item => (
                 <button key={item} onClick={() => scrollToSection(item)} className={`text-sm font-bold uppercase tracking-wide hover:text-yellow-500 transition-colors ${scrolled ? 'text-gray-200' : 'text-blue-900'}`}>{item.replace('_', ' ')}</button>
            ))}
            
            {/* Login Button with Navy Check Pattern */}
            <Button onClick={() => navigate('/login')} className="relative overflow-hidden border-2 border-yellow-500 font-bold text-white shadow-md group">
                <div className="absolute inset-0" style={checkPatternStyle} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <span className="relative z-10">Portal Login</span>
            </Button>
          </nav>

          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className={`w-8 h-8 ${scrolled ? 'text-white' : 'text-blue-900'}`} /> : <Menu className={`w-8 h-8 ${scrolled ? 'text-white' : 'text-blue-900'}`} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#FDFBF7] shadow-xl border-t-4 border-blue-900 py-6 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
             {['about', 'gallery', 'proprietor', 'contact'].map(item => (
                 <button key={item} onClick={() => scrollToSection(item)} className="text-left py-2 font-bold text-blue-900 uppercase tracking-wider">{item.replace('_', ' ')}</button>
            ))}
             <hr className="border-blue-200"/>
             <Button onClick={() => navigate('/login')} className="w-full text-white py-6 text-lg relative overflow-hidden">
                <div className="absolute inset-0" style={checkPatternStyle} />
                <span className="relative z-10">Access Portal</span>
             </Button>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="relative h-screen min-w-screen flex items-center justify-center text-center px-4">
        {/* Subtle Navy Dots on Cream */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Navy/Check Side Bars */}
        {/*  */}

        <div className="relative z-10 max-w-5xl space-y-8 animate-in fade-in zoom-in duration-700 mt-16">
            <div className="inline-block relative">
                <Badge variant="secondary" className="bg-yellow-100/25 text-blue-900 border-blue-200 px-4 py-1 text-sm uppercase tracking-widest font-bold mb-4"></Badge>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 font-serif leading-tight">
              Nurturing <span className="relative inline-block text-blue-800">
                <span className="relative z-10">Leaders</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-yellow-300/50 -z-0 transform -rotate-2"></span>
              </span> of Tomorrow
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-light">
              Combining academic rigor with moral discipline in a supportive environment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
                <button onClick={() => navigate('/login')} className="relative group overflow-hidden rounded-md px-8 py-4 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="absolute  inset-0 opacity-100 group-hover:opacity-100 items-center transition-opacity duration-100 ease-in-out" 
                        style={checkPatternStyle}/>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <span className="relative z-10 text-white font-bold text-lg justify-center  flex items-center gap-2">
                         Student Portal
                    </span>
                </button>

                <Button onClick={() => navigate('/login')} size="lg" variant="outline" className="border-2 border-yellow-900 text-blue-950  bg-yellow-200/25 hover:bg-yellow-500/50 font-bold text-lg px-8 h-[60px]">
                     Staff Login
                </Button>
            </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-blue-900 animate-bounce cursor-pointer" onClick={() => scrollToSection('about')}>
           
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-24 px-4 relative">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Image Frame with Check Pattern */}
            <div className="relative p-4 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500" style={checkPatternStyle}>
                <div className="bg-white p-1 rounded-xl overflow-hidden h-[450px]">
                    <img src="https://placehold.co/800x1000/f1f5f9/1e293b?text=School+Building" alt="About Us" className="object-cover w-full h-full rounded-lg" />
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-8 h-1 bg-blue-800 inline-block"></span> About Us
                    </h2>
                    <h3 className="text-4xl font-bold text-slate-900 font-serif">A Legacy of Discipline & Knowledge.</h3>
                </div>
                <p className="text-slate-700 leading-relaxed text-lg">
                    Established with a vision to provide holistic education, Al-Mustapha Model College stands as a pillar of learning in Ilorin. We don't just teach; we mold character. Our unique blend of modern curriculum and moral upbringing ensures every child is prepared for the future.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <Card className="border-l-4 border-l-blue-800 shadow-md bg-white hover:shadow-lg transition-shadow"><CardContent className="p-6"><h4 className="font-bold text-lg text-slate-900 mb-1">Our Mission</h4><p className="text-sm text-slate-600"></p></CardContent></Card>
                    <Card className="border-l-4 border-l-yellow-500 shadow-md bg-white hover:shadow-lg transition-shadow"><CardContent className="p-6"><h4 className="font-bold text-lg text-slate-900 mb-1">Our Vision</h4><p className="text-sm text-slate-600"></p></CardContent></Card>
                </div>
            </div>
        </div>
      </section>

      {/* --- GALLERY SECTION (Full Check Pattern) --- */}
      <section id="gallery" className="py-24 relative text-white bg-yellow-200/25">
        <div className="absolute inset-0 " /> {/* Slightly darker overlay for text contrast */}
        
        <div className="container mx-auto relative z-10 overflow-hidden">
            <div className="text-center mb-16 px-4">
                <h2 className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-2">Campus Life</h2>
                <h3 className="text-4xl font-bold text-slate-500 font-serif">Moments at Al-Mustapha</h3>
            </div>
            
            <div className="relative min-w-screen overflow-hidden">
                <div className="flex w-max gap-6 animate-scroll">
                    {[...galleryImages, ...galleryImages, ...galleryImages].map((img, index) => (
                        <div key={index} className="w-[300px] md:w-[400px] h-[280px] rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl hover:border-yellow-500 transition-all flex-shrink-0 relative group">
                            <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-4 left-4">
                                <p className="text-yellow-400 text-xs font-bold uppercase mb-1">Gallery</p>
                                <p className="text-white font-bold text-lg">{img.alt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* --- PROPRIETOR SECTION --- */}
      <section id="proprietor" className="py-24 px-4 bg-[#FDFBF7]">
        <div className="container mx-auto max-w-5xl">
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-blue-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={checkPatternStyle}></div>

                <div className="w-full md:w-1/3 flex flex-col items-center relative z-10">
                    <div className="w-56 h-56 rounded-full p-2 bg-white shadow-xl mb-6 relative">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-900">
                             <img src="https://placehold.co/400x400/e2e8f0/1e293b?text=Proprietor" className="object-cover w-full h-full" alt="Proprietor" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-yellow-500 text-blue-900 p-3 rounded-full shadow-lg"><Star className="w-6 h-6 fill-current" /></div>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900">Alhaji Mustapha</h3>
                    <p className="text-blue-600 text-sm font-bold uppercase tracking-wider">Proprietor</p>
                </div>

                <div className="w-full md:w-2/3 space-y-6 relative z-10">
                    <span className="text-8xl font-serif text-blue-100 absolute -top-10 -left-4 select-none">“</span>
                    <h2 className="text-3xl font-bold text-slate-900">From the Desk of the Proprietor</h2>
                    <p className="text-lg leading-relaxed text-slate-600 italic">
                        "Welcome to Al-Mustapha Model College. Our commitment goes beyond academic excellence;
                         we are dedicated to molding character and instilling values that last a lifetime. 
                         We believe every student carries a unique potential, and it is our privilege to provide the environment 
                         to unlock it."
                    </p>
                    <div className="pt-4 border-t border-blue-50">
                        <p className="font-handwriting text-3xl text-blue-800 opacity-80">Alh. Mustapha</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className="relative text-blue-100 py-20 px-4">
         <div className="absolute inset-0 bg-slate-950" /> {/* Dark Overlay */}
         
         <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div><img src={logo} alt="Al-Mustapha Logo" className="w-16 h-12 rounded-full" /></div>
                    <h2 className="font-bold text-2xl text-white">Almustapha Model Schools</h2>
                </div>
                <p className="text-yellow-200/80 ">Knowledge Is Light</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Contact Us</h3>
                <ul className="space-y-4">
                    <li className="flex items-start gap-4"><MapPin className="w-5 h-5 text-yellow-500 shrink-0 mt-1" /><span>1. Ajao Mustapha Street Idi-Emi, Ogidi Area Ilorin, Kwara State.</span></li>
                    <li className="flex items-center gap-4"><Phone className="w-5 h-5 text-yellow-500 shrink-0" /><span>08053503125, 07036239149</span></li>
                    <li className="flex items-center gap-4"><Mail className="w-5 h-5 text-yellow-500 shrink-0" /><span>info@almustaphaschools.com</span></li>
                </ul>
            </div>

             <div className="space-y-6">
                <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Portal Access</h3>
                <div className="flex flex-col gap-4">
                    <Button 
                    onClick={() => navigate('/login')} className="bg-yellow-100 text-slate-950 hover:bg-yellow-400 w-full justify-center text-lg h-12 font-bold">
                         Student Login
                         </Button>
                    <Button onClick={() => navigate('/login')} variant="outline" className="bg-transparent border-blue-500 text-blue-100 hover:bg-blue-900 hover:text-white w-full justify-center text-lg h-12">Staff Login</Button>
                </div>
            </div>
         </div>

         <div className="border-t border-blue-800/50 pt-8 mt-16 text-center text-sm text-yellow-400/60 relative z-10">
            <p>© {new Date().getFullYear()} Almustapha Model College. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;