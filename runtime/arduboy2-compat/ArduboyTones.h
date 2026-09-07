#pragma once

#include "../core/runtime.hpp"

class ArduboyTones {
 public:
  explicit ArduboyTones(bool& enabled) : enabled_(enabled) {}

  template <typename... Values>
  void tone(Values... values) {
    if (!enabled_) return;
    const std::uint16_t packed[] = {static_cast<std::uint16_t>(values)...};
    kalamunggos::Runtime::instance().addTones(packed, sizeof...(values));
  }

 private:
  bool& enabled_;
};
