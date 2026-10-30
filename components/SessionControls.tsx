"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "./SessionProvider";
export default function SessionControls() {
  const user = useUser();
  const router = useRouter();
  return user ? (
    <span className="session">
      {user.username} · {user.role}{" "}
      <button
        onClick={async () => {
          try {
            const res = await fetch("/api/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!res.ok) throw new Error("Sign out failed");
            router.push("/login");
            router.refresh();
          } catch {
            alert("Could not sign out. Please retry.");
          }
        }}
      >
        Sign out
      </button>
    </span>
  ) : (
    <Link href="/login">Sign in</Link>
  );
}
