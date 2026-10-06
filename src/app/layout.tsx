import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";
import { MoisProvider } from "@/lib/mois-context";
import "./globals.css";

const corps = Barlow({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--police-corps" });
const titres = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--police-titres" });

export const metadata: Metadata = {
  title: "Fiches journalières · Pizza Time",
  description: "Lecture des fiches journalières par photo, journal, heures de l'équipe et photos archivées",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${corps.variable} ${titres.variable}`}>
      <body>
        <MoisProvider>
          <header className="entete">
            <Logo />
            <Navigation />
          </header>
          <main className="page">{children}</main>
        </MoisProvider>
      </body>
    </html>
  );
}
