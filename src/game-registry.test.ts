import { describe, expect, it } from "vitest";
import { combineButtons, effectiveFrameRate, games, getGame } from "./game-registry";
import { clampJoystick, joystickDirections } from "./joystick";
import { resolveLayoutOrientation } from "./layout";
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

  it("selects controls and timing per game", () => {
    expect(getGame("street-fight-dojo").controller).toBe("joystick");
    expect(getGame("secret-console").controller).toBe("dpad");
    expect(effectiveFrameRate(getGame("street-fight-dojo"), 60)).toBe(60);
    expect(effectiveFrameRate(getGame("secret-console"), 60)).toBe(51);
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
  it("cycles through all five skins", () => {
    expect(nextSkin("white")).toBe("dark");
    expect(nextSkin("dark")).toBe("rainbow");
    expect(nextSkin("rainbow")).toBe("high-contrast-light");
    expect(nextSkin("high-contrast-light")).toBe("high-contrast-dark");
    expect(nextSkin("high-contrast-dark")).toBe("white");
  });
});

describe("joystick", () => {
  it("maps cardinal zones to one direction", () => {
    expect(joystickDirections(0, -10, 20)).toEqual(["up"]);
    expect(joystickDirections(10, 0, 20)).toEqual(["right"]);
    expect(joystickDirections(0, 10, 20)).toEqual(["down"]);
    expect(joystickDirections(-10, 0, 20)).toEqual(["left"]);
  });

  it("maps all diagonal zones to two simultaneous directions", () => {
    expect(joystickDirections(10, -10, 20)).toEqual(["up", "right"]);
    expect(joystickDirections(10, 10, 20)).toEqual(["down", "right"]);
    expect(joystickDirections(-10, 10, 20)).toEqual(["down", "left"]);
    expect(joystickDirections(-10, -10, 20)).toEqual(["up", "left"]);
    expect(combineButtons(joystickDirections(10, -10, 20))).toBe(1 | 8);
  });

  it("ignores small center movements and limits knob travel", () => {
    expect(joystickDirections(2, 2, 20)).toEqual([]);
    expect(joystickDirections(8, 0, 20)).toEqual([]);
    expect(clampJoystick(30, 40, 20)).toEqual({ x: 12, y: 16 });
  });

  it("uses arcade-style hysteresis around the engagement point", () => {
    expect(joystickDirections(7, 0, 20, ["right"])).toEqual(["right"]);
    expect(joystickDirections(5, 0, 20, ["right"])).toEqual([]);
    expect(joystickDirections(9, 0, 20)).toEqual(["right"]);
  });
});

describe("layout orientation", () => {
  it("uses usable viewport dimensions when no device signal exists", () => {
    expect(resolveLayoutOrientation(800, 400)).toBe("landscape");
    expect(resolveLayoutOrientation(400, 800)).toBe("portrait");
  });

  it("uses device orientation when an embedded viewport keeps stale dimensions", () => {
    expect(resolveLayoutOrientation(400, 800, "landscape-primary", true)).toBe("landscape");
  });

  it("keeps usable viewport dimensions authoritative outside an embed", () => {
    expect(resolveLayoutOrientation(400, 800, "landscape-primary")).toBe("portrait");
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

  it("restores both high contrast skin preferences", () => {
    expect(loadSettings({ getItem: () => JSON.stringify({ skin: "high-contrast-light" }) }).skin).toBe("high-contrast-light");
    expect(loadSettings({ getItem: () => JSON.stringify({ skin: "high-contrast-dark" }) }).skin).toBe("high-contrast-dark");
  });
});
