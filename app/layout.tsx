import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata = { title: "Esports Tournament & Player Management" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">EsportsHub</Link>
          <nav>
            <Link href="/players">Players</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/tournaments">Tournaments</Link>
            <Link href="/matches">Matches</Link>
            <Link href="/stats">Stats</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
