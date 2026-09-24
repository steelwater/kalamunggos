import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const games = [
  { id: "street-fight-dojo", displayName: "Street Fight Dojo", path: "games/street-fight-dojo" },
  { id: "secret-console", displayName: "Secret Console", path: "games/secret-console" },
];

export function readCurrentGames(repoRoot) {
  return games.map((game) => ({
    id: game.id,
    displayName: game.displayName,
    commit: execFileSync("git", ["-C", resolve(repoRoot, game.path), "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  }));
}

export function readLockedGames(repoRoot) {
  const lockPath = resolve(repoRoot, "game-builds.lock.json");
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  if (!Array.isArray(lock.games)) throw new Error(`${lockPath} must contain a games array.`);
  return lock.games;
}

function assertKnownGames(gameList, source) {
  for (const game of games) {
    const candidate = gameList.find((item) => item.id === game.id);
    if (!candidate || candidate.displayName !== game.displayName || typeof candidate.commit !== "string") {
      throw new Error(`${source} is missing a valid ${game.displayName} revision.`);
    }
  }
  if (gameList.length !== games.length) throw new Error(`${source} contains unexpected game revisions.`);
}

export function validateLockedGames(lockedGames, currentGames) {
  assertKnownGames(lockedGames, "game-builds.lock.json");
  assertKnownGames(currentGames, "Current submodules");

  for (const locked of lockedGames) {
    const current = currentGames.find((game) => game.id === locked.id);
    if (current.commit !== locked.commit) {
      throw new Error(
        `Game revision mismatch for ${locked.displayName}: locked ${locked.commit}, checked out ${current.commit}. ` +
        "Run npm run sync:games to update game revisions intentionally.",
      );
    }
  }
}

function writeRuntimeMetadata(repoRoot, pinnedGames, builtAt) {
  const output = resolve(repoRoot, "public/games/build-metadata.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({ builtAt, games: pinnedGames }, null, 2)}\n`);
}

export function validateAndGenerateMetadata(repoRoot, currentGames, builtAt = new Date().toISOString()) {
  const lockedGames = readLockedGames(repoRoot);
  validateLockedGames(lockedGames, currentGames);
  writeRuntimeMetadata(repoRoot, lockedGames, builtAt);
  return lockedGames;
}

export function updateLockAndMetadata(repoRoot, currentGames, builtAt = new Date().toISOString()) {
  assertKnownGames(currentGames, "Current submodules");
  writeFileSync(resolve(repoRoot, "game-builds.lock.json"), `${JSON.stringify({ games: currentGames }, null, 2)}\n`);
  writeRuntimeMetadata(repoRoot, currentGames, builtAt);
  return currentGames;
}

function main() {
  const updateLock = process.argv.slice(2).includes("--update-lock");
  const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--update-lock");
  if (unknownArguments.length) throw new Error(`Unknown argument: ${unknownArguments[0]}`);

  const currentGames = readCurrentGames(root);
  if (updateLock) updateLockAndMetadata(root, currentGames);
  else validateAndGenerateMetadata(root, currentGames);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
