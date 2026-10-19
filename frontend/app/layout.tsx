import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CausalOpsDB-X — Infrastructure Change Intelligence & Counterfactual Simulation",
  description: "Evidence-grounded infrastructure change intelligence, digital twin, and pre-deployment impact assessment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-graphite-base text-text-primary antialiased selection:bg-accent-lime/20 selection:text-accent-lime">
        {children}
      </body>
    </html>
  );
}
