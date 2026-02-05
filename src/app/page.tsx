import { runOnboarding } from "@/lib/onboarding";
import ClientPage from "./client-page";

export default async function Home() {
  // Run onboarding on server
  const onboardingResult = await runOnboarding();
  
  return <ClientPage onboardingResult={onboardingResult} />;
}
