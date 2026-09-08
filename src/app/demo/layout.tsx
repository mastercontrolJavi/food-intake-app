import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Interactive demo",
  description: "Explore Intake with a realistic, fictional nutrition and activity history. No account required.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell displayName="Alex Morgan" email="alex@example.com" demoMode>{children}</AppShell>;
}
