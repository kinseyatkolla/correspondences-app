import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAstrology } from "./AstrologyContext";
import { apiService } from "../services/api";

// ============================================================================
// TYPES
// ============================================================================
interface IngressEvent {
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
}

interface StationEvent {
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

type CalendarEvent = IngressEvent | StationEvent;

interface CalendarContextType {
  year: number;
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshCalendar: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
  year: number;
}

// ============================================================================
// PROVIDER
// ============================================================================
export function CalendarProvider({
  children,
  year,
}: CalendarProviderProps) {
  const { currentChart } = useAstrology();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process ephemeris samples to detect ingresses and stations
  const processEphemerisData = useCallback(
    (samples: any[]): CalendarEvent[] => {
      const detectedEvents: CalendarEvent[] = [];
      const planetNames = [
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
        "pluto",
      ];

      // Get location for timezone offset
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };
      const timezoneOffsetHours = Math.round(location.longitude / 15);

      // Track previous state for each planet
      const planetStates: Record<
        string,
        {
          zodiacSign: number;
          speed: number | null; // Track speed to detect stations
          longitude: number | null; // Track longitude to detect direction changes
          previousLongitude: number | null; // Track previous longitude to calculate speed
          previousSampleTime: Date | null; // Track previous sample time
        }
      > = {};

      planetNames.forEach((planetName) => {
        planetStates[planetName] = {
          zodiacSign: -1,
          speed: null,
          longitude: null,
          previousLongitude: null,
          previousSampleTime: null,
        };
      });

      // Process each sample
      console.log(`Processing ${samples.length} ephemeris samples for station detection`);
      
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        // Use date if available (from API conversion), otherwise parse timestamp
        const sampleDate = sample.date || new Date(sample.timestamp);

        planetNames.forEach((planetName) => {
          const planet = sample.planets[planetName];
          if (!planet) return;

          const prevState = planetStates[planetName];
          const currentZodiacSign = planet.zodiacSign;
          const currentLongitude = planet.longitude;
          
          // Calculate speed from longitude change if speed from API is 0 or missing
          // Speed = change in longitude / change in time (degrees per day)
          let currentSpeed = planet.speed;
          if (
            (currentSpeed === 0 || currentSpeed === null || isNaN(currentSpeed)) &&
            prevState.previousLongitude !== null &&
            prevState.previousSampleTime !== null
          ) {
            const timeDiffDays =
              (sampleDate.getTime() - prevState.previousSampleTime.getTime()) /
              (1000 * 60 * 60 * 24);
            
            // Handle longitude wrap-around (0-360 degrees)
            let longitudeDiff = currentLongitude - prevState.previousLongitude;
            if (longitudeDiff > 180) longitudeDiff -= 360;
            if (longitudeDiff < -180) longitudeDiff += 360;
            
            currentSpeed = longitudeDiff / timeDiffDays;
            
            // Log calculated speed for first few samples
            if (i < 5 && planetName === "mercury") {
              console.log(
                `Sample ${i} - ${planetName} calculated speed: ${currentSpeed.toFixed(4)} deg/day (from API: ${planet.speed})`
              );
            }
          } else if (i < 5 && planetName === "mercury") {
            console.log(
              `Sample ${i} - ${planetName} speed from API: ${planet.speed}, longitude: ${planet.longitude}`
            );
          }

          // Detect ingress (zodiac sign change)
          if (
            prevState.zodiacSign !== -1 &&
            prevState.zodiacSign !== currentZodiacSign
          ) {
            // Find the exact time between previous and current sample using binary search
            // For now, use the current sample time (we can refine this later)
            const utcDateTime = sampleDate;
            const localDateTime = new Date(
              utcDateTime.getTime() + timezoneOffsetHours * 60 * 60 * 1000
            );

            const signs = [
              "Aries",
              "Taurus",
              "Gemini",
              "Cancer",
              "Leo",
              "Virgo",
              "Libra",
              "Scorpio",
              "Sagittarius",
              "Capricorn",
              "Aquarius",
              "Pisces",
            ];

            const ingressEvent: IngressEvent = {
              id: `ingress-${planetName}-${sample.timestamp}`,
              type: "ingress",
              planet: planetName,
              fromSign: signs[prevState.zodiacSign],
              toSign: signs[currentZodiacSign],
              date: localDateTime,
              utcDateTime,
              localDateTime,
              degree: planet.degree,
              degreeFormatted: planet.degreeFormatted,
            };

            detectedEvents.push(ingressEvent);
          }

          // Detect station (when speed changes sign - crosses zero)
          // This happens when degree switches from increasing to decreasing (retrograde)
          // or decreasing to increasing (direct)
          // Only detect when speed actually crosses zero (changes sign)
          // Use a small threshold to handle floating point precision issues
          const SPEED_THRESHOLD = 0.001; // degrees per day - very small threshold for precision
          const prevSpeedSign = prevState.speed !== null ? Math.sign(prevState.speed) : 0;
          const currentSpeedSign = Math.sign(currentSpeed);
          
          // Only detect if speed actually changed sign (crossed zero)
          // AND both speeds are meaningful (not both essentially zero)
          const speedCrossedZero =
            prevState.speed !== null &&
            prevState.longitude !== null &&
            prevSpeedSign !== 0 &&
            currentSpeedSign !== 0 &&
            prevSpeedSign !== currentSpeedSign;

          if (speedCrossedZero) {
            const utcDateTime = sampleDate;
            const localDateTime = new Date(
              utcDateTime.getTime() + timezoneOffsetHours * 60 * 60 * 1000
            );

            // Determine station type based on direction change
            const stationType: "retrograde" | "direct" =
              prevState.speed > 0 && currentSpeed < 0
                ? "retrograde"
                : "direct";

            const stationEvent: StationEvent = {
              id: `station-${planetName}-${sample.timestamp}`,
              type: "station",
              planet: planetName,
              stationType,
              date: localDateTime,
              utcDateTime,
              localDateTime,
              degree: planet.degree,
              degreeFormatted: planet.degreeFormatted,
              zodiacSignName: planet.zodiacSignName,
            };

            console.log(
              `Station detected: ${planetName} ${stationType} at ${sample.timestamp}`,
              {
                prevSpeed: prevState.speed,
                currentSpeed: currentSpeed,
                degree: planet.degreeFormatted,
                sign: planet.zodiacSignName,
              }
            );

            detectedEvents.push(stationEvent);
          }

          // Update state
          planetStates[planetName] = {
            zodiacSign: currentZodiacSign,
            speed: currentSpeed,
            longitude: currentLongitude,
            previousLongitude: currentLongitude,
            previousSampleTime: sampleDate,
          };
        });
      }

      // Sort events chronologically
      detectedEvents.sort(
        (a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime()
      );

      return detectedEvents;
    },
    [currentChart]
  );

  // Fetch and process year ephemeris data
  const fetchYearEphemeris = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Fetch year ephemeris (sample every 12 hours for better station detection)
      // Stations can be missed with daily sampling if speed crosses zero between samples
      const response = await apiService.getYearEphemeris(
        year,
        location.latitude,
        location.longitude,
        12 // Sample every 12 hours for better accuracy
      );

      if (response.success && response.data?.samples) {
        // Verify we have speed data
        const firstSample = response.data.samples[0];
        if (firstSample?.planets) {
          const firstPlanet = Object.values(firstSample.planets)[0] as any;
          console.log(
            "First sample planet data check:",
            firstPlanet?.speed !== undefined
              ? `Speed: ${firstPlanet.speed}`
              : "Speed missing!"
          );
        }

        const detectedEvents = processEphemerisData(response.data.samples);
        const eventCounts = detectedEvents.reduce(
          (acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        console.log(
          `Calendar events detected: ${detectedEvents.length} total`,
          eventCounts
        );
        setEvents(detectedEvents);
      } else {
        setError("Failed to fetch ephemeris data");
        setEvents([]);
      }
    } catch (err: any) {
      console.error("Error fetching year ephemeris:", err);
      setError(err.message || "Failed to fetch ephemeris data");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [year, currentChart, processEphemerisData]);

  // Refresh calendar data
  const refreshCalendar = useCallback(async () => {
    await fetchYearEphemeris();
  }, [fetchYearEphemeris]);

  // Fetch data on mount and when year or location changes
  useEffect(() => {
    fetchYearEphemeris();
  }, [fetchYearEphemeris]);

  return (
    <CalendarContext.Provider
      value={{
        year,
        events,
        loading,
        error,
        refreshCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

