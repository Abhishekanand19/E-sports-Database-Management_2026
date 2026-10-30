import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { currentUser } from '@/lib/auth';
import { SessionProvider } from '@/components/SessionProvider';
import SessionControls from '@/components/SessionControls';

export const metadata = { title: "Esports Tournament & Player Management" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user=await currentUser();
  return (
    <html lang="en">
      <body>
        <SessionProvider user={user}>
        <header className="nav">
          <Link href="/" className="brand">EsportsHub</Link>
          <nav>
            <Link href="/players">Players</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/tournaments">Tournaments</Link>
            <Link href="/matches">Matches</Link>
            <Link href="/stats">Stats</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </nav>
          <SessionControls />
        </header>
        <main className="container">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
