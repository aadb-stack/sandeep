import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sales Engineer",
  description:
    "Ingests your product docs & APIs, answers prospect technical questions, and generates custom demo code.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const shell = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );

  // ClerkProvider is only mounted when Clerk is configured; otherwise the app
  // renders the same shell in keyless mock mode.
  return env.hasClerk ? <ClerkProvider>{shell}</ClerkProvider> : shell;
}
