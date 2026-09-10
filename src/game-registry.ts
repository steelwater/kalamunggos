export const BUTTONS = {
  up: 1,
  down: 2,
  left: 4,
  right: 8,
  a: 16,
  b: 32,
} as const;

export type ButtonName = keyof typeof BUTTONS;

export interface GameDefinition {
  id: string;
  displayName: string;
  repository: string;
  branch: "main";
  sourcePath: string;
  modulePath: string;
  moduleFactory: string;
}

export const games: readonly GameDefinition[] = [
  {
    id: "street-fight-dojo",
    displayName: "Street Fight Dojo",
    repository: "https://github.com/steelwater/Street-Fight-Dojo",
    branch: "main",
    sourcePath: "arduboy/StreetFightDojo/StreetFightDojo.ino",
    modulePath: "games/street-fight-dojo.js",
    moduleFactory: "Kalamunggos_street_fight_dojo",
  },
  {
    id: "secret-console",
    displayName: "Secret Console",
    repository: "https://github.com/steelwater/Secret-Console",
    branch: "main",
    sourcePath: "arduboy/SecretConsole/SecretConsole.ino",
    modulePath: "games/secret-console.js",
    moduleFactory: "Kalamunggos_secret_console",
  },
] as const;

export function getGame(gameId: string): GameDefinition {
  const game = games.find((candidate) => candidate.id === gameId);
  if (!game) throw new Error(`Unknown game: ${gameId}`);
  return game;
}

export function combineButtons(buttons: Iterable<ButtonName>): number {
  let mask = 0;
  for (const button of buttons) mask |= BUTTONS[button];
  return mask;
}
