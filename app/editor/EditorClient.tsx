"use client";

import { useDeferredValue, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { ContributionData } from "@/lib/github/types";
import { DEFAULT_CONFIG, paperDims, type PosterConfig } from "@/lib/poster/config";
import { loadConfig, saveConfig } from "@/lib/poster/persist";
import { getFont } from "@/lib/fontStore";
import { Poster } from "@/components/poster/Poster";
import { Controls } from "@/components/editor/Controls";
import { exportSvg, exportPng } from "@/lib/export/downloadSvg";
import { exportPdf } from "@/lib/export/svgToPdf";

export function EditorClient({
  data,
  demo,
  needsFetch,
  notConfigured,
}: {
  data: ContributionData;
  demo?: boolean;
  needsFetch?: boolean;
  notConfigured?: boolean;
}) {
  const [config, setConfig] = useState<PosterConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const deferred = useDeferredValue(config);
  const svgRef = useRef<SVGSVGElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const [pane, setPane] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  // Restore saved settings on mount; persist on every change afterwards.
  useEffect(() => {
    const saved = loadConfig();
    if (saved) setConfig(saved);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveConfig(config);
  }, [config, loaded]);

  // After reload, a custom font has a fontId but no (ephemeral) URL — rebuild it
  // from the bytes stored in IndexedDB.
  useEffect(() => {
    if (!config.fontId || config.fontUrl) return;
    let cancelled = false;
    getFont(config.fontId).then((rec) => {
      if (rec && !cancelled) {
        const url = URL.createObjectURL(rec.blob);
        setConfig((c) => (c.fontId ? { ...c, fontUrl: url } : c));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [config.fontId, config.fontUrl]);

  // Load Google/custom fonts (at the chosen weight) so the preview renders them.
  useEffect(() => {
    if (!config.fontUrl) return;
    let cancelled = false;
    const face = new FontFace(config.font, `url(${config.fontUrl})`, {
      weight: String(config.fontWeight),
    });
    face
      .load()
      .then((f) => {
        if (!cancelled) document.fonts.add(f);
      })
      .catch((e) => console.warn(`[font] failed to load "${config.font}"`, e));
    return () => {
      cancelled = true;
    };
  }, [config.font, config.fontUrl, config.fontWeight]);

  // Measure the preview pane so the poster can be sized to fit it exactly.
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    const measure = () => setPane({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function patch(p: Partial<PosterConfig>) {
    setConfig((c) => ({ ...c, ...p }));
  }

  async function onSvg() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      await exportSvg(svgRef.current, `grass-${data.login}-${config.style}.svg`, {
        fontUrl: config.fontUrl,
        fontFamily: config.font,
      });
    } catch (e) {
      console.error(e);
      alert("SVG の書き出しに失敗しました: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onPng() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      await exportPng(svgRef.current, `grass-${data.login}-${config.style}.png`, {
        fontUrl: config.fontUrl,
        fontFamily: config.font,
      });
    } catch (e) {
      console.error(e);
      alert("PNG の書き出しに失敗しました: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onPdf() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      await exportPdf(svgRef.current, `grass-${data.login}-${config.style}.pdf`, {
        paper: config.paper,
        orientation: config.orientation,
        fontUrl: config.fontUrl ?? "/fonts/poster.ttf",
      });
    } catch (e) {
      console.error(e);
      alert("PDF の書き出しに失敗しました: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Size the poster to the largest rectangle that fits the pane (display only;
  // the mm print size is unchanged). The SVG box then hugs the poster exactly,
  // so the shadow wraps the poster rather than a wider empty frame.
  const dims = paperDims(deferred.paper, deferred.orientation);
  const ratio = dims.w / dims.h;
  const availW = Math.max(0, pane.w - 64);
  const availH = Math.max(0, pane.h - 64);
  let dispW = availW;
  let dispH = availW / ratio;
  if (dispH > availH) {
    dispH = availH;
    dispW = availH * ratio;
  }
  const previewStyle: CSSProperties =
    pane.w > 0 ? { width: `${dispW}px`, height: `${dispH}px` } : { maxHeight: "82vh", maxWidth: "100%" };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col gap-5 border-b border-neutral-800 p-5 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← トップ
          </Link>
          <span className="text-xs text-neutral-500">{data.weeks.length} 週ぶん</span>
        </div>

        {(demo || notConfigured) && (
          <Banner tone="info">
            {notConfigured ? "Supabase 未設定のためデモデータを表示中。" : "デモデータを表示中。"}
          </Banner>
        )}
        {needsFetch && (
          <Banner tone="warn">
            草データを取得できませんでした。<br />
            <RefetchLink>再取得（GitHub 再認証）</RefetchLink>
          </Banner>
        )}

        <Controls config={config} onChange={patch} />

        <div className="mt-auto flex flex-col gap-2 pt-4">
          <button
            onClick={onSvg}
            disabled={busy}
            className="rounded-md bg-emerald-500 px-4 py-2.5 font-medium text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "生成中…" : "SVG を書き出す"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPng}
              disabled={busy}
              className="rounded-md border border-neutral-700 px-4 py-2.5 font-medium text-neutral-200 hover:border-neutral-500 disabled:opacity-50"
            >
              {busy ? "生成中…" : "PNG"}
            </button>
            <button
              onClick={onPdf}
              disabled={busy}
              className="rounded-md border border-neutral-700 px-4 py-2.5 font-medium text-neutral-200 hover:border-neutral-500 disabled:opacity-50"
            >
              {busy ? "生成中…" : "PDF"}
            </button>
          </div>
        </div>
      </aside>

      {/* Preview */}
      <main ref={paneRef} className="flex flex-1 items-center justify-center overflow-hidden bg-neutral-900 p-6">
        <Poster
          ref={svgRef}
          data={data}
          config={deferred}
          style={previewStyle}
          className="shadow-2xl shadow-black/50"
        />
      </main>
    </div>
  );
}

function Banner({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "warn"
      ? "border-amber-600/40 bg-amber-500/10 text-amber-200"
      : "border-sky-600/40 bg-sky-500/10 text-sky-200";
  return <div className={`rounded-md border px-3 py-2 text-xs ${cls}`}>{children}</div>;
}

function RefetchLink({ children }: { children: React.ReactNode }) {
  async function refetch() {
    const { createClient, isSupabaseConfigured } = await import("@/lib/supabase/client");
    if (!isSupabaseConfigured()) return;
    const year = new Date().getFullYear();
    await createClient().auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "read:user",
        redirectTo: `${location.origin}/auth/callback?year=${year}&next=/editor`,
      },
    });
  }
  return (
    <button onClick={refetch} className="underline hover:no-underline">
      {children}
    </button>
  );
}
