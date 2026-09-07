#include <algorithm>
#include <cassert>
#include <cstdint>
#include <iostream>

extern "C" {
void kalamunggos_setup();
void kalamunggos_frame(std::uint8_t buttons);
std::uint8_t* kalamunggos_framebuffer();
int kalamunggos_eeprom_dirty();
void kalamunggos_clear_eeprom_dirty();
int kalamunggos_tone_count();
}

void press(std::uint8_t button) {
  kalamunggos_frame(button);
  kalamunggos_frame(0);
}

int main() {
  kalamunggos_setup();
  kalamunggos_frame(0);
  const auto* pixels = kalamunggos_framebuffer();
  assert(std::count(pixels, pixels + 128 * 64, std::uint8_t{1}) > 10);

#ifdef EXPECT_STREET_FIGHT_DOJO
  assert(kalamunggos_eeprom_dirty() == 1);
  kalamunggos_clear_eeprom_dirty();

  press(16);  // Main menu -> character selection.
  press(16);  // Ryu -> move selection.
  press(16);  // Hadouken -> training.
  press(2);   // Down.
  press(2 | 8);  // Down-right diagonal.
  press(8);   // Right.
  press(16);  // A completes the move.

  assert(kalamunggos_tone_count() > 0);
  assert(kalamunggos_eeprom_dirty() == 1);
#endif

#ifdef EXPECT_SECRET_CONSOLE
  press(1);   // Leave the startup screen.
  press(1);   // Up.
  press(1);   // Up.
  press(16);  // A completes the Moon Cat code.
  assert(kalamunggos_tone_count() > 0);
#endif

  std::cout << "setup, loop, framebuffer, controls, sound, and save hooks passed\n";
}
