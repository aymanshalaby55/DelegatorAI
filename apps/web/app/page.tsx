import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import Features from "@/components/layout/Features";
import HowItWorks from "@/components/layout/HowitWorks";
import Footer from "@/components/layout/Footer";
import Particals from "@/components/layout/Particals";

export default function Page() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Particals />
      </div>
      <div className="relative z-10">
        <Navbar />
        <main className="relative z-1 pt-16">
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
