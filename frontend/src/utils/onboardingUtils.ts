import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY_PREFIX = "onboarding_";

export const ONBOARDING_KEYS = {
  FLOWERS: "flowers",
  TAROT: "tarot",
  MOON: "moon",
  BOOK: "book",
  ASTROLOGY: "astrology",
} as const;

/**
 * Check if onboarding has been dismissed for a specific screen
 */
export async function hasOnboardingBeenDismissed(
  screenKey: string
): Promise<boolean> {
  try {
    const key = `${ONBOARDING_KEY_PREFIX}${screenKey}`;
    const value = await AsyncStorage.getItem(key);
    return value === "true";
  } catch (error) {
    console.error(`Error checking onboarding status for ${screenKey}:`, error);
    return false;
  }
}

/**
 * Mark onboarding as dismissed for a specific screen
 */
export async function dismissOnboarding(screenKey: string): Promise<void> {
  try {
    const key = `${ONBOARDING_KEY_PREFIX}${screenKey}`;
    await AsyncStorage.setItem(key, "true");
  } catch (error) {
    console.error(`Error dismissing onboarding for ${screenKey}:`, error);
  }
}

/**
 * Reset all onboarding (useful for testing or admin purposes)
 */
export async function resetAllOnboarding(): Promise<void> {
  try {
    const keys = Object.values(ONBOARDING_KEYS);
    await Promise.all(
      keys.map((key) =>
        AsyncStorage.removeItem(`${ONBOARDING_KEY_PREFIX}${key}`)
      )
    );
  } catch (error) {
    console.error("Error resetting onboarding:", error);
  }
}
