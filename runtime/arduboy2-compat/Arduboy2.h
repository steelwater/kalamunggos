#pragma once

#include "Arduino.h"
#include "../core/runtime.hpp"

constexpr std::uint8_t UP_BUTTON = 1;
constexpr std::uint8_t DOWN_BUTTON = 2;
constexpr std::uint8_t LEFT_BUTTON = 4;
constexpr std::uint8_t RIGHT_BUTTON = 8;
constexpr std::uint8_t A_BUTTON = 16;
constexpr std::uint8_t B_BUTTON = 32;
constexpr bool BLACK = false;
constexpr bool WHITE = true;

class Arduboy2 {
 public:
  struct Audio { bool enabled = true; } audio;
  std::uint32_t frameCount = 0;

  void begin() { kalamunggos::Runtime::instance().begin(); }
  void setFrameRate(std::uint8_t rate) { kalamunggos::Runtime::instance().frameRate = rate; }
  void initRandomSeed() { std::srand(0x4b414c41); }
  bool nextFrame() { frameCount = kalamunggos::Runtime::instance().frameCount; return true; }
  void pollButtons() { kalamunggos::Runtime::instance().pollButtons(); }
  bool pressed(std::uint8_t mask) const { return kalamunggos::Runtime::instance().pressed(mask); }
  bool justPressed(std::uint8_t mask) const { return kalamunggos::Runtime::instance().justPressed(mask); }
  void clear() { kalamunggos::Runtime::instance().clear(); }
  void display() {}
  void fillScreen(bool color) { kalamunggos::Runtime::instance().clear(color); }
  void drawPixel(std::int16_t x, std::int16_t y, bool color) { kalamunggos::Runtime::instance().drawPixel(x,y,color); }
  void drawLine(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1, bool color) { kalamunggos::Runtime::instance().drawLine(x0,y0,x1,y1,color); }
  void drawFastHLine(std::int16_t x, std::int16_t y, std::int16_t width, bool color) { kalamunggos::Runtime::instance().drawLine(x,y,x+width-1,y,color); }
  void drawRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color) { kalamunggos::Runtime::instance().drawRect(x,y,width,height,color); }
  void fillRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color) { kalamunggos::Runtime::instance().fillRect(x,y,width,height,color); }
  void drawCircle(std::int16_t x, std::int16_t y, std::int16_t radius, bool color) { kalamunggos::Runtime::instance().drawCircle(x,y,radius,color); }
  void drawTriangle(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1, std::int16_t x2, std::int16_t y2, bool color) { kalamunggos::Runtime::instance().drawTriangle(x0,y0,x1,y1,x2,y2,color); }
  void drawRoundRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, std::int16_t radius, bool color) { kalamunggos::Runtime::instance().drawRoundRect(x,y,width,height,radius,color); }
  void setCursor(std::int16_t x, std::int16_t y) { kalamunggos::Runtime::instance().setCursor(x,y); }
  void setTextColor(bool color) { kalamunggos::Runtime::instance().setTextColor(color); }
  void print(const char* value) { kalamunggos::Runtime::instance().print(value); }
  void print(const __FlashStringHelper* value) { kalamunggos::Runtime::instance().print(reinterpret_cast<const char*>(value)); }
  void print(char value) { kalamunggos::Runtime::instance().print(value); }
  void print(unsigned char value) { kalamunggos::Runtime::instance().printNumber(value); }
  void print(int value) { kalamunggos::Runtime::instance().printNumber(value); }
  void print(unsigned int value) { kalamunggos::Runtime::instance().printNumber(value); }
  void print(long value) { kalamunggos::Runtime::instance().printNumber(value); }
  void print(unsigned long value) { kalamunggos::Runtime::instance().printNumber(static_cast<long>(value)); }
};
