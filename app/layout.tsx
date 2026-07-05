import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title:       "Confidential Nexus — Zama Wrapper Registry",
  description: "The canonical dApp for the Zama ERC-20 ↔ ERC-7984 Wrapper Registry. Browse pairs, wrap tokens, decrypt balances and monitor the registry live.",
  keywords:    ["Zama","FHE","ERC-7984","confidential token","wrapper registry","fhEVM"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
