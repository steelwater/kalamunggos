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
      skin: saved.skin === "dark" || saved.skin === "rainbow" ? saved.skin : "white",
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
