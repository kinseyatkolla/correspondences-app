import AsyncStorage from "@react-native-async-storage/async-storage";

export const SAVED_NATAL_CHART_KEY = "savedNatalChart";

export type SavedNatalChartRaw = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  latitude: number;
  longitude: number;
  timeZone?: string;
  utcYear?: number;
  utcMonth?: number;
  utcDay?: number;
  utcHour?: number;
  utcMinute?: number;
  utcSecond?: number;
  placeName?: string;
  ascendantSign?: string;
};

export type NatalChartApiPayload = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  latitude: number;
  longitude: number;
};

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

export function convertZonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const localAsIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = localAsIfUtc;
  for (let i = 0; i < 3; i++) {
    const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
    guess = localAsIfUtc - offset;
  }
  return new Date(guess);
}

export function hasCompleteNatalFields(natal: unknown): natal is SavedNatalChartRaw {
  if (!natal || typeof natal !== "object") return false;
  const n = natal as SavedNatalChartRaw;
  return (
    n.year !== undefined &&
    n.month !== undefined &&
    n.day !== undefined &&
    n.hour !== undefined &&
    n.minute !== undefined &&
    n.latitude !== undefined &&
    n.longitude !== undefined
  );
}

/** Stable key so effects do not re-run when payload content is unchanged. */
export function natalChartCacheKey(payload: NatalChartApiPayload | null): string {
  if (!payload) return "";
  return `${payload.year}-${payload.month}-${payload.day}-${payload.hour}-${payload.minute}-${payload.second}-${payload.latitude}-${payload.longitude}`;
}

/** UTC birth instant fields for API / chart (matches CalendarContext). */
export async function loadSavedNatalChartForApi(): Promise<NatalChartApiPayload | null> {
  try {
    const saved = await AsyncStorage.getItem(SAVED_NATAL_CHART_KEY);
    if (!saved) return null;
    const natal = JSON.parse(saved);
    if (!hasCompleteNatalFields(natal)) return null;

    let utcYear = natal.utcYear;
    let utcMonth = natal.utcMonth;
    let utcDay = natal.utcDay;
    let utcHour = natal.utcHour;
    let utcMinute = natal.utcMinute;
    let utcSecond = natal.utcSecond;

    if (
      utcYear === undefined ||
      utcMonth === undefined ||
      utcDay === undefined ||
      utcHour === undefined ||
      utcMinute === undefined
    ) {
      const tz =
        natal.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";
      const converted = convertZonedLocalToUtc(
        Number(natal.year),
        Number(natal.month),
        Number(natal.day),
        Number(natal.hour),
        Number(natal.minute),
        Number(natal.second || 0),
        tz,
      );
      utcYear = converted.getUTCFullYear();
      utcMonth = converted.getUTCMonth() + 1;
      utcDay = converted.getUTCDate();
      utcHour = converted.getUTCHours();
      utcMinute = converted.getUTCMinutes();
      utcSecond = converted.getUTCSeconds();
    }

    return {
      year: Number(utcYear),
      month: Number(utcMonth),
      day: Number(utcDay),
      hour: Number(utcHour),
      minute: Number(utcMinute),
      second: Number(utcSecond ?? 0),
      latitude: Number(natal.latitude),
      longitude: Number(natal.longitude),
    };
  } catch {
    return null;
  }
}

export async function loadSavedNatalAscendantSign(): Promise<string | null> {
  try {
    const saved = await AsyncStorage.getItem(SAVED_NATAL_CHART_KEY);
    if (!saved) return null;
    const natal = JSON.parse(saved);
    if (typeof natal?.ascendantSign === "string" && natal.ascendantSign) {
      return natal.ascendantSign;
    }
    return null;
  } catch {
    return null;
  }
}

export async function hasSavedNatalChart(): Promise<boolean> {
  const payload = await loadSavedNatalChartForApi();
  return payload != null;
}
