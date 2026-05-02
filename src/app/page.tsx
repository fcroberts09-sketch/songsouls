import Hero from "@/components/Hero";
import SongShowcase from "@/components/SongShowcase";
import WhyWeExist from "@/components/WhyWeExist";
import HowItWorks from "@/components/HowItWorks";
import PricingTiers from "@/components/PricingTiers";
import Testimonials from "@/components/Testimonials";
import CtaBand from "@/components/CtaBand";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SongShowcase />
      <WhyWeExist />
      <HowItWorks />
      <PricingTiers />
      <Testimonials />
      <CtaBand />
    </>
  );
}
