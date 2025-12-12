// ============================================================================
// MOON & LUNAR TYPES
// ============================================================================
// Unified type definitions for moon and lunar-related data
// ============================================================================

export interface LunarPhase {
  moonPhase: string;
  date: string;
  utcDateTime?: Date;
  localDateTime?: Date;
  moonPosition?: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
}

export interface Moon30 {
  number: number;
  name: string;
  color: string;
}

export interface TithiData {
  numbers: [number, number];
  name: string;
  planetRuler: string;
  division: string;
  deity: string;
}
