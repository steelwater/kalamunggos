#pragma once

#include <algorithm>
#include <cstddef>
#include <cstring>
#include "../core/runtime.hpp"

class EEPROMClass {
 public:
  template <typename Value>
  Value& get(int address, Value& value) {
    const auto safe = safeSize<Value>(address);
    std::memcpy(&value, kalamunggos::Runtime::instance().eeprom.data() + address, safe);
    return value;
  }

  template <typename Value>
  const Value& put(int address, const Value& value) {
    const auto safe = safeSize<Value>(address);
    auto& runtime = kalamunggos::Runtime::instance();
    if (std::memcmp(runtime.eeprom.data() + address, &value, safe) != 0) {
      std::memcpy(runtime.eeprom.data() + address, &value, safe);
      runtime.eepromDirty = true;
    }
    return value;
  }

 private:
  template <typename Value>
  static std::size_t safeSize(int address) {
    if (address < 0 || static_cast<std::size_t>(address) >= kalamunggos::eepromSize) return 0;
    return std::min(sizeof(Value), kalamunggos::eepromSize - static_cast<std::size_t>(address));
  }
};

inline EEPROMClass EEPROM;
