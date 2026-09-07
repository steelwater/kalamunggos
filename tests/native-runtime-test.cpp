#include <algorithm>
#include <cassert>
#include <cstdint>
#include <iostream>

extern "C" {
void kalamunggos_setup();
void kalamunggos_frame(std::uint8_t buttons);
std::uint8_t* kalamunggos_framebuffer();
int kalamunggos_eeprom_dirty();
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

#ifdef EXPECT_EEPROM
  assert(kalamunggos_eeprom_dirty() == 1);
#endif

#ifdef EXPECT_TONE
  press(1);
  press(1);
  press(1);
  press(16);
  assert(kalamunggos_tone_count() > 0);
#endif

  std::cout << "setup, loop, framebuffer, and compatibility hooks passed\n";
}
