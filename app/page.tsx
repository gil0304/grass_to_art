"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function login() {
    setLoading(true);
    const year = new Date().getFullYear();
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "read:user",
        redirectTo: `${location.origin}/auth/callback?year=${year}&next=/editor`,
      },
    });
    if (error) {
      setLoading(false);
      alert(error.message);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-950 px-6 text-center text-neutral-100">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          草を、<span className="text-emerald-400">作品</span>に。
        </h1>
        <p className="mx-auto max-w-md text-neutral-400">
          GitHub の1年間のコントリビューションを、ポスターに変換
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {configured ? (
          <button
            onClick={login}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "リダイレクト中…" : "GitHub でログイン"}
          </button>
        ) : (
          <p className="rounded-md border border-amber-600/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            Supabase 未設定です（<code>.env.local</code>{" "}
            を設定するとログインが有効化されます）。
          </p>
        )}
        <Link
          href="/editor?demo=1"
          className="text-sm text-neutral-400 underline hover:text-neutral-200"
        >
          ログインせずデモを見る →
        </Link>
      </div>
    </main>
  );
}
