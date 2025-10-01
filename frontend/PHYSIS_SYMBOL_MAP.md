# PhysisV2 Commercial Font Symbol Map

This document provides a comprehensive mapping of keyboard characters to astrological symbols in the PhysisV2 Commercial font.

## Overview

The PhysisV2 font maps specific keyboard characters to beautiful astrological symbols. This mapping allows you to type simple characters and display them as professional astrological glyphs.

## Planet Symbols

| Character | Symbol | Planet  | Unicode |
| --------- | ------ | ------- | ------- |
| `r`       | ☉      | Sun     | U+2609  |
| `q`       | ☽      | Moon    | U+263D  |
| `w`       | ☿      | Mercury | U+263F  |
| `e`       | ♀      | Venus   | U+2640  |
| `t`       | ♂      | Mars    | U+2642  |
| `y`       | ♃      | Jupiter | U+2643  |
| `u`       | ♄      | Saturn  | U+2644  |
| `i`       | ♅      | Uranus  | U+2645  |
| `o`       | ♆      | Neptune | U+2646  |
| `p`       | ♇      | Pluto   | U+2647  |

## Zodiac Sign Symbols

| Character | Symbol | Sign        | Unicode |
| --------- | ------ | ----------- | ------- |
| `a`       | ♈     | Aries       | U+2648  |
| `s`       | ♉     | Taurus      | U+2649  |
| `b`       | ♊     | Gemini      | U+264A  |
| `f`       | ♋     | Cancer      | U+264B  |
| `g`       | ♌     | Leo         | U+264C  |
| `h`       | ♍     | Virgo       | U+264D  |
| `j`       | ♎     | Libra       | U+264E  |
| `k`       | ♏     | Scorpio     | U+264F  |
| `l`       | ♐     | Sagittarius | U+2650  |
| `c`       | ♑     | Capricorn   | U+2651  |
| `d`       | ♒     | Aquarius    | U+2652  |
| `n`       | ♓     | Pisces      | U+2653  |

## Number Symbols

| Character | Symbol | Description |
| --------- | ------ | ----------- |
| `0`       | 0      | Zero        |
| `1`       | 1      | One         |
| `2`       | 2      | Two         |
| `3`       | 3      | Three       |
| `4`       | 4      | Four        |
| `5`       | 5      | Five        |
| `6`       | 6      | Six         |
| `7`       | 7      | Seven       |
| `8`       | 8      | Eight       |
| `9`       | 9      | Nine        |

## Usage in Code

### Import the utility functions:

```typescript
import {
  getSymbolFromFont,
  getPlanetSymbols,
  getZodiacSymbols,
  getPlanetNames,
  getZodiacNames,
} from "../utils/physisSymbolMap";
```

### Get a symbol from a character:

```typescript
const sunSymbol = getSymbolFromFont("r"); // Returns '☉'
const ariesSymbol = getSymbolFromFont("a"); // Returns '♈'
```

### Get all planet symbols:

```typescript
const planets = getPlanetSymbols();
// Returns: { 'r': '☉', 'q': '☽', 'w': '☿', ... }
```

### Get all zodiac symbols:

```typescript
const zodiac = getZodiacSymbols();
// Returns: { 'a': '♈', 's': '♉', 'b': '♊', ... }
```

### Get planet names:

```typescript
const planetNames = getPlanetNames();
// Returns: { 'r': 'Sun', 'q': 'Moon', 'w': 'Mercury', ... }
```

### Get zodiac names:

```typescript
const zodiacNames = getZodiacNames();
// Returns: { 'a': 'Aries', 's': 'Taurus', 'b': 'Gemini', ... }
```

## Font Loading

The font is loaded dynamically in React Native using Expo's font loading system:

```typescript
import * as Font from "expo-font";

const loadFont = async () => {
  try {
    await Font.loadAsync({
      Physis: require("../../assets/fonts/Physis.ttf"),
    });
    setFontLoaded(true);
  } catch (error) {
    console.log("Font loading error:", error);
    setFontLoaded(true); // Continue with fallback
  }
};
```

## Styling

Apply the font to text elements:

```typescript
const styles = StyleSheet.create({
  symbolText: {
    fontFamily: fontLoaded ? "Physis" : "System",
    fontSize: 24,
    color: "#e6e6fa",
  },
});
```

## Examples

### Display a planet symbol:

```jsx
<Text style={[styles.symbolText, { fontFamily: getFontFamily() }]}>r</Text>
// Displays: ☉ (Sun symbol)
```

### Display a zodiac sign:

```jsx
<Text style={[styles.symbolText, { fontFamily: getFontFamily() }]}>a</Text>
// Displays: ♈ (Aries symbol)
```

### Display numbers for aspects:

```jsx
<Text style={[styles.symbolText, { fontFamily: getFontFamily() }]}>
  0 1 2 3 4 5 6 7 8 9
</Text>
// Displays: 0 1 2 3 4 5 6 7 8 9 (styled numbers)
```

## Notes

- The font must be loaded before symbols will display correctly
- If the font fails to load, the system font will be used as fallback
- All symbols are Unicode-compliant and will work across different platforms
- The mapping is based on the PhysisV2 Commercial font's character layout
- Some characters may not be available in all font weights/styles
