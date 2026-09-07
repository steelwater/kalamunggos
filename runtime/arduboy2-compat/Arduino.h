#pragma once

#include <cstdint>
#include <cstdlib>
#include <cstring>

class __FlashStringHelper;
#define F(value) (reinterpret_cast<const __FlashStringHelper*>(value))
#define PROGMEM

inline long random(long maximum) { return maximum > 0 ? std::rand() % maximum : 0; }
inline long random(long minimum, long maximum) { return minimum + random(maximum - minimum); }
