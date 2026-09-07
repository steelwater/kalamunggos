export type SkinId = "white" | "dark" | "rainbow";

export interface SkinDefinition {
  id: SkinId;
  name: string;
  className: string;
}

export const skins: readonly SkinDefinition[] = [
  { id: "white", name: "White", className: "skin-white" },
  { id: "dark", name: "Dark", className: "skin-dark" },
  { id: "rainbow", name: "Rainbow", className: "skin-rainbow" },
] as const;

export function nextSkin(current: SkinId): SkinId {
  const index = skins.findIndex((skin) => skin.id === current);
  return skins[(index + 1) % skins.length].id;
}
