// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useRef } from "react";
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
import { useYear } from "../contexts/YearContext";
import { apiService, BirthData } from "../services/api";
import { getZodiacColorStyle, getAspectColorStyle } from "../utils/colorUtils";
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

type CalendarEvent = LunationEvent | IngressEvent | StationEvent | AspectEvent;

// ============================================================================
// COMPONENT
// ============================================================================
export default function CalendarScreen() {
  const { currentChart } = useAstrology();
  const { fontLoaded } = usePhysisFont();
  const { year: selectedYear, setYear: setSelectedYear } = useYear();
  const { events: calendarEvents, loading: calendarLoading } = useCalendar();

  const [lunationEvents, setLunationEvents] = useState<LunationEvent[]>([]);
  const [lunationsLoading, setLunationsLoading] = useState(true);
  const [filterStates, setFilterStates] = useState({
    lunation: true,
    aspect: true,
    ingress: true,
    station: true,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const hasScrolledToToday = useRef(false);
  const todayItemRef = useRef<View>(null);

  // Fetch all lunations when year changes
  useEffect(() => {
    fetchAllLunations();
    // Reset scroll flag when year changes so we can auto-scroll to today if needed
    hasScrolledToToday.current = false;
  }, [selectedYear]);

  // Auto-scroll to today when year changes to current year and data loads
  useEffect(() => {
    const today = new Date();
    const todayYear = today.getFullYear();
    
    // Only auto-scroll if we just switched to the current year and data has loaded
    if (
      selectedYear === todayYear &&
      !loading &&
      filteredEvents &&
      filteredEvents.length > 0 &&
      !hasScrolledToToday.current &&
      scrollViewRef.current
    ) {
      // Small delay to ensure layout is complete, then scroll
      const timeoutId = setTimeout(() => {
        if (!hasScrolledToToday.current) {
          // Call the scroll logic directly here to avoid dependency issues
          const safeAllEvents = allEvents || [];
          const currentFilteredEvents = safeAllEvents.filter((event) => filterStates[event.type]);
          if (currentFilteredEvents && currentFilteredEvents.length > 0) {
            const todayDate = today.getDate();
            const todayMonth = today.getMonth();
            
            let targetIndex = currentFilteredEvents.findIndex((event) => {
              const eventDate = new Date(event.localDateTime);
              const eventYear = eventDate.getFullYear();
              const eventMonth = eventDate.getMonth();
              const eventDay = eventDate.getDate();
              
              return (
                eventYear > todayYear ||
                (eventYear === todayYear && eventMonth > todayMonth) ||
                (eventYear === todayYear && eventMonth === todayMonth && eventDay >= todayDate)
              );
            });

            if (targetIndex < 0) {
              for (let i = currentFilteredEvents.length - 1; i >= 0; i--) {
                const eventDate = new Date(currentFilteredEvents[i].localDateTime);
                if (
                  eventDate.getFullYear() < todayYear ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() < todayMonth) ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() === todayMonth &&
                    eventDate.getDate() < todayDate)
                ) {
                  targetIndex = i;
                  break;
                }
              }
              if (targetIndex < 0) targetIndex = 0;
            }

            const contentPadding = 20;
            const estimatedItemHeight = 85.5;
            const scrollY = contentPadding + (targetIndex * estimatedItemHeight);
            
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, scrollY - 10),
              animated: true,
            });
            hasScrolledToToday.current = true;
          }
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedYear, loading, filteredEvents?.length, allEvents?.length, filterStates]);

  const fetchAllLunations = async () => {
    try {
      setLunationsLoading(true);
      const year = selectedYear;
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

      // Use device's actual timezone offset (accounts for DST and timezone boundaries)
      const getTimezoneOffset = (date: Date): number => {
        // Get timezone offset in minutes, convert to hours
        return -date.getTimezoneOffset() / 60;
      };

      // Parse UTC times and store both UTC and local for display
      const phasesWithTimes = allPhases.map((phase) => {
        const utcDateTime = new Date(`${phase.date}Z`);
        // Use the actual timezone offset for this specific date (accounts for DST)
        const tzOffsetHours = getTimezoneOffset(utcDateTime);
        const localDateTime = new Date(
          utcDateTime.getTime() + tzOffsetHours * 60 * 60 * 1000
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
    ...(lunationEvents || []),
    ...(calendarEvents || []),
  ];

  // Sort chronologically
  allEvents.sort((a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime());

  // Filter events based on active filters
  const filteredEvents = (allEvents || []).filter((event) => filterStates[event.type]);

  // Debug logging
  React.useEffect(() => {
    if (!allEvents || allEvents.length === 0) return;
    const eventCounts = allEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    console.log("CalendarScreen - All events:", eventCounts);
    console.log("CalendarScreen - Filter states:", filterStates);
  }, [allEvents?.length, filterStates]);

  // Function to scroll to today's event (or nearest event)
  const scrollToToday = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    
    // If we're on a different year, switch to current year first
    if (selectedYear !== todayYear) {
      console.log(`🔍 scrollToToday - Switching from year ${selectedYear} to ${todayYear}`);
      setSelectedYear(todayYear);
      // Reset scroll flag so we can scroll after year change
      hasScrolledToToday.current = false;
      // The scroll will happen automatically when data loads via the auto-scroll on load logic
      return;
    }
    
    // Always use current filteredEvents - recalculate on each call
    const currentFilteredEvents = (allEvents || []).filter((event) => filterStates[event.type]);
    
    if (!scrollViewRef.current || !currentFilteredEvents || currentFilteredEvents.length === 0) {
      console.log("🔍 scrollToToday - No events or no scrollView ref");
      return;
    }
    
    // Reset the scroll flag so we can scroll again after filter changes
    hasScrolledToToday.current = false;

    const todayDate = today.getDate();
    const todayMonth = today.getMonth();

    console.log("🔍 scrollToToday - Today:", {
      fullDate: today.toISOString(),
      dateString: today.toDateString(),
      year: todayYear,
      month: todayMonth,
      date: todayDate,
    });
    console.log("🔍 scrollToToday - Total events:", currentFilteredEvents.length);
    console.log("🔍 scrollToToday - Active filters:", filterStates);
    
    // Log first few events to see what we're comparing against
    console.log("🔍 scrollToToday - First 5 events:");
    currentFilteredEvents.slice(0, 5).forEach((event, idx) => {
      const eventDate = new Date(event.localDateTime);
      console.log(`  Event ${idx}: ${eventDate.toDateString()} (${event.type})`);
    });

    // Find the first event that is today or upcoming (using same logic as isToday)
    let targetIndex = currentFilteredEvents.findIndex((event) => {
      const eventDate = new Date(event.localDateTime);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();
      
      const isTodayOrFuture =
        eventYear > todayYear ||
        (eventYear === todayYear && eventMonth > todayMonth) ||
        (eventYear === todayYear && eventMonth === todayMonth && eventDay >= todayDate);
      
      return isTodayOrFuture;
    });

    console.log("🔍 scrollToToday - Initial targetIndex:", targetIndex);

    // If no event for today or upcoming, find the last event before today
    if (targetIndex < 0) {
      // Find the last event before today
      for (let i = currentFilteredEvents.length - 1; i >= 0; i--) {
        const eventDate = new Date(currentFilteredEvents[i].localDateTime);
        if (
          eventDate.getFullYear() < todayYear ||
          (eventDate.getFullYear() === todayYear &&
            eventDate.getMonth() < todayMonth) ||
          (eventDate.getFullYear() === todayYear &&
            eventDate.getMonth() === todayMonth &&
            eventDate.getDate() < todayDate)
        ) {
          targetIndex = i;
          break;
        }
      }
      // If still no index found, use the first event
      if (targetIndex < 0) {
        targetIndex = 0;
      }
    }

    console.log("🔍 scrollToToday - Final targetIndex:", targetIndex);
    if (targetIndex >= 0 && targetIndex < currentFilteredEvents.length) {
      const targetEvent = currentFilteredEvents[targetIndex];
      console.log(
        "🔍 scrollToToday - Target event date:",
        new Date(targetEvent.localDateTime).toDateString(),
        "Type:",
        targetEvent.type
      );
    }

    // Calculate scroll position
    // Header and filters are OUTSIDE the ScrollView, so we only scroll within the content
    // ScrollView content has padding: 20px, and each item is approximately 80-85px tall
    setTimeout(() => {
      if (!scrollViewRef.current) return;

      const contentPadding = 20; // ScrollView contentContainerStyle padding
      const estimatedItemHeight = 85.5; // Fine-tuned estimate based on testing
      const scrollY = contentPadding + (targetIndex * estimatedItemHeight);
      
      console.log("🔍 scrollToToday - Calculating scroll:", {
        targetIndex,
        totalEvents: currentFilteredEvents.length,
        estimatedItemHeight,
        contentPadding,
        calculatedScrollY: scrollY,
      });

      scrollViewRef.current.scrollTo({
        y: Math.max(0, scrollY - 10), // Small offset to show item at top
        animated: true,
      });
    }, 100);
  };

  // Function to handle scrolling to today's item when it's measured (for auto-scroll on load)
  const handleTodayItemLayout = (event: any) => {
    if (!hasScrolledToToday.current && scrollViewRef.current) {
      const { y } = event.nativeEvent.layout;
      // y is the top position of the item relative to ScrollView content
      // Scroll with tiny offset to ensure item is visible at top
      scrollViewRef.current.scrollTo({
        y: Math.max(0, y - 5), // Tiny offset to ensure item is visible at top
        animated: true,
      });
      hasScrolledToToday.current = true;
    }
  };

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

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      {/* Combined Header with Year and Filters */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={() => setSelectedYear(selectedYear - 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.yearNavButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>{selectedYear}</Text>
          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={() => setSelectedYear(selectedYear + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.yearNavButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.scrollToTodayButton}
            onPress={scrollToToday}
            activeOpacity={0.7}
          >
            <Text style={styles.scrollToTodayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.filterRow}>
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
            >
              <View
                style={[
                  styles.checkbox,
                  filterStates.aspect && styles.checkboxChecked,
                ]}
              >
                {filterStates.aspect && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.filterLabel}>Aspects</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
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
      </View>

      {/* Events List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.eventsList}
        contentContainerStyle={styles.eventsListContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e6e6fa" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : filteredEvents && filteredEvents.length > 0 ? (
          (() => {
            // Calculate target index once before mapping
            const today = new Date();
            const todayDate = today.getDate();
            const todayMonth = today.getMonth();
            const todayYear = today.getFullYear();

            // Find the first event that is today or upcoming
            let targetIndex = filteredEvents.findIndex((event) => {
              const eventDate = new Date(event.localDateTime);
              return (
                eventDate.getFullYear() > todayYear ||
                (eventDate.getFullYear() === todayYear &&
                  eventDate.getMonth() > todayMonth) ||
                (eventDate.getFullYear() === todayYear &&
                  eventDate.getMonth() === todayMonth &&
                  eventDate.getDate() >= todayDate)
              );
            });

            // If no event for today or upcoming, find the last event before today
            if (targetIndex < 0) {
              for (let i = filteredEvents.length - 1; i >= 0; i--) {
                const eventDate = new Date(filteredEvents[i].localDateTime);
                if (
                  eventDate.getFullYear() < todayYear ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() < todayMonth) ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() === todayMonth &&
                    eventDate.getDate() < todayDate)
                ) {
                  targetIndex = i;
                  break;
                }
              }
              if (targetIndex < 0) targetIndex = 0;
            }

            return filteredEvents.map((event, index) => {
              const isTargetEvent = index === targetIndex;
            
            // Render lunation event
            if (event.type === "lunation") {
              const eventIsToday = isToday(event.localDateTime);
              return (
                <View
                  key={event.id}
                  ref={isTargetEvent ? todayItemRef : undefined}
                  onLayout={
                    isTargetEvent && !hasScrolledToToday.current
                      ? handleTodayItemLayout
                      : undefined
                  }
                  style={[
                    styles.eventItem,
                    eventIsToday && styles.eventItemToday,
                  ]}
                >
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
                sun: "☉",
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

              const eventIsToday = isToday(event.localDateTime);
              return (
                <View
                  key={event.id}
                  style={[
                    styles.eventItem,
                    eventIsToday && styles.eventItemToday,
                  ]}
                >
                  <View style={styles.eventLeftColumn}>
                    <Text style={styles.eventTitle}>
                      {planetSymbols[event.planet] || "•"} {planetName}
                      {event.isRetrograde ? " Rx" : ""} enters {event.toSign}
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

              const eventIsToday = isToday(event.localDateTime);
              return (
                <View
                  key={event.id}
                  ref={isTargetEvent ? todayItemRef : undefined}
                  onLayout={
                    isTargetEvent && !hasScrolledToToday.current
                      ? handleTodayItemLayout
                      : undefined
                  }
                  style={[
                    styles.eventItem,
                    eventIsToday && styles.eventItemToday,
                  ]}
                >
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
                    <Text style={styles.eventMoonPosition}>
                      <Text
                        style={{
                          color:
                            event.stationType === "retrograde"
                              ? "#FF6B6B"
                              : "#51CF66",
                        }}
                      >
                        {event.stationType === "retrograde" ? "R" : "D"}
                      </Text>{" "}
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "medium"),
                          getZodiacColorStyle(event.zodiacSignName),
                        ]}
                      >
                        {getZodiacKeysFromNames()[event.zodiacSignName]}
                      </Text>{" "}
                      <Text
                        style={getZodiacColorStyle(event.zodiacSignName)}
                      >
                        {event.degreeFormatted} {event.zodiacSignName}
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            }

            // Render aspect event
            if (event.type === "aspect") {
              const planetSymbols: Record<string, string> = {
                sun: "☉",
                mercury: "☿",
                venus: "♀",
                mars: "♂",
                jupiter: "♃",
                saturn: "♄",
                uranus: "♅",
                neptune: "♆",
                pluto: "♇",
              };

              const planet1Name =
                event.planet1.charAt(0).toUpperCase() + event.planet1.slice(1);
              const planet2Name =
                event.planet2.charAt(0).toUpperCase() + event.planet2.slice(1);
              
              // Format aspect name (capitalize first letter)
              const aspectName =
                event.aspectName.charAt(0).toUpperCase() +
                event.aspectName.slice(1);

              const eventIsToday = isToday(event.localDateTime);
              return (
                <View
                  key={event.id}
                  ref={isTargetEvent ? todayItemRef : undefined}
                  onLayout={
                    isTargetEvent && !hasScrolledToToday.current
                      ? handleTodayItemLayout
                      : undefined
                  }
                  style={[
                    styles.eventItem,
                    eventIsToday && styles.eventItemToday,
                  ]}
                >
                  <View style={styles.eventLeftColumn}>
                    <Text style={styles.eventTitle}>
                      {planetSymbols[event.planet1] || "•"} {planet1Name}{" "}
                      {aspectName} {planetSymbols[event.planet2] || "•"}{" "}
                      {planet2Name}
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
                        getZodiacColorStyle(event.planet1Position.zodiacSignName),
                      ]}
                    >
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "medium"),
                          getZodiacColorStyle(
                            event.planet1Position.zodiacSignName
                          ),
                        ]}
                      >
                        {getZodiacKeysFromNames()[
                          event.planet1Position.zodiacSignName
                        ]}
                      </Text>{" "}
                      {event.planet1Position.degreeFormatted}{" "}
                      {event.planet1Position.zodiacSignName}
                    </Text>
                    <Text
                      style={[
                        styles.eventMoonPosition,
                        getZodiacColorStyle(event.planet2Position.zodiacSignName),
                        { marginTop: 4 },
                      ]}
                    >
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "medium"),
                          getZodiacColorStyle(
                            event.planet2Position.zodiacSignName
                          ),
                        ]}
                      >
                        {getZodiacKeysFromNames()[
                          event.planet2Position.zodiacSignName
                        ]}
                      </Text>{" "}
                      {event.planet2Position.degreeFormatted}{" "}
                      {event.planet2Position.zodiacSignName}
                    </Text>
                  </View>
                </View>
              );
            }

            return null;
            });
          })()
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerLeft: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  yearNavButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  yearNavButtonText: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerText: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
    minWidth: 60,
    textAlign: "center",
  },
  headerCenter: {
    flex: 0,
    justifyContent: "center",
    marginHorizontal: 5,
  },
  scrollToTodayButton: {
    backgroundColor: "#2a2a3a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e6e6fa",
  },
  scrollToTodayButtonText: {
    color: "#e6e6fa",
    fontSize: 11,
    fontWeight: "600",
  },
  headerRight: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: "#e6e6fa",
    borderRadius: 3,
    marginRight: 6,
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
    fontSize: 10,
    fontWeight: "bold",
  },
  filterLabel: {
    color: "#e6e6fa",
    fontSize: 12,
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
  eventItemToday: {
    borderColor: "#e6e6fa",
    borderWidth: 2,
    backgroundColor: "#222",
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
