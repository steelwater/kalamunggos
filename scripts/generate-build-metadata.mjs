import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const games = [
  { id: "street-fight-dojo", displayName: "Street Fight Dojo", path: "games/street-fight-dojo" },
  { id: "secret-console", displayName: "Secret Console", path: "games/secret-console" },
];

const metadata = {
  builtAt: new Date().toISOString(),
  games: games.map((game) => ({
    id: game.id,
    displayName: game.displayName,
    commit: execFileSync("git", ["-C", resolve(root, game.path), "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  })),
};

const output = resolve(root, "public/games/build-metadata.json");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`);
