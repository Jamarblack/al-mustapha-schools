import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import AcademicsSection from "@/components/home/AcademicsSection";
import StatsSection from "@/components/home/StatsSection";
import CTASection from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Al-Mustapha Schools | Nursery, Primary & College</title>
        <meta 
          name="description" 
          content="Excellence from Cradle to College. Al-Mustapha Schools offers quality education from nursery through secondary school with 100% WAEC success rate." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <AcademicsSection />
          <StatsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
