import { Platform, Vibration, type TextStyle, type ViewStyle } from "react-native";

export const isWeb = Platform.OS === "web";

/** RN Animated native driver is unavailable on web (no RCTAnimation). */
export const USE_NATIVE_DRIVER = !isWeb;

type ShadowInput = {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
  elevation?: number;
};

type TextShadowInput = {
  color: string;
  offset?: { width: number; height: number };
  radius?: number;
};

function withAlpha(color: string, opacity: number): string {
  const rgba = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([.\d]+))?\s*\)$/i
  );
  if (rgba) {
    const baseAlpha = rgba[4] !== undefined ? Number(rgba[4]) : 1;
    return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${baseAlpha * opacity})`;
  }

  let hex = color.trim();
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return `rgba(${r}, ${g}, ${b}, ${a * opacity})`;
    }
  }

  return color;
}

/** Web uses `boxShadow`; native keeps the RN shadow* + elevation props. */
export function shadowStyle({
  color = "#000",
  offset = { width: 0, height: 0 },
  opacity = 0,
  radius = 0,
  elevation,
}: ShadowInput): ViewStyle {
  if (isWeb) {
    if (opacity === 0) {
      return { boxShadow: "none" } as ViewStyle;
    }
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${withAlpha(
        color,
        opacity
      )}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    ...(elevation != null ? { elevation } : {}),
  };
}

/** Web uses CSS `textShadow`; native keeps the RN textShadow* props. */
export function textShadowStyle({
  color,
  offset = { width: 0, height: 0 },
  radius = 0,
}: TextShadowInput): TextStyle {
  if (isWeb) {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
    } as TextStyle;
  }

  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius,
  };
}

export function safeVibrate(duration = 100): void {
  if (isWeb) return;
  try {
    Vibration.vibrate(duration);
  } catch {
    // Some platforms reject vibration calls.
  }
}
