import Particals from "@/components/layout/Particals";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import HowItWorks from "@/components/layout/HowItWorks";
import Features from "@/components/layout/Features";
import Footer from "@/components/layout/Footer";

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Particals />
      <div className="relative z-10">
        <Navbar />
        <main className="relative z-10 pt-16">
          <Hero />
          <HowItWorks />
          <Features />
          <section id="pricing" className="scroll-mt-24" aria-hidden="true" />
          <section id="about" className="scroll-mt-24" aria-hidden="true" />
        </main>
        <Footer />
      </div>
    </div>
  );
}
