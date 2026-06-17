"use client";

import { useState, type ChangeEvent } from "react";
import {
  FONT_OPTIONS,
  FONT_WEIGHTS,
  PALETTES,
  PAPER_LABELS,
  PAPER_SIZES_MM,
  STYLE_LABELS,
  paletteById,
  type Palette,
  type PaperId,
  type PosterConfig,
  type StyleId,
} from "@/lib/poster/config";
import { saveFont } from "@/lib/fontStore";

export function Controls({
  config,
  onChange,
}: {
  config: PosterConfig;
  onChange: (patch: Partial<PosterConfig>) => void;
}) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <Field label="スタイル">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(STYLE_LABELS) as StyleId[]).map((id) => (
            <button
              key={id}
              onClick={() => onChange({ style: id })}
              className={`rounded-md border px-3 py-2 text-left transition ${
                config.style === id
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {STYLE_LABELS[id]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="配色">
        <div className="flex flex-wrap items-center gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              title={p.name}
              onClick={() => onChange({ palette: p.id, background: null })}
              className={`flex h-9 items-center gap-1 rounded-md border px-1.5 ${
                config.palette === p.id ? "border-emerald-500" : "border-neutral-700"
              }`}
            >
              {p.levels.map((c) => (
                <span key={c} className="h-5 w-2.5 rounded-sm" style={{ background: c }} />
              ))}
            </button>
          ))}
          <button
            onClick={() =>
              onChange(
                config.palette === "custom"
                  ? {}
                  : {
                      palette: "custom",
                      custom: { ...paletteById(config.palette), id: "custom", name: "カスタム" },
                      background: null,
                    },
              )
            }
            className={`h-9 rounded-md border px-3 ${
              config.palette === "custom"
                ? "border-emerald-500 text-emerald-300"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            カスタム
          </button>
        </div>
      </Field>

      {config.palette === "custom" && (
        <CustomColors custom={config.custom} onChange={(c) => onChange({ custom: c })} />
      )}

      <FontPicker config={config} onChange={onChange} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="用紙">
          <Select
            value={config.paper}
            onChange={(v) =>
              onChange({
                paper: v as PaperId,
                orientation: v === "card" ? "landscape" : "portrait",
              })
            }
            options={(Object.keys(PAPER_SIZES_MM) as PaperId[]).map((id) => {
              const d = PAPER_SIZES_MM[id];
              const dim = id === "card" ? "91×55" : `${d.w}×${d.h}`;
              return { value: id, label: `${PAPER_LABELS[id]} (${dim}mm)` };
            })}
          />
        </Field>
        <Field label="向き">
          <Select
            value={config.orientation}
            onChange={(v) => onChange({ orientation: v as PosterConfig["orientation"] })}
            options={[
              { value: "portrait", label: "縦" },
              { value: "landscape", label: "横" },
            ]}
          />
        </Field>
      </div>

      <Field label={`余白: ${config.margin}mm`}>
        <input
          type="range"
          min={4}
          max={60}
          value={config.margin}
          onChange={(e) => onChange({ margin: Number(e.target.value) })}
          className="w-full accent-emerald-500"
        />
      </Field>

      <Field label="タイトル">
        <input
          type="text"
          value={config.title ?? ""}
          placeholder="(GitHub ユーザー名)"
          onChange={(e) => onChange({ title: e.target.value || null })}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        />
      </Field>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-neutral-300">
            <input type="checkbox" checked={config.showStats} onChange={(e) => onChange({ showStats: e.target.checked })} className="accent-emerald-500" />
            統計を表示
          </label>
          <label className="flex items-center gap-2 text-neutral-300">
            <input type="checkbox" checked={config.showLegend} onChange={(e) => onChange({ showLegend: e.target.checked })} className="accent-emerald-500" />
            凡例を表示
          </label>
        </div>
        <button
          onClick={() => onChange({ seed: Math.floor(Math.random() * 1e9) })}
          className="self-start rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500"
          title="シードを変えると同じデータでも違う絵になります"
        >
          🎲 シード変更
        </button>
      </div>
    </div>
  );
}

function FontPicker({
  config,
  onChange,
}: {
  config: PosterConfig;
  onChange: (patch: Partial<PosterConfig>) => void;
}) {
  const [googleName, setGoogleName] = useState("");
  const presetValue = FONT_OPTIONS.find((f) => f.stack === config.font)?.stack ?? "";

  function applyGoogle() {
    const name = googleName.trim();
    if (!name) return;
    onChange({
      font: name,
      fontUrl: `/api/font?family=${encodeURIComponent(name)}&weight=${config.fontWeight}`,
      fontId: null,
    });
  }

  async function applyFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const id = crypto.randomUUID();
    await saveFont(id, file.name, buffer);
    const fam = `cf-${file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "-") || "custom"}`;
    onChange({ font: fam, fontUrl: URL.createObjectURL(new Blob([buffer])), fontId: id });
  }

  function setWeight(w: number) {
    const patch: Partial<PosterConfig> = { fontWeight: w };
    // Re-fetch Google fonts at the new weight.
    if (config.fontUrl?.startsWith("/api/font")) {
      patch.fontUrl = `/api/font?family=${encodeURIComponent(config.font)}&weight=${w}`;
    }
    onChange(patch);
  }

  return (
    <Field label="フォント">
      <div className="flex gap-2">
        <select
          value={presetValue}
          onChange={(e) => {
            if (e.target.value) onChange({ font: e.target.value, fontUrl: null, fontId: null });
          }}
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        >
          {!presetValue && <option value="">{config.fontUrl ? `現在: ${config.font}` : "プリセットを選択"}</option>}
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.stack}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={config.fontWeight}
          onChange={(e) => setWeight(Number(e.target.value))}
          title="太さ"
          className="shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        >
          {FONT_WEIGHTS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={googleName}
          placeholder="Google フォント名 (例: Roboto Slab)"
          onChange={(e) => setGoogleName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyGoogle();
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
        />
        <button onClick={applyGoogle} className="shrink-0 rounded-md border border-neutral-700 px-3 text-neutral-200 hover:border-neutral-500">
          読込
        </button>
      </div>

      <label className="mt-1 flex flex-col gap-1 text-xs text-neutral-400">
        フォントを追加（.ttf / .otf / .woff・保存されます）
        <input
          type="file"
          accept=".ttf,.otf,.woff,.woff2,font/*"
          onChange={applyFile}
          className="text-xs text-neutral-300 file:mr-2 file:rounded file:border-0 file:bg-neutral-700 file:px-2 file:py-1 file:text-neutral-100"
        />
      </label>

      {config.fontUrl && <span className="text-xs text-emerald-400">適用中: {config.font}</span>}
    </Field>
  );
}

function CustomColors({
  custom,
  onChange,
}: {
  custom: Palette;
  onChange: (c: Palette) => void;
}) {
  const setLevel = (i: number, v: string) => {
    const levels = [...custom.levels] as Palette["levels"];
    levels[i] = v;
    onChange({ ...custom, levels });
  };
  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-700 p-3">
      <div className="grid grid-cols-3 gap-2">
        <ColorInput label="背景" value={custom.bg} onChange={(v) => onChange({ ...custom, bg: v })} />
        <ColorInput label="文字" value={custom.fg} onChange={(v) => onChange({ ...custom, fg: v })} />
        <ColorInput label="強調" value={custom.accent} onChange={(v) => onChange({ ...custom, accent: v })} />
      </div>
      <span className="text-xs text-neutral-400">濃淡（薄 → 濃）</span>
      <div className="grid grid-cols-5 gap-1.5">
        {custom.levels.map((c, i) => (
          <ColorInput key={i} label={`${i}`} value={c} onChange={(v) => setLevel(i, v)} />
        ))}
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col items-center gap-1 text-[10px] text-neutral-400">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full cursor-pointer rounded border border-neutral-700 bg-transparent"
      />
      <span>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-neutral-100 outline-none focus:border-emerald-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
