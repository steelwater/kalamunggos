#pragma once

#include <array>
#include <cstddef>
#include <cstdint>

namespace kalamunggos {

constexpr int screenWidth = 128;
constexpr int screenHeight = 64;
constexpr std::size_t framebufferSize = screenWidth * screenHeight;
constexpr std::size_t eepromSize = 1024;
constexpr std::size_t maxTones = 24;

struct Tone {
  std::uint16_t frequency;
  std::uint16_t duration;
};

class Runtime {
 public:
  static Runtime& instance();

  void begin();
  void beginFrame(std::uint8_t buttons);
  void pollButtons();
  bool pressed(std::uint8_t mask) const;
  bool justPressed(std::uint8_t mask) const;

  void clear(bool color = false);
  void drawPixel(std::int16_t x, std::int16_t y, bool color);
  void drawLine(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1, bool color);
  void drawRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color);
  void fillRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color);
  void drawCircle(std::int16_t x, std::int16_t y, std::int16_t radius, bool color);
  void drawTriangle(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1,
                    std::int16_t x2, std::int16_t y2, bool color);
  void drawRoundRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height,
                     std::int16_t radius, bool color);
  void setCursor(std::int16_t x, std::int16_t y);
  void setTextColor(bool color);
  void print(const char* text);
  void print(char character);
  void printNumber(long value);

  void addTones(const std::uint16_t* values, std::size_t count);
  void clearTones();

  std::array<std::uint8_t, framebufferSize> framebuffer{};
  std::array<std::uint8_t, eepromSize> eeprom{};
  std::array<Tone, maxTones> tones{};
  std::uint32_t frameCount = 0;
  std::uint8_t frameRate = 60;
  std::size_t toneCount = 0;
  bool eepromDirty = false;
  bool audioEnabled = true;

 private:
  std::uint8_t pendingButtons_ = 0;
  std::uint8_t currentButtons_ = 0;
  std::uint8_t previousButtons_ = 0;
  std::int16_t cursorX_ = 0;
  std::int16_t cursorY_ = 0;
  bool textColor_ = true;
};

}  // namespace kalamunggos
