import type { Metadata } from "next";
import { HeroTuner } from "@/components/HeroTuner";

export const metadata: Metadata = {
  title: "Générateur hero",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function HeroToolPage() {
  return <HeroTuner />;
}
