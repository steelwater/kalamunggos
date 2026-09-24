import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { updateLockAndMetadata, validateAndGenerateMetadata } from "./generate-build-metadata.mjs";

const revisions = {
  street: "523eebada0cd5ac50e4d9f43bcd328a08e5a2fff",
  secret: "961dadcf245edaaa6fccb5d50582bca74d73f7f5",
};

const lockedGames = [
  { id: "street-fight-dojo", displayName: "Street Fight Dojo", commit: revisions.street },
  { id: "secret-console", displayName: "Secret Console", commit: revisions.secret },
];

let repoRoot;

function lockContents() {
  return readFileSync(join(repoRoot, "game-builds.lock.json"), "utf8");
}

beforeEach(() => {
  repoRoot = mkdtempSync(join(tmpdir(), "kalamunggos-metadata-test-"));
  mkdirSync(join(repoRoot, "public/games"), { recursive: true });
  writeFileSync(join(repoRoot, "game-builds.lock.json"), `${JSON.stringify({ games: lockedGames }, null, 2)}\n`);
});

afterEach(() => {
  rmSync(repoRoot, { recursive: true, force: true });
});

describe("game build metadata", () => {
  it("generates runtime metadata when both checked-out revisions match the lock", () => {
    const before = lockContents();
    validateAndGenerateMetadata(repoRoot, lockedGames, "2026-09-24T00:00:00.000Z");

    expect(lockContents()).toBe(before);
    expect(JSON.parse(readFileSync(join(repoRoot, "public/games/build-metadata.json"), "utf8"))).toEqual({
      builtAt: "2026-09-24T00:00:00.000Z",
      games: lockedGames,
    });
  });

  it("rejects a Secret Console mismatch without changing the lock", () => {
    const before = lockContents();
    const currentGames = lockedGames.map((game) => game.id === "secret-console" ? { ...game, commit: "secret-mismatch" } : game);

    expect(() => validateAndGenerateMetadata(repoRoot, currentGames)).toThrow("Game revision mismatch for Secret Console");
    expect(lockContents()).toBe(before);
  });

  it("rejects a Street Fight Dojo mismatch without changing the lock", () => {
    const before = lockContents();
    const currentGames = lockedGames.map((game) => game.id === "street-fight-dojo" ? { ...game, commit: "street-mismatch" } : game);

    expect(() => validateAndGenerateMetadata(repoRoot, currentGames)).toThrow("Game revision mismatch for Street Fight Dojo");
    expect(lockContents()).toBe(before);
  });

  it("allows explicit synchronization to update the lock and runtime metadata", () => {
    const synchronizedGames = lockedGames.map((game) => ({ ...game, commit: `${game.commit}-updated` }));
    updateLockAndMetadata(repoRoot, synchronizedGames, "2026-09-24T01:00:00.000Z");

    expect(JSON.parse(lockContents())).toEqual({ games: synchronizedGames });
    expect(JSON.parse(readFileSync(join(repoRoot, "public/games/build-metadata.json"), "utf8"))).toEqual({
      builtAt: "2026-09-24T01:00:00.000Z",
      games: synchronizedGames,
    });
  });
});
