import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { updateLockAndMetadata, validateGameRevisions, writeRuntimeMetadata } from "./generate-build-metadata.mjs";

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
  it("validates matching revisions before generating runtime metadata", () => {
    const before = lockContents();
    const validatedGames = validateGameRevisions(repoRoot, lockedGames);
    writeRuntimeMetadata(repoRoot, validatedGames, "2026-09-24T00:00:00.000Z");

    expect(lockContents()).toBe(before);
    expect(JSON.parse(readFileSync(join(repoRoot, "public/games/build-metadata.json"), "utf8"))).toEqual({
      builtAt: "2026-09-24T00:00:00.000Z",
      games: lockedGames,
    });
  });

  it("rejects a Secret Console mismatch without changing the lock", () => {
    const before = lockContents();
    const currentGames = lockedGames.map((game) => game.id === "secret-console" ? { ...game, commit: "secret-mismatch" } : game);

    expect(() => validateGameRevisions(repoRoot, currentGames)).toThrow("Game revision mismatch for Secret Console");
    expect(lockContents()).toBe(before);
  });

  it("rejects a Street Fight Dojo mismatch without changing the lock", () => {
    const before = lockContents();
    const currentGames = lockedGames.map((game) => game.id === "street-fight-dojo" ? { ...game, commit: "street-mismatch" } : game);

    expect(() => validateGameRevisions(repoRoot, currentGames)).toThrow("Game revision mismatch for Street Fight Dojo");
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

  it("does not refresh runtime metadata when the second game compilation fails", () => {
    const scriptsDir = join(repoRoot, "scripts");
    const fakeBin = join(repoRoot, "fake-bin");
    const outputDir = join(repoRoot, "public/games");
    const metadataPath = join(outputDir, "build-metadata.json");
    const emccState = join(repoRoot, "emcc-count");
    const nodeLog = join(repoRoot, "node-calls");
    mkdirSync(scriptsDir, { recursive: true });
    mkdirSync(fakeBin, { recursive: true });
    writeFileSync(join(scriptsDir, "build-games"), readFileSync(new URL("./build-games", import.meta.url), "utf8"));
    chmodSync(join(scriptsDir, "build-games"), 0o755);
    writeFileSync(metadataPath, "existing successful build metadata\n");

    writeFileSync(join(fakeBin, "node"), `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$FAKE_NODE_LOG"
if [[ "$1" == *generate-build-metadata.mjs ]]; then
  if [[ "\${2:-}" == "--write-metadata" ]]; then
    printf 'new metadata\\n' > "${metadataPath}"
  fi
  exit 0
fi
printf 'generated source\\n' > "$3"
`);
    chmodSync(join(fakeBin, "node"), 0o755);

    writeFileSync(join(fakeBin, "emcc"), `#!/usr/bin/env bash
set -euo pipefail
count=0
if [[ -f "$FAKE_EMCC_STATE" ]]; then count="$(<"$FAKE_EMCC_STATE")"; fi
count=$((count + 1))
printf '%s' "$count" > "$FAKE_EMCC_STATE"
if [[ "$count" -eq 2 ]]; then exit 42; fi
while [[ "$#" -gt 0 ]]; do
  if [[ "$1" == "-o" ]]; then printf 'first game artifact\\n' > "$2"; exit 0; fi
  shift
done
`);
    chmodSync(join(fakeBin, "emcc"), 0o755);

    const result = spawnSync(join(scriptsDir, "build-games"), {
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH}`,
        FAKE_EMCC_STATE: emccState,
        FAKE_NODE_LOG: nodeLog,
      },
    });

    expect(result.status).toBe(42);
    expect(readFileSync(metadataPath, "utf8")).toBe("existing successful build metadata\n");
    expect(readFileSync(nodeLog, "utf8")).toContain("--validate-only");
    expect(readFileSync(nodeLog, "utf8")).not.toContain("--write-metadata");
  });
});
