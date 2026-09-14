# Kalamunggos

A focused virtual handheld for two Arduboy-compatible games: [Street Fight Dojo](https://github.com/steelwater/Street-Fight-Dojo) and [Secret Console](https://github.com/steelwater/Secret-Console).

Kalamunggos is intentionally not a general-purpose Arduboy or AVR emulator. It compiles the games' original Arduino C++ sources against a small compatibility layer, presents their 128 × 64 monochrome framebuffer in a touch-friendly handheld, and keeps saves isolated per game.

## Prerequisites

- Node.js 22 or newer
- Emscripten (`brew install emscripten` on macOS)
- Git with submodule support

## Start development

```sh
git clone --recurse-submodules https://github.com/steelwater/kalamunggos.git
cd kalamunggos
npm install
npm run dev
```

To update both games to the latest `main` commits before starting:

```sh
npm run dev:latest
```

Review and commit changed submodule pointers after syncing. Release builds must use the exact tested pointers rather than automatically advancing them.

## Verify and build

```sh
npm run check
```

This runs TypeScript behavior tests, compiles both real sketches against the native compatibility runtime, validates their setup/loop/framebuffer hooks, and produces the web bundle plus exact game commit metadata.

## Mobile shells

The repository includes Capacitor shells for iOS and Android. After a successful web build, synchronize the web bundle into both projects:

```sh
npm run cap:sync
```

Open the resulting native projects with `npx cap open ios` or `npx cap open android`. Signing and store ownership remain release decisions.

Keyboard controls for desktop development are the arrow keys, `Z` for A, `X` for B, and Escape for the Kalamunggos menu.

The Change Skin menu includes White, Dark, Rainbow, High Contrast Light, and High Contrast Dark. Street Fight Dojo uses an eight-way digital touch joystick while Secret Console retains the D-pad. Layout changes follow the usable viewport and react immediately to resize and orientation signals, including an embedded-player fallback for itch.io.

See [docs/architecture.md](docs/architecture.md) for boundaries and runtime details.
