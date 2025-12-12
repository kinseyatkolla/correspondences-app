// ============================================================================
// LUNATIONS UTILITY
// ============================================================================
// Shared utility for fetching and processing lunations data
// ============================================================================

import { apiService } from "../services/api";
import { LunationEvent } from "../types/calendarTypes";
import { LunarPhase } from "../types/moonTypes";

/**
 * Fetches and processes all lunations for a given year
 * Returns LunationEvent[] with eclipse information
 */
export async function fetchLunationsForYear(
  year: number,
  latitude: number,
  longitude: number
): Promise<LunationEvent[]> {
  console.log(`🌐 Fetching lunations data for year ${year}`);
  const allPhases: LunarPhase[] = [];

  // Fetch all 12 months
  for (let month = 1; month <= 12; month++) {
    try {
      const monthData = await apiService.getLunarPhases(year, month);
      if (monthData?.response?.data) {
        const phases = monthData.response.data.map((phase) => ({
          moonPhase: phase.moonPhase,
          date: phase.date,
        }));
        allPhases.push(...phases);
      }
    } catch (error) {
      console.error(`Error fetching month ${month}:`, error);
    }
  }

  if (allPhases.length === 0) {
    console.warn("No lunar phases found");
    return [];
  }

  console.log(
    `✅ Found ${allPhases.length} lunar phases, now fetching eclipses...`
  );

  // Fetch eclipse data for the year
  console.log(`🔍 Starting eclipse fetch for year ${year}...`);
  let lunarEclipses: Array<{ date?: string; [key: string]: any }> = [];
  let solarEclipses: Array<{ date?: string; [key: string]: any }> = [];

  try {
    console.log(`🌑 Fetching lunar eclipses for ${year}...`);
    const lunarEclipseData = await apiService.getEclipses(year, "lunar");
    if (lunarEclipseData?.response?.data) {
      lunarEclipses = lunarEclipseData.response.data;
      console.log(
        `🌑 Fetched ${lunarEclipses.length} lunar eclipses for ${year}`
      );
    }
  } catch (error) {
    console.error("❌ Error fetching lunar eclipses:", error);
  }

  try {
    console.log(`☀️ Fetching solar eclipses for ${year}...`);
    const solarEclipseData = await apiService.getEclipses(year, "solar");
    if (solarEclipseData?.response?.data) {
      solarEclipses = solarEclipseData.response.data;
      console.log(
        `☀️ Fetched ${solarEclipses.length} solar eclipses for ${year}`
      );
    }
  } catch (error) {
    console.error("❌ Error fetching solar eclipses:", error);
  }

  // Create a map of eclipse dates for quick lookup
  const eclipseMap = new Map<number, { type: "lunar" | "solar"; date: Date }>();

  // Process lunar eclipses (occur at Full Moon)
  lunarEclipses.forEach((eclipse) => {
    const dateValue =
      eclipse.events?.greatest?.date ||
      eclipse.events?.greatest?.Date ||
      eclipse.calendarDate ||
      eclipse.date ||
      eclipse.Date ||
      eclipse.datetime ||
      eclipse.Datetime ||
      eclipse.time ||
      eclipse.dateTime;
    if (!dateValue || typeof dateValue !== "string") {
      return;
    }
    let eclipseDate = dateValue.trim();
    const hasTimezone =
      /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
    if (!hasTimezone) {
      eclipseDate = `${eclipseDate}Z`;
    }
    const eclipseDateTime = new Date(eclipseDate);
    if (!isNaN(eclipseDateTime.getTime())) {
      eclipseMap.set(eclipseDateTime.getTime(), {
        type: "lunar",
        date: eclipseDateTime,
      });
    }
  });

  // Process solar eclipses (occur at New Moon)
  solarEclipses.forEach((eclipse) => {
    const dateValue =
      eclipse.events?.greatest?.date ||
      eclipse.events?.greatest?.Date ||
      eclipse.calendarDate ||
      eclipse.date ||
      eclipse.Date ||
      eclipse.datetime ||
      eclipse.Datetime ||
      eclipse.time ||
      eclipse.dateTime;
    if (!dateValue || typeof dateValue !== "string") {
      return;
    }
    let eclipseDate = dateValue.trim();
    const hasTimezone =
      /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
    if (!hasTimezone) {
      eclipseDate = `${eclipseDate}Z`;
    }
    const eclipseDateTime = new Date(eclipseDate);
    if (!isNaN(eclipseDateTime.getTime())) {
      eclipseMap.set(eclipseDateTime.getTime(), {
        type: "solar",
        date: eclipseDateTime,
      });
    }
  });

  // Parse UTC times
  const phasesWithTimes = allPhases.map((phase) => {
    const utcString = phase.date.endsWith("Z") ? phase.date : `${phase.date}Z`;
    const utcDateTime = new Date(utcString);
    const localDateTime = new Date(utcDateTime);
    return {
      ...phase,
      utcDateTime,
      localDateTime,
    };
  });

  // Fetch moon positions for each lunation
  const phasesWithMoonPositions = await Promise.all(
    phasesWithTimes.map(async (phase) => {
      if (!phase.utcDateTime) return phase;

      try {
        const birthData = {
          year: phase.utcDateTime.getUTCFullYear(),
          month: phase.utcDateTime.getUTCMonth() + 1,
          day: phase.utcDateTime.getUTCDate(),
          hour: phase.utcDateTime.getUTCHours(),
          minute: phase.utcDateTime.getUTCMinutes(),
          latitude: latitude,
          longitude: longitude,
        };

        const chartResponse = await apiService.getBirthChart(birthData);

        if (chartResponse.success && chartResponse.data?.planets?.moon) {
          const moon = chartResponse.data.planets.moon;
          return {
            ...phase,
            moonPosition: {
              degree: moon.degree,
              degreeFormatted: moon.degreeFormatted,
              zodiacSignName: moon.zodiacSignName,
            },
          };
        }
      } catch (error) {
        console.error(`Error fetching moon position for ${phase.date}:`, error);
      }

      return phase;
    })
  );

  // Convert to LunationEvent format and mark eclipses
  const lunations: LunationEvent[] = phasesWithMoonPositions
    .filter((phase) => phase.utcDateTime && phase.localDateTime)
    .map((phase, index) => {
      const phaseName = phase.moonPhase.replace(/([A-Z])/g, " $1").trim();
      const lunationTime = phase.utcDateTime!.getTime();
      let eclipseInfo: { type: "lunar" | "solar"; date: Date } | undefined;
      let closestTimeDiff = Infinity;

      const isNewMoon = phaseName === "New Moon";
      const isFullMoon = phaseName === "Full Moon";

      // Find closest eclipse within 24 hours, but only consider matching types
      for (const [eclipseTime, info] of eclipseMap.entries()) {
        const typeMatches =
          (info.type === "solar" && isNewMoon) ||
          (info.type === "lunar" && isFullMoon);

        if (!typeMatches) continue;

        const timeDiff = Math.abs(lunationTime - eclipseTime);
        if (timeDiff < 24 * 60 * 60 * 1000 && timeDiff < closestTimeDiff) {
          eclipseInfo = info;
          closestTimeDiff = timeDiff;
        }
      }

      const isEclipse = eclipseInfo !== undefined;

      return {
        id: `lunation-${index}-${phase.date}`,
        type: "lunation" as const,
        date: phase.localDateTime!,
        utcDateTime: phase.utcDateTime!,
        localDateTime: phase.localDateTime!,
        title: phaseName,
        moonPosition: phase.moonPosition,
        isEclipse: isEclipse || false,
        eclipseType: isEclipse ? eclipseInfo!.type : undefined,
      };
    });

  // Sort chronologically
  lunations.sort((a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime());

  const eclipseCount = lunations.filter((l) => l.isEclipse).length;
  console.log(
    `🌑 Found ${eclipseCount} eclipses out of ${lunations.length} lunations`
  );

  return lunations;
}
