import { Benefits, Platform } from "../components/landing/platform";
import { Faq, Roadmap } from "../components/landing/roadmap-faq";
import { Footer } from "../components/landing/footer";
import { Header } from "../components/landing/header";
import { Hero } from "../components/landing/hero";
import { HowItWorks, WhyUs } from "../components/landing/features";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <WhyUs />
        <Platform />
        <Benefits />
        <Roadmap />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
