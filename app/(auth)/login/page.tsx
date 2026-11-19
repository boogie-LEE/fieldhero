"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 py-10 bg-gradient-to-b from-brand-50 to-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">FieldHero</span>
        </Link>
        <div className="card p-6">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your workspace.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="text-sm text-slate-500 mt-4 text-center">
            No account?{" "}
            <Link href="/signup" className="text-brand-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
