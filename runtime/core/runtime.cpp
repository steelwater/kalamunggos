#include "runtime.hpp"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdlib>
#include <cstdio>

namespace {

using Glyph = std::array<std::uint8_t, 5>;

Glyph glyphFor(char value) {
  switch (value) {
    case 'A': return {0x7E,0x11,0x11,0x11,0x7E}; case 'B': return {0x7F,0x49,0x49,0x49,0x36};
    case 'C': return {0x3E,0x41,0x41,0x41,0x22}; case 'D': return {0x7F,0x41,0x41,0x22,0x1C};
    case 'E': return {0x7F,0x49,0x49,0x49,0x41}; case 'F': return {0x7F,0x09,0x09,0x09,0x01};
    case 'G': return {0x3E,0x41,0x49,0x49,0x7A}; case 'H': return {0x7F,0x08,0x08,0x08,0x7F};
    case 'I': return {0x00,0x41,0x7F,0x41,0x00}; case 'J': return {0x20,0x40,0x41,0x3F,0x01};
    case 'K': return {0x7F,0x08,0x14,0x22,0x41}; case 'L': return {0x7F,0x40,0x40,0x40,0x40};
    case 'M': return {0x7F,0x02,0x0C,0x02,0x7F}; case 'N': return {0x7F,0x04,0x08,0x10,0x7F};
    case 'O': return {0x3E,0x41,0x41,0x41,0x3E}; case 'P': return {0x7F,0x09,0x09,0x09,0x06};
    case 'Q': return {0x3E,0x41,0x51,0x21,0x5E}; case 'R': return {0x7F,0x09,0x19,0x29,0x46};
    case 'S': return {0x46,0x49,0x49,0x49,0x31}; case 'T': return {0x01,0x01,0x7F,0x01,0x01};
    case 'U': return {0x3F,0x40,0x40,0x40,0x3F}; case 'V': return {0x1F,0x20,0x40,0x20,0x1F};
    case 'W': return {0x3F,0x40,0x38,0x40,0x3F}; case 'X': return {0x63,0x14,0x08,0x14,0x63};
    case 'Y': return {0x07,0x08,0x70,0x08,0x07}; case 'Z': return {0x61,0x51,0x49,0x45,0x43};
    case '0': return {0x3E,0x51,0x49,0x45,0x3E}; case '1': return {0x00,0x42,0x7F,0x40,0x00};
    case '2': return {0x42,0x61,0x51,0x49,0x46}; case '3': return {0x21,0x41,0x45,0x4B,0x31};
    case '4': return {0x18,0x14,0x12,0x7F,0x10}; case '5': return {0x27,0x45,0x45,0x45,0x39};
    case '6': return {0x3C,0x4A,0x49,0x49,0x30}; case '7': return {0x01,0x71,0x09,0x05,0x03};
    case '8': return {0x36,0x49,0x49,0x49,0x36}; case '9': return {0x06,0x49,0x49,0x29,0x1E};
    case '>': return {0x00,0x41,0x22,0x14,0x08}; case '<': return {0x08,0x14,0x22,0x41,0x00};
    case '_': return {0x40,0x40,0x40,0x40,0x40}; case '/': return {0x20,0x10,0x08,0x04,0x02};
    case '!': return {0x00,0x00,0x5F,0x00,0x00}; case '?': return {0x02,0x01,0x51,0x09,0x06};
    case '-': return {0x08,0x08,0x08,0x08,0x08}; case '.': return {0x00,0x60,0x60,0x00,0x00};
    case ':': return {0x00,0x36,0x36,0x00,0x00};
    default: return {0,0,0,0,0};
  }
}

}  // namespace

namespace kalamunggos {

Runtime& Runtime::instance() { static Runtime runtime; return runtime; }

void Runtime::begin() { clear(); currentButtons_ = previousButtons_ = pendingButtons_ = 0; frameCount = 0; }
void Runtime::beginFrame(std::uint8_t buttons) { pendingButtons_ = buttons; ++frameCount; }
void Runtime::pollButtons() { previousButtons_ = currentButtons_; currentButtons_ = pendingButtons_; }
bool Runtime::pressed(std::uint8_t mask) const { return (currentButtons_ & mask) != 0; }
bool Runtime::justPressed(std::uint8_t mask) const { return (currentButtons_ & mask) != 0 && (previousButtons_ & mask) == 0; }

void Runtime::clear(bool color) { framebuffer.fill(color ? 1 : 0); }
void Runtime::drawPixel(std::int16_t x, std::int16_t y, bool color) {
  if (x < 0 || x >= screenWidth || y < 0 || y >= screenHeight) return;
  framebuffer[static_cast<std::size_t>(y * screenWidth + x)] = color ? 1 : 0;
}
void Runtime::drawLine(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1, bool color) {
  const int dx = std::abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const int dy = -std::abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  int error = dx + dy;
  while (true) {
    drawPixel(x0, y0, color);
    if (x0 == x1 && y0 == y1) break;
    const int twice = 2 * error;
    if (twice >= dy) { error += dy; x0 += sx; }
    if (twice <= dx) { error += dx; y0 += sy; }
  }
}
void Runtime::drawRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color) {
  if (width <= 0 || height <= 0) return;
  drawLine(x, y, x + width - 1, y, color); drawLine(x, y + height - 1, x + width - 1, y + height - 1, color);
  drawLine(x, y, x, y + height - 1, color); drawLine(x + width - 1, y, x + width - 1, y + height - 1, color);
}
void Runtime::fillRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, bool color) {
  for (int row = 0; row < height; ++row) drawLine(x, y + row, x + width - 1, y + row, color);
}
void Runtime::drawCircle(std::int16_t x, std::int16_t y, std::int16_t radius, bool color) {
  int offsetX = radius, offsetY = 0, error = 1 - radius;
  while (offsetX >= offsetY) {
    drawPixel(x+offsetX,y+offsetY,color); drawPixel(x+offsetY,y+offsetX,color); drawPixel(x-offsetY,y+offsetX,color); drawPixel(x-offsetX,y+offsetY,color);
    drawPixel(x-offsetX,y-offsetY,color); drawPixel(x-offsetY,y-offsetX,color); drawPixel(x+offsetY,y-offsetX,color); drawPixel(x+offsetX,y-offsetY,color);
    ++offsetY; if (error < 0) error += 2 * offsetY + 1; else { --offsetX; error += 2 * (offsetY - offsetX + 1); }
  }
}
void Runtime::drawTriangle(std::int16_t x0, std::int16_t y0, std::int16_t x1, std::int16_t y1, std::int16_t x2, std::int16_t y2, bool color) {
  drawLine(x0,y0,x1,y1,color); drawLine(x1,y1,x2,y2,color); drawLine(x2,y2,x0,y0,color);
}
void Runtime::drawRoundRect(std::int16_t x, std::int16_t y, std::int16_t width, std::int16_t height, std::int16_t radius, bool color) {
  radius = std::max<std::int16_t>(0, std::min<std::int16_t>(radius, std::min(width, height) / 2));
  drawLine(x+radius,y,x+width-radius-1,y,color); drawLine(x+radius,y+height-1,x+width-radius-1,y+height-1,color);
  drawLine(x,y+radius,x,y+height-radius-1,color); drawLine(x+width-1,y+radius,x+width-1,y+height-radius-1,color);
  for (int i = 0; i <= radius; ++i) {
    const int j = static_cast<int>(std::sqrt(static_cast<double>(radius*radius-i*i)));
    drawPixel(x+radius-i,y+radius-j,color); drawPixel(x+width-radius-1+i,y+radius-j,color);
    drawPixel(x+radius-i,y+height-radius-1+j,color); drawPixel(x+width-radius-1+i,y+height-radius-1+j,color);
  }
}
void Runtime::setCursor(std::int16_t x, std::int16_t y) { cursorX_ = x; cursorY_ = y; }
void Runtime::setTextColor(bool color) { textColor_ = color; }
void Runtime::print(const char* text) { if (!text) return; while (*text) print(*text++); }
void Runtime::print(char character) {
  const char normalized = character >= 'a' && character <= 'z' ? static_cast<char>(character - 32) : character;
  const Glyph glyph = glyphFor(normalized);
  for (int column = 0; column < 5; ++column) for (int row = 0; row < 7; ++row)
    if ((glyph[column] >> row) & 1) drawPixel(cursorX_ + column, cursorY_ + row, textColor_);
  cursorX_ += 6;
}
void Runtime::printNumber(long value) { char buffer[24]; std::snprintf(buffer, sizeof(buffer), "%ld", value); print(buffer); }
void Runtime::addTones(const std::uint16_t* values, std::size_t count) {
  for (std::size_t index = 0; index + 1 < count && toneCount < maxTones; index += 2)
    tones[toneCount++] = {values[index], values[index + 1]};
}
void Runtime::clearTones() { toneCount = 0; }

}  // namespace kalamunggos
