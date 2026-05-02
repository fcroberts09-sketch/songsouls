import Hero from "@/components/Hero";
import SongShowcase from "@/components/SongShowcase";
import HowItWorks from "@/components/HowItWorks";
import PricingTiers from "@/components/PricingTiers";
import Testimonials from "@/components/Testimonials";
import CtaBand from "@/components/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SongShowcase />
      <HowItWorks />
      <PricingTiers />
      <Testimonials />
      <CtaBand />
    </>
  );
}
