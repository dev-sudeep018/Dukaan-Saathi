import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Problem from "../components/Problem";
import HowItWorks from "../components/HowItWorks";
import LiveDemo from "../components/LiveDemo";
import MagicLoop from "../components/MagicLoop";
import Impact from "../components/Impact";
import Comparison from "../components/Comparison";
import DashboardToggle from "../components/DashboardToggle";
import TeamCTA from "../components/TeamCTA";
import Footer from "../components/Footer";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveDemo />
        <MagicLoop />
        <Impact />
        <Comparison />
        <DashboardToggle />
        <TeamCTA />
      </main>
      <Footer />
    </div>
  );
}
