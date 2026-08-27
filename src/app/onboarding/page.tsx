import { Navbar } from "@/components/layout/navbar";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return <div className="min-h-screen bg-[#f3efe4]"><Navbar /><OnboardingFlow /></div>;
}
