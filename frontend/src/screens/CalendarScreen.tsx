// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useAstrology } from "../contexts/AstrologyContext";
import { useCalendar } from "../contexts/CalendarContext";
import { apiService, BirthData } from "../services/api";
import { getZodiacColorStyle } from "../utils/colorUtils";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import { getZodiacKeysFromNames } from "../utils/physisSymbolMap";

// ============================================================================
// TYPES
// ============================================================================
interface LunarPhase {
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

type CalendarEventType = "lunation" | "aspect" | "ingress" | "station";

interface LunationEvent {
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
}

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

type CalendarEvent = LunationEvent | IngressEvent | StationEvent;

// ============================================================================
// COMPONENT
// ============================================================================
export default function CalendarScreen() {
  const { currentChart } = useAstrology();
  const { fontLoaded } = usePhysisFont();
  const { events: calendarEvents, loading: calendarLoading } = useCalendar();

  const [lunationEvents, setLunationEvents] = useState<LunationEvent[]>([]);
  const [lunationsLoading, setLunationsLoading] = useState(true);
  const [filterStates, setFilterStates] = useState({
    lunation: true,
    aspect: false,
    ingress: true,
    station: true,
  });

  // Fetch all lunations for 2025
  useEffect(() => {
    fetchAllLunations();
  }, []);

  const fetchAllLunations = async () => {
    try {
      setLunationsLoading(true);
      const year = 2025;
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
        setLunationEvents([]);
        setLunationsLoading(false);
        return;
      }

      // Get location from context or use default
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Calculate timezone offset based on longitude (rough approximation)
      const timezoneOffsetHours = Math.round(location.longitude / 15);

      // Parse UTC times and store both UTC and local for display
      const phasesWithTimes = allPhases.map((phase) => {
        const utcDateTime = new Date(`${phase.date}Z`);
        const localDateTime = new Date(
          utcDateTime.getTime() + timezoneOffsetHours * 60 * 60 * 1000
        );

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
            const birthData: BirthData = {
              year: phase.utcDateTime.getUTCFullYear(),
              month: phase.utcDateTime.getUTCMonth() + 1,
              day: phase.utcDateTime.getUTCDate(),
              hour: phase.utcDateTime.getUTCHours(),
              minute: phase.utcDateTime.getUTCMinutes(),
              latitude: location.latitude,
              longitude: location.longitude,
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
            console.error(
              `Error fetching moon position for ${phase.date}:`,
              error
            );
          }

          return phase;
        })
      );

      // Convert to LunationEvent format
      const lunations: LunationEvent[] = phasesWithMoonPositions
        .filter((phase) => phase.utcDateTime && phase.localDateTime)
        .map((phase, index) => {
          // Format the phase name (convert from camelCase to spaced words)
          const phaseName = phase.moonPhase
            .replace(/([A-Z])/g, " $1")
            .trim();

          return {
            id: `lunation-${index}-${phase.date}`,
            type: "lunation" as const,
            date: phase.localDateTime!,
            utcDateTime: phase.utcDateTime!,
            localDateTime: phase.localDateTime!,
            title: phaseName,
            moonPosition: phase.moonPosition,
          };
        });

      // Sort chronologically
      lunations.sort(
        (a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime()
      );

      setLunationEvents(lunations);
    } catch (error) {
      console.error("Error fetching lunations:", error);
      setLunationEvents([]);
    } finally {
      setLunationsLoading(false);
    }
  };

  // Get emoji for moon phase
  const getPhaseEmoji = (phaseName: string): string => {
    switch (phaseName) {
      case "New Moon":
        return "🌑";
      case "First Quarter":
        return "🌓";
      case "Full Moon":
        return "🌕";
      case "Last Quarter":
        return "🌗";
      default:
        return "🌙";
    }
  };

  // Toggle filter
  const toggleFilter = (type: CalendarEventType) => {
    setFilterStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Combine all events
  const allEvents: CalendarEvent[] = [
    ...lunationEvents,
    ...(calendarEvents || []),
  ];

  // Sort chronologically
  allEvents.sort((a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime());

  // Debug logging
  React.useEffect(() => {
    const eventCounts = allEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    console.log("CalendarScreen - All events:", eventCounts);
    console.log("CalendarScreen - Filter states:", filterStates);
  }, [allEvents.length, filterStates]);

  // Filter events based on active filters
  const filteredEvents = allEvents.filter((event) => filterStates[event.type]);

  const loading = lunationsLoading || calendarLoading;

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>2025</Text>
      </View>

      {/* Filter Checkboxes */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter by Category:</Text>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterCheckbox}
            onPress={() => toggleFilter("lunation")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                filterStates.lunation && styles.checkboxChecked,
              ]}
            >
              {filterStates.lunation && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.filterLabel}>Lunations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterCheckbox}
            onPress={() => toggleFilter("aspect")}
            activeOpacity={0.7}
            disabled={true}
          >
            <View
              style={[
                styles.checkbox,
                filterStates.aspect && styles.checkboxChecked,
                styles.checkboxDisabled,
              ]}
            >
              {filterStates.aspect && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[styles.filterLabel, styles.filterLabelDisabled]}>
              Aspects
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterCheckbox}
            onPress={() => toggleFilter("ingress")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                filterStates.ingress && styles.checkboxChecked,
              ]}
            >
              {filterStates.ingress && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.filterLabel}>Ingresses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterCheckbox}
            onPress={() => toggleFilter("station")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                filterStates.station && styles.checkboxChecked,
              ]}
            >
              {filterStates.station && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.filterLabel}>Stations</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e6e6fa" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            // Render lunation event
            if (event.type === "lunation") {
              return (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventLeftColumn}>
                    <Text style={styles.eventTitle}>
                      {getPhaseEmoji(event.title)} {event.title}
                    </Text>
                    <Text style={styles.eventDate}>
                      {formatDate(event.localDateTime)} at{" "}
                      {formatTime(event.localDateTime)}
                    </Text>
                  </View>
                  {event.moonPosition && (
                    <View style={styles.eventRightColumn}>
                      <Text
                        style={[
                          styles.eventMoonPosition,
                          getZodiacColorStyle(
                            event.moonPosition.zodiacSignName
                          ),
                        ]}
                      >
                        <Text
                          style={[
                            getPhysisSymbolStyle(fontLoaded, "medium"),
                            getZodiacColorStyle(
                              event.moonPosition.zodiacSignName
                            ),
                          ]}
                        >
                          {getZodiacKeysFromNames()[
                            event.moonPosition.zodiacSignName
                          ]}
                        </Text>{" "}
                        {event.moonPosition.degreeFormatted}{" "}
                        {event.moonPosition.zodiacSignName}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }

            // Render ingress event
            if (event.type === "ingress") {
              const planetSymbols: Record<string, string> = {
                mercury: "☿",
                venus: "♀",
                mars: "♂",
                jupiter: "♃",
                saturn: "♄",
                uranus: "♅",
                neptune: "♆",
                pluto: "♇",
              };

              const planetName =
                event.planet.charAt(0).toUpperCase() + event.planet.slice(1);

              return (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventLeftColumn}>
                    <Text style={styles.eventTitle}>
                      {planetSymbols[event.planet] || "•"} {planetName} enters{" "}
                      {event.toSign}
                    </Text>
                    <Text style={styles.eventDate}>
                      {formatDate(event.localDateTime)} at{" "}
                      {formatTime(event.localDateTime)}
                    </Text>
                  </View>
                  <View style={styles.eventRightColumn}>
                    <Text
                      style={[
                        styles.eventMoonPosition,
                        getZodiacColorStyle(event.toSign),
                      ]}
                    >
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "medium"),
                          getZodiacColorStyle(event.toSign),
                        ]}
                      >
                        {getZodiacKeysFromNames()[event.toSign]}
                      </Text>{" "}
                      {event.degreeFormatted} {event.toSign}
                    </Text>
                  </View>
                </View>
              );
            }

            // Render station event
            if (event.type === "station") {
              const planetSymbols: Record<string, string> = {
                mercury: "☿",
                venus: "♀",
                mars: "♂",
                jupiter: "♃",
                saturn: "♄",
                uranus: "♅",
                neptune: "♆",
                pluto: "♇",
              };

              const planetName =
                event.planet.charAt(0).toUpperCase() + event.planet.slice(1);
              const stationLabel =
                event.stationType === "retrograde"
                  ? "stations retrograde"
                  : "stations direct";

              return (
                <View key={event.id} style={styles.eventItem}>
                  <View style={styles.eventLeftColumn}>
                    <Text style={styles.eventTitle}>
                      {planetSymbols[event.planet] || "•"} {planetName}{" "}
                      {stationLabel}
                    </Text>
                    <Text style={styles.eventDate}>
                      {formatDate(event.localDateTime)} at{" "}
                      {formatTime(event.localDateTime)}
                    </Text>
                  </View>
                  <View style={styles.eventRightColumn}>
                    <Text
                      style={[
                        styles.eventMoonPosition,
                        event.stationType === "retrograde"
                          ? { color: "#FF6B6B" }
                          : { color: "#51CF66" },
                      ]}
                    >
                      {event.stationType === "retrograde" ? "R" : "D"}{" "}
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "medium"),
                          getZodiacColorStyle(event.zodiacSignName),
                        ]}
                      >
                        {getZodiacKeysFromNames()[event.zodiacSignName]}
                      </Text>{" "}
                      {event.degreeFormatted} {event.zodiacSignName}
                    </Text>
                  </View>
                </View>
              );
            }

            return null;
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerText: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  filtersContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  filtersTitle: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 15,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  filterCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#e6e6fa",
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#e6e6fa",
  },
  checkboxDisabled: {
    borderColor: "#555",
    opacity: 0.5,
  },
  checkmark: {
    color: "#111",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterLabel: {
    color: "#e6e6fa",
    fontSize: 14,
  },
  filterLabelDisabled: {
    color: "#555",
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#e6e6fa",
    marginTop: 15,
    fontSize: 14,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  eventLeftColumn: {
    flex: 1,
    marginRight: 15,
  },
  eventTitle: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  eventDate: {
    color: "#8a8a8a",
    fontSize: 13,
  },
  eventRightColumn: {
    alignItems: "flex-end",
  },
  eventMoonPosition: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 14,
  },
});
