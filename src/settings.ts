import type { SkinId } from "./skins";

export interface Settings {
  skin: SkinId;
  sound: boolean;
  vibration: boolean;
  titleDisplay: boolean;
}

export const defaultSettings: Settings = {
  skin: "white",
  sound: true,
  vibration: true,
  titleDisplay: true,
};

const key = "kalamunggos:settings";

export function loadSettings(storage: Pick<Storage, "getItem"> = localStorage): Settings {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? "null") as Partial<Settings> | null;
    if (!saved) return { ...defaultSettings };
    return {
      skin: saved.skin && ["white", "dark", "rainbow", "high-contrast-light", "high-contrast-dark"].includes(saved.skin)
        ? saved.skin as SkinId
        : "white",
      sound: saved.sound ?? true,
      vibration: saved.vibration ?? true,
      titleDisplay: saved.titleDisplay ?? true,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(key, JSON.stringify(settings));
}
