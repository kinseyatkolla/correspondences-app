import { StyleSheet } from "react-native";
import * as Font from "expo-font";
import { useState, useEffect } from "react";

// Physis font loading hook
export const usePhysisFont = () => {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      try {
        await Font.loadAsync({
          Physis: require("../../assets/fonts/Physis.ttf"),
        });
        setFontLoaded(true);
      } catch (error) {
        console.log("Font loading error:", error);
        setFontLoaded(true); // Continue even if font fails to load
      }
    };

    loadFont();
  }, []);

  return { fontLoaded };
};

// Physis symbol styles with different sizes
export const physisStyles = StyleSheet.create({
  // Large symbols (for main displays)
  large: {
    fontFamily: "Physis",
    fontSize: 36,
  },
  // Medium symbols (for planet positions)
  medium: {
    fontFamily: "Physis",
    fontSize: 24,
  },
  // Small symbols (for compact displays)
  small: {
    fontFamily: "Physis",
    fontSize: 18,
  },
  // Extra small symbols (for inline text)
  extraSmall: {
    fontFamily: "Physis",
    fontSize: 16,
  },
});

// Helper function to get physis symbol style
// Always uses Physis font (local bundled font, should always be available)
export const getPhysisSymbolStyle = (
  fontLoaded: boolean,
  size: "large" | "medium" | "small" | "extraSmall" = "medium"
) => physisStyles[size];

// Helper function to get physis symbol style with custom size
export const getPhysisSymbolStyleCustom = (
  fontLoaded: boolean,
  fontSize: number
) => [
  {
    fontFamily: "Physis",
    fontSize: fontSize,
  },
];
