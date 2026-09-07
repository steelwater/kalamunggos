# Kalamunggos architecture

Kalamunggos has four deliberately small layers:

- `games/` contains Git submodules pointing to the canonical game repositories.
- `runtime/` implements only the Arduino, Arduboy2, ArduboyTones, and EEPROM behavior used by the bundled games. Emscripten compiles each original sketch and this compatibility layer into a WebAssembly module.
- `src/` provides the game registry, per-game persistence, audio bridge, input mapping, and virtual handheld UI.
- `src/skins.ts` and CSS custom properties keep visual treatment separate from input and gameplay behavior.

The logical framebuffer is always 128 × 64 monochrome pixels. Canvas and CSS perform nearest-neighbor presentation scaling. JavaScript drives one game frame per animation frame; each sketch's existing `nextFrame()` gate remains the compatibility boundary.

EEPROM is a 1 KiB buffer persisted to a separate local-storage key for each stable game ID. Tone sequences cross the WebAssembly boundary as frequency/duration pairs and are played through Web Audio when sound is enabled.

Development synchronization follows each upstream repository's `main` branch. A build records the exact checked-out commit in `public/games/build-metadata.json`; release artifacts contain those compiled modules and never download executable game code at runtime.
