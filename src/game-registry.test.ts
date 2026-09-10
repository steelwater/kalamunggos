import { describe, expect, it } from "vitest";
import { combineButtons, games, getGame } from "./game-registry";
import { assetUrl, eepromStorageKey } from "./runtime/wasm-game";
import { nextSkin } from "./skins";
import { loadSettings } from "./settings";

describe("game registry", () => {
  it("defines stable, unique IDs for both source games", () => {
    expect(games.map((game) => game.id)).toEqual(["street-fight-dojo", "secret-console"]);
    expect(new Set(games.map((game) => game.id)).size).toBe(games.length);
  });

  it("rejects an unknown game", () => {
    expect(() => getGame("other")).toThrow("Unknown game");
  });

  it("preserves simultaneous button inputs", () => {
    expect(combineButtons(["down", "right", "a"])).toBe(2 | 8 | 16);
  });

  it("isolates EEPROM storage by stable game ID", () => {
    expect(eepromStorageKey(games[0].id)).not.toBe(eepromStorageKey(games[1].id));
  });

  it("resolves game assets relative to a nested deployment path", () => {
    expect(assetUrl("games/street-fight-dojo.wasm", "https://example.com/build/42/index.html")).toBe(
      "https://example.com/build/42/games/street-fight-dojo.wasm",
    );
  });
});

describe("skins", () => {
  it("cycles through all three skins", () => {
    expect(nextSkin("white")).toBe("dark");
    expect(nextSkin("dark")).toBe("rainbow");
    expect(nextSkin("rainbow")).toBe("white");
  });
});

describe("settings", () => {
  it("recovers safely from invalid local data", () => {
    expect(loadSettings({ getItem: () => "not-json" })).toEqual({ skin: "white", sound: true, vibration: true, titleDisplay: true });
  });

  it("adds the title display default to existing saved settings", () => {
    expect(loadSettings({ getItem: () => JSON.stringify({ skin: "dark", sound: false, vibration: false }) })).toEqual({
      skin: "dark",
      sound: false,
      vibration: false,
      titleDisplay: true,
    });
  });

  it("restores a hidden title display preference", () => {
    expect(loadSettings({ getItem: () => JSON.stringify({ titleDisplay: false }) }).titleDisplay).toBe(false);
  });
});
