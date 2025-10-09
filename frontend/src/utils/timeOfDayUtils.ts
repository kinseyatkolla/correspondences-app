// ============================================================================
// TIME OF DAY UTILITIES
// ============================================================================
// Simple utilities for determining time of day based on current time
// for dynamic background images similar to Apple Weather

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

/**
 * Determines the time of day based on current hour
 * This creates a simple 4-phase system for background images
 *
 * @param hour - Current hour (0-23)
 * @returns TimeOfDay category for background images
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) {
    // 5:00 AM - 7:59 AM: Dawn/Sunrise
    return "dawn";
  } else if (hour >= 8 && hour < 18) {
    // 8:00 AM - 5:59 PM: Day
    return "day";
  } else if (hour >= 18 && hour < 21) {
    // 6:00 PM - 8:59 PM: Dusk/Sunset
    return "dusk";
  } else {
    // 9:00 PM - 4:59 AM: Night
    return "night";
  }
}

/**
 * Get the background image name based on time of day
 *
 * @param timeOfDay - The time of day category
 * @returns Image name for the background
 */
export function getBackgroundImageName(timeOfDay: TimeOfDay): string {
  switch (timeOfDay) {
    case "dawn":
      return "dawn-gradient.png";
    case "day":
      return "day-gradient.png";
    case "dusk":
      return "dusk-gradient.png";
    case "night":
      return "night-gradient.png";
    default:
      return "night-gradient.png";
  }
}

/**
 * Get time of day from current date
 *
 * @returns Current time of day
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const now = new Date();
  const hour = now.getHours();
  return getTimeOfDay(hour);
}

/**
 * Get background image name for current time
 *
 * @returns Background image name for current time
 */
export function getCurrentBackgroundImageName(): string {
  const timeOfDay = getCurrentTimeOfDay();
  return getBackgroundImageName(timeOfDay);
}
