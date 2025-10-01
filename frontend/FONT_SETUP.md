# PhysisV2 Commercial Font Setup

## Font Files

The PhysisV2 Commercial font files have been added to `assets/fonts/`:

- `Physis.ttf`
- `Physis.otf`

## Configuration

1. The font is loaded using Expo's `expo-font` package
2. Font loading is handled dynamically in the MoonScreen component
3. The font is applied using `fontFamily: "Physis"` with fallback to system font

## Dependencies

The following package is required:

```bash
npm install expo-font
```

## Font Loading

The font is loaded asynchronously when the MoonScreen component mounts:

- Uses `Font.loadAsync()` to load the TTF file
- Includes error handling with fallback to system font
- Shows loading indicator while font loads

## Usage

The font is now used for:

- Planet symbols in the current positions section (Sun ☉, Moon ☽)
- Sample planet and zodiac symbols in the symbols display section
- All symbols use dynamic font loading with fallback

## Font Features

The PhysisV2 Commercial font includes:

- Planet symbols: ☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇
- Zodiac symbols: ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓
- Other astrological symbols and glyphs

## Testing

Start the development server to see the symbols rendered with the PhysisV2 font:

```bash
npx expo start
```

The app will show a loading indicator while the font loads, then display all symbols using the PhysisV2 font.
