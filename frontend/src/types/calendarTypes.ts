// ============================================================================
// CALENDAR EVENT TYPES
// ============================================================================
// Unified type definitions for calendar events used throughout the app
// ============================================================================

export type CalendarEventType = "lunation" | "aspect" | "ingress" | "station";

export interface LunationEvent {
  id: string;
  type: "lunation";
  date: Date;
  utcDateTime: Date;
  localDateTime: Date;
  title: string;
  moonPosition?: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
  isEclipse?: boolean;
  eclipseType?: "lunar" | "solar";
}

export interface IngressEvent {
  id: string;
  type: "ingress";
  planet: string;
  fromSign: string;
  toSign: string;
  date: Date;
  utcDateTime: Date;
  localDateTime: Date;
  degree: number;
  degreeFormatted: string;
  isRetrograde: boolean;
}

export interface StationEvent {
  id: string;
  type: "station";
  planet: string;
  stationType: "retrograde" | "direct";
  date: Date;
  utcDateTime: Date;
  localDateTime: Date;
  degree: number;
  degreeFormatted: string;
  zodiacSignName: string;
}

export interface AspectEvent {
  id: string;
  type: "aspect";
  planet1: string;
  planet2: string;
  aspectName: "conjunct" | "opposition" | "square" | "trine" | "sextile";
  date: Date;
  utcDateTime: Date;
  localDateTime: Date;
  orb: number;
  planet1Position: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
  planet2Position: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
}

// Union type for all calendar events
export type CalendarEvent =
  | LunationEvent
  | IngressEvent
  | StationEvent
  | AspectEvent;
