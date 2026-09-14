# ePaper, controls, timing, and orientation test notes

## Automated and local browser checks

- The registry selects the joystick for Street Fight Dojo and the D-pad for Secret Console.
- All four joystick diagonal zones produce two directional bits; the dead zone and travel clamp are covered by tests.
- The joystick uses arcade-style hysteresis: input engages after a 42% throw and releases within 28% of center, preventing micro-movement chatter.
- Secret Console schedules a 60 FPS game at 51 FPS while Street Fight Dojo remains at 60 FPS.
- All five skins cycle and both high-contrast choices survive settings reload.
- High Contrast Light and High Contrast Dark were inspected on the Game Select and paused System Menu surfaces.
- High Contrast Light was visually rechecked with black bezel padding around the game canvas.
- A 390 × 844 browser viewport was changed live to 844 × 390 and back while Street Fight Dojo and its System Menu were open. Content and controls reflowed without a reload or clipping.
- A diagonal joystick drag returned the knob to center on release.

## Physical-device feedback

- Mobile play testing found the joystick sensitivity improved after adding arcade-style hysteresis.
- Mobile screenshots exposed white bezel padding in High Contrast Light; the bezel was changed to black and still needs confirmation on the target device.

## Physical-device checks still required

- Repeat both high-contrast skin checks on the real ePaper phone.
- Repeat portrait-to-landscape-to-portrait rotation on the published-style itch.io page while the library, each game, and the paused menu are visible.
- Compare Secret Console motion against the previous deployed build and tune the 0.85 multiplier only if play testing calls for it.
- Confirm simultaneous joystick plus A/B touch input on the target phone.
