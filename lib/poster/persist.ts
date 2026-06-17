import { DEFAULT_CONFIG, type PosterConfig } from "./config";

// Persist the editor config to localStorage so settings (style, palette, font
// choice, etc.) survive reloads. Uploaded-font BYTES live in IndexedDB
// (see lib/fontStore); here we only keep the reference (fontId), dropping the
// ephemeral object URL so it gets reconstructed on load.

const KEY = "grass-to-art:config";

export function saveConfig(config: PosterConfig): void {
  try {
    const toSave = config.fontId ? { ...config, fontUrl: null } : config;
    localStorage.setItem(KEY, JSON.stringify(toSave));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function loadConfig(): PosterConfig | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    // Merge over defaults so newly-added fields are always present.
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<PosterConfig>) };
  } catch {
    return null;
  }
}
