# Kalamunggos architecture

Kalamunggos has four deliberately small layers:

- `games/` contains Git submodules pointing to the canonical game repositories.
- `runtime/` implements only the Arduino, Arduboy2, ArduboyTones, and EEPROM behavior used by the bundled games. Emscripten compiles each original sketch and this compatibility layer into a WebAssembly module.
- `src/` provides the game registry, per-game persistence, audio bridge, input mapping, per-game timing, viewport state, and virtual handheld UI.
- `src/skins.ts` and CSS custom properties keep visual treatment separate from input and gameplay behavior.

The logical framebuffer is always 128 × 64 monochrome pixels. Canvas and CSS perform nearest-neighbor presentation scaling. JavaScript schedules game frames at the native frame rate multiplied by an optional registry value; games without an override remain at native speed. Each sketch's existing `nextFrame()` gate remains the compatibility boundary.

Controller choice is also registry-owned. The D-pad and eight-way joystick both produce the same digital button mask, so diagonal joystick input is represented by two simultaneous directional bits rather than a separate analog protocol.

EEPROM is a 1 KiB buffer persisted to a separate local-storage key for each stable game ID. Tone sequences cross the WebAssembly boundary as frequency/duration pairs and are played through Web Audio when sound is enabled.

Development synchronization follows each upstream repository's `main` branch. Only `npm run sync:games` updates the tracked revisions in `game-builds.lock.json`. Normal builds validate both submodule checkouts against that lock before compiling and generate `public/games/build-metadata.json` from the validated locked revisions. Release artifacts contain those compiled modules and never download executable game code at runtime.
