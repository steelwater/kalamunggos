#include "runtime.hpp"

void setup();
void loop();

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define KALAMUNGGOS_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define KALAMUNGGOS_EXPORT
#endif

extern "C" {
KALAMUNGGOS_EXPORT void kalamunggos_setup() { setup(); }
KALAMUNGGOS_EXPORT void kalamunggos_frame(std::uint8_t buttons) {
  kalamunggos::Runtime::instance().beginFrame(buttons);
  loop();
}
KALAMUNGGOS_EXPORT std::uint8_t* kalamunggos_framebuffer() { return kalamunggos::Runtime::instance().framebuffer.data(); }
KALAMUNGGOS_EXPORT int kalamunggos_frame_rate() { return kalamunggos::Runtime::instance().frameRate; }
KALAMUNGGOS_EXPORT std::uint8_t* kalamunggos_eeprom_data() { return kalamunggos::Runtime::instance().eeprom.data(); }
KALAMUNGGOS_EXPORT int kalamunggos_eeprom_size() { return static_cast<int>(kalamunggos::eepromSize); }
KALAMUNGGOS_EXPORT int kalamunggos_eeprom_dirty() { return kalamunggos::Runtime::instance().eepromDirty ? 1 : 0; }
KALAMUNGGOS_EXPORT void kalamunggos_clear_eeprom_dirty() { kalamunggos::Runtime::instance().eepromDirty = false; }
KALAMUNGGOS_EXPORT kalamunggos::Tone* kalamunggos_tones() { return kalamunggos::Runtime::instance().tones.data(); }
KALAMUNGGOS_EXPORT int kalamunggos_tone_count() { return static_cast<int>(kalamunggos::Runtime::instance().toneCount); }
KALAMUNGGOS_EXPORT void kalamunggos_clear_tones() { kalamunggos::Runtime::instance().clearTones(); }
}
