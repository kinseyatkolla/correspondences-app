import { Platform, Vibration } from "react-native";

export const isWeb = Platform.OS === "web";

export function safeVibrate(duration = 100): void {
  if (isWeb) return;
  try {
    Vibration.vibrate(duration);
  } catch {
    // Some platforms reject vibration calls.
  }
}
