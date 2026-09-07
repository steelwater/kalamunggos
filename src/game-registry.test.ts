import { describe, expect, it } from "vitest";
import { combineButtons, games, getGame } from "./game-registry";
import { eepromStorageKey } from "./runtime/wasm-game";
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
    expect(loadSettings({ getItem: () => "not-json" })).toEqual({ skin: "white", sound: true, vibration: true });
  });
});
