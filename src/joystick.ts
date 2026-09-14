import type { ButtonName } from "./game-registry";

export interface JoystickPosition {
  x: number;
  y: number;
}

const directions: readonly (readonly ButtonName[])[] = [
  ["right"],
  ["down", "right"],
  ["down"],
  ["down", "left"],
  ["left"],
  ["up", "left"],
  ["up"],
  ["up", "right"],
];

export function clampJoystick(x: number, y: number, radius: number): JoystickPosition {
  const distance = Math.hypot(x, y);
  if (distance <= radius || distance === 0) return { x, y };
  const scale = radius / distance;
  return { x: x * scale, y: y * scale };
}

export function joystickDirections(
  x: number,
  y: number,
  radius: number,
  previousDirections: readonly ButtonName[] = [],
): readonly ButtonName[] {
  const distance = Math.hypot(x, y);
  if (distance < radius * 0.28) return [];
  if (distance < radius * 0.42) return previousDirections;
  const octant = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  return directions[(octant + 8) % 8];
}
