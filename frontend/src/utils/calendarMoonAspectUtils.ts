import { apiService } from "../services/api";
import {
  AspectEvent,
  CalendarEvent,
  IngressEvent,
} from "../types/calendarTypes";

function parseUtcDateTime(rawUtcDateTime: string | Date): {
  utcDateTime: Date;
  localDateTime: Date;
} {
  let utcString: string;
  if (rawUtcDateTime instanceof Date) {
    utcString = rawUtcDateTime.toISOString();
  } else {
    utcString =
      typeof rawUtcDateTime === "string" && rawUtcDateTime.endsWith("Z")
        ? rawUtcDateTime
        : `${rawUtcDateTime}Z`;
  }
  const utcDateTime = new Date(utcString);
  return {
    utcDateTime,
    localDateTime: new Date(utcDateTime),
  };
}

export function parseMoonAspectEvent(event: any): AspectEvent | null {
  if (event.type !== "aspect") return null;

  const includesMoon =
    event.planet1?.toLowerCase() === "moon" ||
    event.planet2?.toLowerCase() === "moon";
  if (!includesMoon) return null;

  const { utcDateTime, localDateTime } = parseUtcDateTime(event.utcDateTime);
  const isNatalTransit = event.isNatalTransit === true;
  const aspectScope = isNatalTransit
    ? `natal-${event.natalTargetType || "point"}-${
        event.natalTargetName || event.planet2
      }`
    : "mundane-moon";

  return {
    id: `aspect-${aspectScope}-${event.planet1}-${event.planet2}-${event.aspectName}-${event.utcDateTime}`,
    type: "aspect",
    planet1: event.planet1,
    planet2: event.planet2,
    aspectName: event.aspectName,
    date: localDateTime,
    utcDateTime,
    localDateTime,
    orb: event.orb,
    planet1Position: event.planet1Position,
    planet2Position: event.planet2Position,
    isNatalTransit,
    natalTargetType: event.natalTargetType,
    natalTargetName: event.natalTargetName,
    refinedByFailsafe: event.refinedByFailsafe,
  };
}

export function parseMoonIngressEvent(event: any): IngressEvent | null {
  if (event.type !== "ingress") return null;
  if (event.planet?.toLowerCase() !== "moon") return null;

  const { utcDateTime, localDateTime } = parseUtcDateTime(event.utcDateTime);

  return {
    id: `ingress-${event.planet}-${event.utcDateTime}`,
    type: "ingress",
    planet: event.planet,
    fromSign: event.fromSign,
    toSign: event.toSign,
    date: localDateTime,
    utcDateTime,
    localDateTime,
    degree: event.degree,
    degreeFormatted: event.degreeFormatted,
    isRetrograde: event.isRetrograde,
  };
}

export function parseMoonModeEvent(event: any): CalendarEvent | null {
  return parseMoonAspectEvent(event) ?? parseMoonIngressEvent(event);
}

export async function fetchMoonModeEvents(
  year: number,
  latitude: number,
  longitude: number,
  natalChart?: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
    latitude: number;
    longitude: number;
  },
): Promise<{ mundane: CalendarEvent[]; natal: AspectEvent[] }> {
  const response = await apiService.getYearEphemeris(
    year,
    latitude,
    longitude,
    2,
    natalChart,
    { moonMode: true },
  );

  if (!(response.success && response.data?.events)) {
    return { mundane: [], natal: [] };
  }

  const parsed = response.data.events
    .map(parseMoonModeEvent)
    .filter((event): event is CalendarEvent => event !== null);

  return {
    mundane: parsed.filter(
      (event) =>
        event.type === "ingress" ||
        (event.type === "aspect" && !event.isNatalTransit),
    ),
    natal: parsed.filter(
      (event): event is AspectEvent =>
        event.type === "aspect" && event.isNatalTransit === true,
    ),
  };
}
