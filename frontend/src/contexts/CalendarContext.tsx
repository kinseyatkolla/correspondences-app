import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useAstrology } from "./AstrologyContext";
import { apiService, PlanetPosition } from "../services/api";
import {
  checkForConjunct,
  checkForOpposition,
  checkForSquare,
  checkForTrine,
  checkForSextile,
} from "../utils/aspectUtils";

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
  isRetrograde: boolean;
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

interface AspectEvent {
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

type CalendarEvent = IngressEvent | StationEvent | AspectEvent;

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
// Cache for year-ephemeris data
// Key format: "year-latitude-longitude"
interface EphemerisCacheEntry {
  events: CalendarEvent[];
  timestamp: number; // When the data was cached
}

const ephemerisCache = new Map<string, EphemerisCacheEntry>();

// Cache expiration time: 1 hour (in milliseconds)
const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

export function CalendarProvider({
  children,
  year,
}: CalendarProviderProps) {
  const { currentChart } = useAstrology();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track current cache key to detect changes
  const currentCacheKeyRef = useRef<string | null>(null);

  // NOTE: Event detection and timestamp refinement is now handled by the backend
  // The following function is kept for reference but is no longer used
  const _unused_processEphemerisData = useCallback(
    (samples: any[]): { events: CalendarEvent[]; refinementData: EventWithRefinement[]; samples: any[] } => {
      const detectedEvents: CalendarEvent[] = [];
      const planetNames = [
        "sun",
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
      
      // Use device's actual timezone offset instead of rough longitude-based calculation
      // This accounts for DST and actual timezone boundaries
      // We calculate the offset for each event's specific date to handle DST changes throughout the year
      const getTimezoneOffset = (date: Date): number => {
        // Get timezone offset in minutes, convert to hours
        // getTimezoneOffset() returns offset in minutes, negative means ahead of UTC
        return -date.getTimezoneOffset() / 60;
      };

      // Track previous state for each planet
      const planetStates: Record<
        string,
        {
          zodiacSign: number;
          speed: number | null; // Track speed to detect stations
          longitude: number | null; // Track longitude to detect direction changes
          previousLongitude: number | null; // Track previous longitude to calculate speed
          previousSampleTime: Date | null; // Track previous sample time
          previousSampleIndex: number | null; // Track previous sample index for timestamp refinement
        }
      > = {};
      
      // Interface for event refinement data
      interface EventWithRefinement {
        event: CalendarEvent;
        prevSampleIndex?: number;
        currentSampleIndex: number;
        prevLongitude?: number;
        prevSpeed?: number;
        prevAspectAngle?: number;
      }

      planetNames.forEach((planetName) => {
        planetStates[planetName] = {
          zodiacSign: -1,
          speed: null,
          longitude: null,
          previousLongitude: null,
          previousSampleTime: null,
          previousSampleIndex: null,
        };
      });
      
      // Track events with refinement data
      const eventsWithRefinement: EventWithRefinement[] = [];

      // Track previous aspect states to detect when aspects become exact
      // Key format: "planet1-planet2-aspectType"
      const aspectStates: Record<string, { wasExact: boolean; orb: number }> =
        {};

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
              // Store event with refinement data for later timestamp refinement
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

              // Determine if planet is retrograde (negative speed means retrograde)
              // If speed is null/undefined/NaN, default to false (not retrograde)
              const isRetrograde = currentSpeed !== null && 
                                   currentSpeed !== undefined && 
                                   !isNaN(currentSpeed) && 
                                   currentSpeed < 0;

              // Use approximate time for now, will refine later
              const utcDateTime = sampleDate;
              const tzOffsetHours = getTimezoneOffset(sampleDate);
              const localDateTime = new Date(
                utcDateTime.getTime() + tzOffsetHours * 60 * 60 * 1000
              );

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
                isRetrograde,
              };

              // Store with refinement data
              eventsWithRefinement.push({
                event: ingressEvent,
                prevSampleIndex: prevState.previousSampleIndex ?? undefined,
                currentSampleIndex: i,
                prevLongitude: prevState.previousLongitude ?? undefined,
              });
              
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
            // Use approximate time for now, will refine later
            const utcDateTime = sampleDate;
            const tzOffsetHours = getTimezoneOffset(sampleDate);
            const localDateTime = new Date(
              utcDateTime.getTime() + tzOffsetHours * 60 * 60 * 1000
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

            // Store with refinement data
            eventsWithRefinement.push({
              event: stationEvent,
              prevSampleIndex: prevState.previousSampleIndex ?? undefined,
              currentSampleIndex: i,
              prevSpeed: prevState.speed ?? undefined,
            });

            detectedEvents.push(stationEvent);
          }

          // Update state
          planetStates[planetName] = {
            zodiacSign: currentZodiacSign,
            speed: currentSpeed,
            longitude: currentLongitude,
            previousLongitude: currentLongitude,
            previousSampleTime: sampleDate,
            previousSampleIndex: i - 1,
          };
        });

        // Detect aspects between all planet pairs
        // Use a small orb (0.5 degrees) to catch exact aspects with 12-hour sampling
        const ASPECT_ORB = 0.5;
        const aspectTypes = [
          { name: "conjunct" as const, check: checkForConjunct },
          { name: "opposition" as const, check: checkForOpposition },
          { name: "square" as const, check: checkForSquare },
          { name: "trine" as const, check: checkForTrine },
          { name: "sextile" as const, check: checkForSextile },
        ];

        // Check all planet pairs
        for (let i = 0; i < planetNames.length; i++) {
          for (let j = i + 1; j < planetNames.length; j++) {
            const planet1Name = planetNames[i];
            const planet2Name = planetNames[j];
            const planet1 = sample.planets[planet1Name];
            const planet2 = sample.planets[planet2Name];

            if (!planet1 || !planet2) continue;

            // Convert to PlanetPosition format for aspect checking
            const planet1Pos: PlanetPosition = {
              longitude: planet1.longitude,
              latitude: planet1.latitude || 0,
              distance: planet1.distance || 0,
              speed: planet1.speed || 0,
              zodiacSign: planet1.zodiacSign,
              zodiacSignName: planet1.zodiacSignName,
              degree: planet1.degree,
              degreeFormatted: planet1.degreeFormatted,
              symbol: "",
            };

            const planet2Pos: PlanetPosition = {
              longitude: planet2.longitude,
              latitude: planet2.latitude || 0,
              distance: planet2.distance || 0,
              speed: planet2.speed || 0,
              zodiacSign: planet2.zodiacSign,
              zodiacSignName: planet2.zodiacSignName,
              degree: planet2.degree,
              degreeFormatted: planet2.degreeFormatted,
              symbol: "",
            };

            // Check each aspect type
            for (const aspectType of aspectTypes) {
              const aspectKey = `${planet1Name}-${planet2Name}-${aspectType.name}`;
              const aspectResult = aspectType.check(
                planet1Pos,
                planet2Pos,
                ASPECT_ORB
              );

              const prevAspectState = aspectStates[aspectKey];
              const isCurrentlyExact =
                aspectResult.hasAspect &&
                aspectResult.orb !== undefined &&
                aspectResult.orb <= ASPECT_ORB;

              // Detect when aspect becomes exact (was not exact before, now is exact)
              if (
                isCurrentlyExact &&
                (!prevAspectState || !prevAspectState.wasExact)
              ) {
                // Calculate aspect angle for refinement
                const aspectAngles: Record<string, number> = {
                  conjunct: 0,
                  sextile: 60,
                  square: 90,
                  trine: 120,
                  opposition: 180,
                };
                const aspectAngle = aspectAngles[aspectType.name] || 0;
                const currentAspectAngle = ((planet1.longitude - planet2.longitude) % 360 + 360) % 360;
                
                // Get previous aspect angle if available
                let prevAspectAngle: number | undefined;
                if (prevAspectState && prevAspectState.orb !== undefined && prevAspectState.orb !== 999) {
                  // Estimate previous angle from orb
                  prevAspectAngle = aspectAngle; // Will be refined with actual calculation
                }

                const utcDateTime = sampleDate;
                const tzOffsetHours = getTimezoneOffset(sampleDate);
                const localDateTime = new Date(
                  utcDateTime.getTime() + tzOffsetHours * 60 * 60 * 1000
                );

                // Create aspect event
                const aspectEvent: AspectEvent = {
                  id: `aspect-${planet1Name}-${planet2Name}-${aspectType.name}-${sample.timestamp}`,
                  type: "aspect",
                  planet1: planet1Name,
                  planet2: planet2Name,
                  aspectName: aspectType.name,
                  date: localDateTime,
                  utcDateTime,
                  localDateTime,
                  orb: aspectResult.orb || 0,
                  planet1Position: {
                    degree: planet1.degree,
                    degreeFormatted: planet1.degreeFormatted,
                    zodiacSignName: planet1.zodiacSignName,
                  },
                  planet2Position: {
                    degree: planet2.degree,
                    degreeFormatted: planet2.degreeFormatted,
                    zodiacSignName: planet2.zodiacSignName,
                  },
                };

                // Calculate previous aspect angle from previous sample if available
                let actualPrevAspectAngle: number | undefined;
                if (i > 0 && samples[i - 1]?.planets) {
                  const prevP1 = samples[i - 1].planets[planet1Name];
                  const prevP2 = samples[i - 1].planets[planet2Name];
                  if (prevP1 && prevP2) {
                    actualPrevAspectAngle = ((prevP1.longitude - prevP2.longitude) % 360 + 360) % 360;
                  }
                }
                
                // Store with refinement data
                eventsWithRefinement.push({
                  event: aspectEvent,
                  prevSampleIndex: i > 0 ? i - 1 : undefined,
                  currentSampleIndex: i,
                  prevAspectAngle: actualPrevAspectAngle,
                });

                detectedEvents.push(aspectEvent);
              }

              // Update aspect state
              aspectStates[aspectKey] = {
                wasExact: isCurrentlyExact,
                orb: aspectResult.orb || 999,
              };
            }
          }
        }
      }

      // Sort events chronologically
      detectedEvents.sort(
        (a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime()
      );

      // Return both events and refinement data
      return { events: detectedEvents, refinementData: eventsWithRefinement, samples };
    },
    [currentChart]
  );
  
  // NOTE: Timestamp refinement is now handled by the backend
  // The following function is kept for reference but is no longer used
  const _unused_refineEventTimestamps = useCallback(
    async (
      events: CalendarEvent[],
      refinementData: EventWithRefinement[],
      samples: any[]
    ): Promise<CalendarEvent[]> => {
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };
      
      const getTimezoneOffset = (date: Date): number => {
        return -date.getTimezoneOffset() / 60;
      };
      
      const refinedEvents = await Promise.all(
        events.map(async (event) => {
          const refinement = refinementData.find(
            (r) => r.event.id === event.id
          );
          
          if (!refinement || refinement.prevSampleIndex === undefined) {
            return event; // No refinement data, return as-is
          }
          
          const prevSample = refinement.prevSampleIndex !== undefined 
            ? samples[refinement.prevSampleIndex] 
            : null;
          const currentSample = (refinement as any).currentSampleIndex !== undefined
            ? samples[(refinement as any).currentSampleIndex]
            : null;
          
          if (!prevSample || !currentSample) {
            return event; // Can't find samples, return as-is
          }
          
          const prevTime = prevSample.date || new Date(prevSample.timestamp);
          const currentTime = currentSample.date || new Date(currentSample.timestamp);
          
          try {
            let exactTime: Date;
            
            if (event.type === "ingress") {
              const targetSign = event.toSign === "Aries" ? 0 :
                                event.toSign === "Taurus" ? 1 :
                                event.toSign === "Gemini" ? 2 :
                                event.toSign === "Cancer" ? 3 :
                                event.toSign === "Leo" ? 4 :
                                event.toSign === "Virgo" ? 5 :
                                event.toSign === "Libra" ? 6 :
                                event.toSign === "Scorpio" ? 7 :
                                event.toSign === "Sagittarius" ? 8 :
                                event.toSign === "Capricorn" ? 9 :
                                event.toSign === "Aquarius" ? 10 : 11;
              
              exactTime = await findExactIngressTime(
                event.planet,
                targetSign,
                prevTime,
                currentTime,
                refinement.prevLongitude || 0,
                currentSample.planets[event.planet]?.longitude || 0,
                location.latitude,
                location.longitude
              );
            } else if (event.type === "station") {
              exactTime = await findExactStationTime(
                event.planet,
                prevTime,
                currentTime,
                refinement.prevSpeed || 0,
                currentSample.planets[event.planet]?.speed || 0,
                location.latitude,
                location.longitude
              );
            } else if (event.type === "aspect") {
              const aspectAngles: Record<string, number> = {
                conjunct: 0,
                sextile: 60,
                square: 90,
                trine: 120,
                opposition: 180,
              };
              const aspectAngle = aspectAngles[event.aspectName] || 0;
              
              // Calculate angular distance (shortest distance on circle)
              const getAngularDistance = (lon1: number, lon2: number): number => {
                const diff = Math.abs(lon1 - lon2);
                return Math.min(diff, 360 - diff);
              };
              
              const prevPlanet1 = prevSample.planets[event.planet1];
              const prevPlanet2 = prevSample.planets[event.planet2];
              const prevAngle = prevPlanet1 && prevPlanet2 
                ? getAngularDistance(prevPlanet1.longitude, prevPlanet2.longitude)
                : refinement.prevAspectAngle || 0;
              
              const currPlanet1 = currentSample.planets[event.planet1];
              const currPlanet2 = currentSample.planets[event.planet2];
              const currAngle = currPlanet1 && currPlanet2
                ? getAngularDistance(currPlanet1.longitude, currPlanet2.longitude)
                : 0;
              
              exactTime = await findExactAspectTime(
                event.planet1,
                event.planet2,
                aspectAngle,
                prevTime,
                currentTime,
                prevAngle,
                currAngle,
                location.latitude,
                location.longitude
              );
            } else {
              return event; // Unknown event type
            }
            
            // Update event with refined timestamp
            const tzOffsetHours = getTimezoneOffset(exactTime);
            const localDateTime = new Date(
              exactTime.getTime() + tzOffsetHours * 60 * 60 * 1000
            );
            
            return {
              ...event,
              utcDateTime: exactTime,
              localDateTime,
              date: localDateTime,
            };
          } catch (error) {
            console.error(`Error refining timestamp for event ${event.id}:`, error);
            return event; // Return original event if refinement fails
          }
        })
      );
      
      return refinedEvents;
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

      // Create cache key based on year and location
      const cacheKey = `${year}-${location.latitude}-${location.longitude}`;
      currentCacheKeyRef.current = cacheKey;

      // Check cache first
      const cachedData = ephemerisCache.get(cacheKey);
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRATION_MS) {
        console.log(`📦 Using cached year-ephemeris data for ${year}`);
        setEvents(cachedData.events);
        setLoading(false);
        return;
      }

      console.log(`🌐 Fetching year-ephemeris data for ${year} (cache miss or expired)`);

      // Fetch year ephemeris - backend now returns events with exact timestamps
      const response = await apiService.getYearEphemeris(
        year,
        location.latitude,
        location.longitude,
        12 // Sample every 12 hours for better detection
      );

      if (response.success && response.data?.events) {
        // Backend now provides events with exact timestamps
        const events = response.data.events.map((event: any) => {
          // Parse UTC datetime - ensure it's treated as UTC
          // If the string doesn't have 'Z' at the end, add it
          const utcString = event.utcDateTime.endsWith('Z') 
            ? event.utcDateTime 
            : event.utcDateTime + 'Z';
          const utcDateTime = new Date(utcString);
          
          // For display, we want the local time representation
          // JavaScript Date objects store time in UTC internally
          // When we create a Date from a UTC string, it's already correctly stored
          // The localDateTime is the same Date object - it will display in local time automatically
          // But we'll create it explicitly to be clear about the intent
          const localDateTime = new Date(utcDateTime);

          if (event.type === "ingress") {
            return {
              id: `ingress-${event.planet}-${event.utcDateTime}`,
              type: "ingress" as const,
              planet: event.planet,
              fromSign: event.fromSign,
              toSign: event.toSign,
              date: localDateTime,
              utcDateTime,
              localDateTime,
              degree: event.degree,
              degreeFormatted: event.degreeFormatted,
              isRetrograde: event.isRetrograde,
            } as IngressEvent;
          } else if (event.type === "station") {
            return {
              id: `station-${event.planet}-${event.utcDateTime}`,
              type: "station" as const,
              planet: event.planet,
              stationType: event.stationType,
              date: localDateTime,
              utcDateTime,
              localDateTime,
              degree: event.degree,
              degreeFormatted: event.degreeFormatted,
              zodiacSignName: event.zodiacSignName,
            } as StationEvent;
          } else if (event.type === "aspect") {
            return {
              id: `aspect-${event.planet1}-${event.planet2}-${event.aspectName}-${event.utcDateTime}`,
              type: "aspect" as const,
              planet1: event.planet1,
              planet2: event.planet2,
              aspectName: event.aspectName,
              date: localDateTime,
              utcDateTime,
              localDateTime,
              orb: event.orb,
              planet1Position: event.planet1Position,
              planet2Position: event.planet2Position,
            } as AspectEvent;
          }
          return null;
        }).filter((event): event is CalendarEvent => event !== null);

        const eventCounts = events.reduce(
          (acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            if (event.type === "station") {
              acc[`station-${event.stationType}`] =
                (acc[`station-${event.stationType}`] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>
        );
        console.log(
          `Calendar events received: ${events.length} total`,
          eventCounts
        );
        
        // Debug: Log raw backend response to see if stations are in the response
        const rawStationCount = response.data.events.filter(
          (e: any) => e.type === "station"
        ).length;
        if (rawStationCount > 0) {
          console.log(`✅ Backend returned ${rawStationCount} station events`);
        } else {
          console.warn(`⚠️ Backend returned 0 station events`);
        }
        
        // Store in cache
        ephemerisCache.set(cacheKey, {
          events,
          timestamp: now,
        });
        
        // Clean up old cache entries (keep only last 5 years worth)
        if (ephemerisCache.size > 5) {
          const entriesToDelete: string[] = [];
          ephemerisCache.forEach((value, key) => {
            if ((now - value.timestamp) > CACHE_EXPIRATION_MS) {
              entriesToDelete.push(key);
            }
          });
          entriesToDelete.forEach((key) => ephemerisCache.delete(key));
        }
        
        setEvents(events);
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
  }, [year, currentChart]);

  // Refresh calendar data (bypasses cache)
  const refreshCalendar = useCallback(async () => {
    const location = currentChart?.location || {
      latitude: 40.7128,
      longitude: -74.006,
    };
    const cacheKey = `${year}-${location.latitude}-${location.longitude}`;
    
    // Clear cache for this key to force refresh
    ephemerisCache.delete(cacheKey);
    
    await fetchYearEphemeris();
  }, [fetchYearEphemeris, year, currentChart]);

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

