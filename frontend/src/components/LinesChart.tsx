// ============================================================================
// LINES CHART COMPONENT
// ============================================================================
// Displays planet positions throughout a year as line charts (360-degree zodiac)
// Rotated 90° clockwise: dates on left (Y-axis), degrees on bottom (X-axis)

import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G, Rect } from "react-native-svg";
import { LinesChartData, PlanetDataset } from "../utils/ephemerisChartData";
import { getZodiacElement, getZodiacColorStyle } from "../utils/colorUtils";
import { COLORS } from "../utils/colorUtils";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import { getZodiacKeysFromNames } from "../utils/physisSymbolMap";

// ============================================================================
// TYPES
// ============================================================================

interface LunationMarker {
  date: Date;
  longitude: number; // Moon's zodiac longitude (0-360)
  phase: "New Moon" | "Full Moon";
  isEclipse?: boolean;
  eclipseType?: "lunar" | "solar";
}

interface LinesChartProps {
  data: LinesChartData;
  width?: number;
  height?: number;
  showHeader?: boolean; // Option to show/hide header (if moved to parent)
  lunations?: LunationMarker[]; // New and full moon markers
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats planet name for display
 * Converts "northNode" to "N. Node", other planets get capitalized first letter
 */
function formatPlanetNameForDisplay(planetName: string): string {
  if (planetName.toLowerCase() === "northnode") {
    return "N. Node";
  }
  return planetName.charAt(0).toUpperCase() + planetName.slice(1);
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ZODIAC_SIGNS = [
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const HEADER_HEIGHT = 50; // Height for zodiac header row (not used in this component)
const CHART_PADDING = {
  top: 0, // No top padding
  right: 0, // No right margin
  bottom: 20, // Minimal bottom padding
  left: 0, // No left margin
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert zodiac degree (0-360) to X coordinate on chart (rotated 90° clockwise)
 * Degrees go from left (0°) to right (360°)
 */
function degreeToX(
  degree: number,
  chartWidth: number,
  padding: typeof CHART_PADDING
): number {
  const chartAreaWidth = chartWidth - padding.left - padding.right;
  const normalizedDegree = degree % 360;
  // 0° at left, 360° at right
  const x = padding.left + (normalizedDegree / 360) * chartAreaWidth;
  return x;
}

/**
 * Convert date index to Y coordinate on chart (rotated 90° clockwise)
 * Dates go from top (first date) to bottom (last date)
 */
function dateIndexToY(
  index: number,
  totalDates: number,
  chartHeight: number,
  padding: typeof CHART_PADDING
): number {
  const chartAreaHeight = chartHeight - padding.top - padding.bottom;
  if (totalDates <= 1) return padding.top;
  // First date at top, last date at bottom
  const y = padding.top + (index / (totalDates - 1)) * chartAreaHeight;
  return y;
}

/**
 * Format date for Y-axis labels - returns full month name in uppercase
 */
function formatDateLabel(date: Date): string {
  const monthNames = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  return monthNames[date.getMonth()];
}

/**
 * Get zodiac sign color based on element
 */
function getZodiacSignColor(signName: string): string {
  const element = getZodiacElement(signName);
  switch (element) {
    case "fire":
      return COLORS.fire;
    case "water":
      return COLORS.water;
    case "earth":
      return COLORS.earth;
    case "air":
      return COLORS.air;
    default:
      return "#333";
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LinesChart({
  data,
  width,
  height,
  showHeader = true,
  lunations = [],
}: LinesChartProps) {
  const { dates, planets } = data;
  const { fontLoaded } = usePhysisFont();

  if (dates.length === 0 || planets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Chart is 100% width, height based on data points
  // Use full screen width with no margins
  const chartWidth = width || SCREEN_WIDTH;
  // Calculate height: ~2px per date point, minimum reasonable height
  const calculatedHeight = Math.max(dates.length * 2, 600);
  const chartHeight = height || calculatedHeight;
  const padding = CHART_PADDING;

  // Generate X-axis grid lines (every 30 degrees = one zodiac sign) - now horizontal
  const xAxisTicks = Array.from({ length: 13 }, (_, i) => i * 30); // 0, 30, 60, ..., 360

  // Generate zodiac header row (above chart)
  // Calculate the width of each sign section
  const signSectionWidth = (chartWidth - padding.left - padding.right) / 12;

  const zodiacHeaderItems = ZODIAC_SIGNS.map((sign, index) => {
    const signKey = getZodiacKeysFromNames()[sign];
    const signColor = getZodiacSignColor(sign);
    const leftPosition = padding.left + index * signSectionWidth;

    return (
      <View
        key={`header-${sign}`}
        style={[
          styles.zodiacHeaderItem,
          {
            left: leftPosition,
            width: signSectionWidth,
            backgroundColor: signColor,
          },
        ]}
      >
        <Text
          style={[
            getPhysisSymbolStyle(fontLoaded, "medium"),
            styles.zodiacSymbol,
          ]}
        >
          {signKey}
        </Text>
      </View>
    );
  });

  // Generate background rectangles for each zodiac sign (now horizontal)
  const zodiacRects = ZODIAC_SIGNS.map((sign, index) => {
    const startDegree = index * 30;
    const endDegree = (index + 1) * 30;
    const x1 = degreeToX(startDegree, chartWidth, padding);

    // For the last sign (Pisces, 330-360°), ensure it extends to the right edge
    let x2;
    if (index === ZODIAC_SIGNS.length - 1) {
      // Last sign: extend to the right edge of the chart
      x2 = chartWidth - padding.right;
    } else {
      x2 = degreeToX(endDegree, chartWidth, padding);
    }

    const color = getZodiacSignColor(sign);
    const opacity = 0.15; // Subtle background

    return (
      <Rect
        key={sign}
        x={x1}
        y={padding.top}
        width={x2 - x1}
        height={chartHeight - padding.top - padding.bottom}
        fill={color}
        opacity={opacity}
      />
    );
  });

  // Generate planet dots (one for each daily entry, no connecting lines)
  const planetDots = planets.flatMap((planetDataset) => {
    return planetDataset.data.map((point, index) => {
      const x = degreeToX(point.longitude, chartWidth, padding);
      const y = dateIndexToY(index, dates.length, chartHeight, padding);

      return (
        <Circle
          key={`${planetDataset.planet}-${index}`}
          cx={x}
          cy={y}
          r={3}
          fill={planetDataset.color}
          opacity={0.9}
        />
      );
    });
  });

  // Generate lunation markers (larger dots for New and Full Moons)
  const lunationDots = lunations
    .map((lunation) => {
      // Determine if this is a full moon (declared once at the start)
      const isFullMoon = lunation.phase === "Full Moon";
      const isEclipse = lunation.isEclipse || false;
      const eclipseType = lunation.eclipseType;

      // Find the closest date index for this lunation
      const lunationDate = new Date(lunation.date);
      const dateIndex = dates.findIndex((date) => {
        // Compare year, month, and day (ignore time for matching)
        return (
          date.getFullYear() === lunationDate.getFullYear() &&
          date.getMonth() === lunationDate.getMonth() &&
          date.getDate() === lunationDate.getDate()
        );
      });

      let targetDateIndex: number;

      // If we can't find an exact match, try to find the closest date
      if (dateIndex < 0) {
        // Find closest date by time difference
        let closestIndex = 0;
        let minDiff = Infinity;
        dates.forEach((date, index) => {
          const diff = Math.abs(date.getTime() - lunationDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
          }
        });
        // Only use if within 24 hours
        if (minDiff >= 24 * 60 * 60 * 1000) {
          return null;
        }
        targetDateIndex = closestIndex;
      } else {
        targetDateIndex = dateIndex;
      }

      const x = degreeToX(lunation.longitude, chartWidth, padding);
      const y = dateIndexToY(
        targetDateIndex,
        dates.length,
        chartHeight,
        padding
      );

      // Eclipse markers: red fill for eclipses
      if (isEclipse) {
        return (
          <Circle
            key={`lunation-${lunation.date.getTime()}`}
            cx={x}
            cy={y}
            r={6} // Same size as regular lunations
            fill="#FF6B6B" // Red for eclipses
            opacity={0.95}
          />
        );
      }

      // Regular lunation markers
      return (
        <Circle
          key={`lunation-${lunation.date.getTime()}`}
          cx={x}
          cy={y}
          r={6} // Same size for both new and full moon
          fill={isFullMoon ? "#EEEEEE" : "#222222"} // Light gray for full moon, dark gray for new
          opacity={0.95}
        />
      );
    })
    .filter((dot): dot is React.ReactElement => dot !== null);

  // Generate Y-axis date labels - only show first day of each month
  const yAxisLabels: React.ReactElement[] = [];
  dates.forEach((date, index) => {
    // Only show labels for the first day of each month (day === 1)
    if (date.getDate() === 1) {
      const y = dateIndexToY(index, dates.length, chartHeight, padding);
      // Left side labels only - positioned at edge with small padding
      yAxisLabels.push(
        <SvgText
          key={`left-${index}`}
          x={padding.left + 2}
          y={y + 8}
          fontSize="9"
          fill="#8a8a8a"
          textAnchor="start"
        >
          {formatDateLabel(date)}
        </SvgText>
      );
    }
  });

  // Generate month-end lines - black horizontal lines at the first day of each month (1/1, 2/1, etc.) with negative offset
  const monthEndLines: React.ReactElement[] = [];
  dates.forEach((date, index) => {
    // Only show lines for the first day of each month (day === 1)
    if (date.getDate() === 1) {
      const y = dateIndexToY(index, dates.length, chartHeight, padding);
      // Use negative offset to position at end of previous month
      const offsetY = y - 1;
      monthEndLines.push(
        <Line
          key={`month-end-${index}`}
          x1={padding.left}
          y1={offsetY}
          x2={chartWidth - padding.right}
          y2={offsetY}
          stroke="#000000"
          strokeWidth={1}
          opacity={1}
        />
      );
    }
  });

  // Find today's date and draw a horizontal line (only if viewing current year)
  // Gracefully handles case where today's date is not in the data (different year)
  const today = new Date();
  const todayIndex = dates.findIndex((date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  });

  // Only create the line if today's date exists in the data
  // If viewing a different year, todayIndex will be -1 and no line will be drawn
  let todayLine: React.ReactElement | null = null;
  if (todayIndex >= 0 && todayIndex < dates.length) {
    const todayY = dateIndexToY(todayIndex, dates.length, chartHeight, padding);
    todayLine = (
      <Line
        key="today-line"
        x1={padding.left}
        y1={todayY}
        x2={chartWidth - padding.right}
        y2={todayY}
        stroke="#FFFFFF"
        strokeWidth={2}
        opacity={0.8}
      />
    );
  }

  // X-axis labels removed per user request

  return (
    <View style={styles.container}>
      {/* Zodiac Header Row - only show if showHeader is true */}
      {showHeader && (
        <View style={[styles.zodiacHeader, { width: chartWidth }]}>
          {zodiacHeaderItems}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Background: Zodiac sign rectangles (horizontal) */}
            <G>{zodiacRects}</G>

            {/* Month-end lines - black horizontal lines at end of each month */}
            <G>{monthEndLines}</G>

            {/* Grid lines: X-axis (every 30 degrees, now vertical lines) */}
            {xAxisTicks.map((degree) => {
              const x = degreeToX(degree, chartWidth, padding);
              return (
                <Line
                  key={`grid-${degree}`}
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={chartHeight - padding.bottom}
                  stroke="#333"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                  opacity={0.3}
                />
              );
            })}

            {/* Planet dots (one per day, no connecting lines) */}
            <G>{planetDots}</G>

            {/* Lunation markers (New and Full Moons) - larger dots */}
            <G>{lunationDots}</G>

            {/* Today's date marker - horizontal white line */}
            {todayLine}

            {/* Axes */}
            {/* Y-axis (left, vertical) */}
            <Line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={chartHeight - padding.bottom}
              stroke="#555"
              strokeWidth={1}
            />

            {/* Labels */}
            <G>{yAxisLabels}</G>
          </Svg>

          {/* Planet legend */}
          <View style={styles.legend}>
            {planets.map((planet) => (
              <View key={planet.planet} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: planet.color },
                  ]}
                />
                <Text style={styles.legendText}>
                  {formatPlanetNameForDisplay(planet.planet)}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
    width: "100%",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  chartContainer: {
    width: "100%",
    alignItems: "flex-start", // Changed from center to prevent centering offsets
    paddingTop: 0, // No top padding
    paddingHorizontal: 0, // No horizontal padding
    marginHorizontal: 0,
    marginTop: 0, // No top margin
  },
  zodiacHeader: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    position: "relative",
    marginBottom: 10,
  },
  zodiacHeaderItem: {
    height: HEADER_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  zodiacSymbol: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    paddingHorizontal: 10,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    color: "#e6e6fa",
    fontSize: 12,
  },
});
