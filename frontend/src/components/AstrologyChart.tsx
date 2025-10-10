// ============================================================================
// IMPORTS
// ============================================================================
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getPlanetKeysFromNames,
  getZodiacKeysFromNames,
  getZodiacSymbols,
} from "../utils/physisSymbolMap";
import { PlanetPosition as ApiPlanetPosition } from "../services/api";
import {
  checkForConjunct,
  checkForOpposition,
  checkForSquare,
  checkForTrine,
  checkForSextile,
} from "../utils/aspectUtils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface AstrologyChartProps {
  planets: Record<string, ApiPlanetPosition>;
  houses?: {
    cusps: number[];
    ascendant: number;
    ascendantSign: string;
    ascendantDegree: string;
    mc: number;
    mcSign: string;
    mcDegree: string;
  };
  size?: number;
  loading?: boolean;
  error?: string | null;
}

interface ChartPlanetPosition {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  degree: number;
  sign: string;
  symbol: string;
  name: string;
  isRetrograde?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: screenWidth } = Dimensions.get("window");
const CHART_SIZE = Math.min(screenWidth - 20, 400);
const CENTER_X = CHART_SIZE / 2;
const CENTER_Y = CHART_SIZE / 2;
const ZODIAC_RADIUS = CHART_SIZE * 0.35;
const ZODIAC_SYMBOLS_RADIUS = CHART_SIZE * 0.3; // Separate radius for zodiac symbols (smaller)
const HOUSES_RADIUS = CHART_SIZE * 0.25;
const PLANETS_RADIUS = CHART_SIZE * 0.35; // For aspect line connections (on zodiac circle)
const PLANET_LABELS_RADIUS = CHART_SIZE * 0.45; // For symbol/label display (outside)

// Zodiac signs in order (starting from Aries at 0°)
// Colors based on elemental associations: Fire (red), Earth (green), Water (blue), Air (yellow)
// Using rgba for transparency to blend with the dynamic background
const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "a", color: "rgba(231, 41, 41, 1)" }, // Fire - Aries
  { name: "Taurus", symbol: "s", color: "rgba(22, 163, 82, 1)" }, // Earth - Taurus
  { name: "Gemini", symbol: "d", color: "rgba(245, 238, 43, 1)" }, // Air - Gemini
  { name: "Cancer", symbol: "f", color: "rgba(66, 85, 227, 1)" }, // Water - Cancer
  { name: "Leo", symbol: "g", color: "rgba(231, 41, 41, 1)" }, // Fire - Leo
  { name: "Virgo", symbol: "h", color: "rgba(22, 163, 82, 1)" }, // Earth - Virgo
  { name: "Libra", symbol: "j", color: "rgba(245, 238, 43, 1)" }, // Air - Libra
  { name: "Scorpio", symbol: "k", color: "rgba(66, 85, 227, 1)" }, // Water - Scorpio
  { name: "Sagittarius", symbol: "l", color: "rgba(231, 41, 41, 1)" }, // Fire - Sagittarius
  { name: "Capricorn", symbol: ";", color: "rgba(22, 163, 82, 1)" }, // Earth - Capricorn
  { name: "Aquarius", symbol: "'", color: "rgba(245, 238, 43, 1)" }, // Air - Aquarius
  { name: "Pisces", symbol: "z", color: "rgba(66, 85, 227, 1)" }, // Water - Pisces
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert degrees to radians
 */
const degreesToRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Convert longitude to chart position (adjusting for chart orientation)
 */
const longitudeToPosition = (
  longitude: number,
  radius: number,
  ascendantSign?: string
) => {
  // Calculate rotation offset based on ascendant sign
  // We want the ascendant's zodiac sign to be positioned at the left side, just below horizontal
  let rotationOffset = -120; // Default rotation (Aquarius position)

  if (ascendantSign) {
    // Find the zodiac sign index (0-11)
    const zodiacSigns = [
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
    const ascendantSignIndex = zodiacSigns.indexOf(ascendantSign);

    if (ascendantSignIndex !== -1) {
      // Calculate rotation to position this sign at the left side (Aquarius position)
      // Aquarius is at index 10, so we need to rotate by the difference
      const degreesPerSign = 30;
      const targetPosition = 10 * degreesPerSign; // Aquarius position (300°)
      const currentPosition = ascendantSignIndex * degreesPerSign; // Current sign position
      rotationOffset = targetPosition - currentPosition - 120; // -120 for chart orientation
    }
  }

  const adjustedLongitude = longitude + rotationOffset;
  const radians = degreesToRadians(adjustedLongitude);
  return {
    x: CENTER_X + radius * Math.cos(radians),
    y: CENTER_Y - radius * Math.sin(radians), // Flip Y coordinate to mirror over horizontal axis
  };
};

/**
 * Get zodiac sign color by sign name (lighter version for planet labels)
 */
const getZodiacSignColor = (signName: string): string => {
  const sign = ZODIAC_SIGNS.find((s) => s.name === signName);
  if (!sign) return "#e6e6fa"; // Default to light color if not found

  // Return lighter, more opaque versions of the zodiac sign colors for planet labels
  const lighterColors: { [key: string]: string } = {
    "rgba(231, 41, 41, 1)": "#e72929", // Lighter red for Fire signs
    "rgba(22, 163, 82, 1)": "#16a352", // Lighter green for Earth signs
    "rgba(66, 85, 227, 1)": "#4255e3", // Lighter blue for Water signs
    "rgba(245, 238, 43, 1)": "#f5ee2b", // Lighter yellow for Air signs
  };

  return lighterColors[sign.color] || sign.color;
};

/**
 * Get planet positions for the chart
 */
const getPlanetPositions = (
  planets: Record<string, ApiPlanetPosition>,
  fontLoaded: boolean,
  ascendantSign?: string
): ChartPlanetPosition[] => {
  const planetKeys = getPlanetKeysFromNames();
  const zodiacKeys = getZodiacKeysFromNames();

  return Object.entries(planets).map(([planetName, planet]) => {
    const aspectPosition = longitudeToPosition(
      planet.longitude,
      PLANETS_RADIUS,
      ascendantSign
    );
    const labelPosition = longitudeToPosition(
      planet.longitude,
      PLANET_LABELS_RADIUS,
      ascendantSign
    );
    const capitalizedName =
      planetName.charAt(0).toUpperCase() + planetName.slice(1);
    const physisKey = planetKeys[capitalizedName];
    const zodiacKey = zodiacKeys[planet.zodiacSignName];

    return {
      x: aspectPosition.x,
      y: aspectPosition.y,
      labelX: labelPosition.x,
      labelY: labelPosition.y,
      degree: planet.longitude,
      sign: planet.zodiacSignName,
      symbol: physisKey || planetName.charAt(0).toUpperCase(),
      name: planetName,
      isRetrograde: planet.isRetrograde,
    };
  });
};

/**
 * Get aspect lines between planets
 */
const getAspectLines = (planets: ChartPlanetPosition[]) => {
  const lines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    type: string;
  }> = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];

      // Check for aspects
      const conjunct = checkForConjunct(
        { longitude: planet1.degree, zodiacSignName: planet1.sign } as any,
        { longitude: planet2.degree, zodiacSignName: planet2.sign } as any,
        5
      );
      const opposition = checkForOpposition(
        { longitude: planet1.degree, zodiacSignName: planet1.sign } as any,
        { longitude: planet2.degree, zodiacSignName: planet2.sign } as any,
        5
      );
      const square = checkForSquare(
        { longitude: planet1.degree, zodiacSignName: planet1.sign } as any,
        { longitude: planet2.degree, zodiacSignName: planet2.sign } as any,
        5
      );
      const trine = checkForTrine(
        { longitude: planet1.degree, zodiacSignName: planet1.sign } as any,
        { longitude: planet2.degree, zodiacSignName: planet2.sign } as any,
        5
      );
      const sextile = checkForSextile(
        { longitude: planet1.degree, zodiacSignName: planet1.sign } as any,
        { longitude: planet2.degree, zodiacSignName: planet2.sign } as any,
        5
      );

      if (conjunct.hasAspect) {
        lines.push({
          x1: planet1.x,
          y1: planet1.y,
          x2: planet2.x,
          y2: planet2.y,
          color: "#FF0000", // Pure red
          type: "conjunct",
        });
      } else if (opposition.hasAspect) {
        lines.push({
          x1: planet1.x,
          y1: planet1.y,
          x2: planet2.x,
          y2: planet2.y,
          color: "#FF0000", // Pure red
          type: "opposition",
        });
      } else if (square.hasAspect) {
        lines.push({
          x1: planet1.x,
          y1: planet1.y,
          x2: planet2.x,
          y2: planet2.y,
          color: "#FF0000", // Pure red
          type: "square",
        });
      } else if (trine.hasAspect) {
        lines.push({
          x1: planet1.x,
          y1: planet1.y,
          x2: planet2.x,
          y2: planet2.y,
          color: "#00FF00", // Pure green
          type: "trine",
        });
      } else if (sextile.hasAspect) {
        lines.push({
          x1: planet1.x,
          y1: planet1.y,
          x2: planet2.x,
          y2: planet2.y,
          color: "#0000FF", // Pure blue
          type: "sextile",
        });
      }
    }
  }

  return lines;
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function AstrologyChart({
  planets,
  houses,
  size = CHART_SIZE,
  loading = false,
  error = null,
}: AstrologyChartProps) {
  const { fontLoaded } = usePhysisFont();

  // Debug logging for prop changes
  useEffect(() => {
    console.log("🎯 AstrologyChart props updated:", {
      hasPlanets: !!planets,
      hasHouses: !!houses,
      planetsCount: planets ? Object.keys(planets).length : 0,
      housesData: houses
        ? {
            ascendant: houses.ascendant,
            ascendantSign: houses.ascendantSign,
            ascendantDegree: houses.ascendantDegree,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  }, [planets, houses]);

  // Always maintain the container height to prevent layout shifts
  const containerStyle = [
    styles.container,
    { height: size, width: size, minHeight: size },
  ];

  // Show loading state if no planets data
  if (!planets || Object.keys(planets).length === 0) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  const ascendantSign = houses?.ascendantSign;
  const planetPositions = getPlanetPositions(
    planets,
    fontLoaded,
    ascendantSign
  );
  const aspectLines = getAspectLines(planetPositions);

  // Temporary test: force Pluto to be retrograde for testing
  const testPlanetPositions = planetPositions.map((planet) => {
    if (planet.name === "pluto") {
      return { ...planet, isRetrograde: true };
    }
    return planet;
  });

  return (
    <View style={containerStyle}>
      <Svg width={size} height={size}>
        {/* Zodiac signs ring */}
        {ZODIAC_SIGNS.map((sign, index) => {
          // Calculate the center longitude of each sign (15° mark within each 30° sign)
          const signCenterLongitude = index * 30 + 15;

          // Use the same positioning logic as planets
          const position = longitudeToPosition(
            signCenterLongitude,
            ZODIAC_SYMBOLS_RADIUS,
            ascendantSign
          );

          // Calculate the start and end angles for the pie slice
          const startAngle = index * 30;
          const endAngle = (index + 1) * 30;

          // Convert to chart coordinates for the pie slice edges
          const startPos = longitudeToPosition(
            startAngle,
            ZODIAC_RADIUS,
            ascendantSign
          );
          const endPos = longitudeToPosition(
            endAngle,
            ZODIAC_RADIUS,
            ascendantSign
          );

          return (
            <G key={sign.name}>
              {/* Sign arc border */}
              <Path
                d={`M ${startPos.x} ${startPos.y} A ${ZODIAC_RADIUS} ${ZODIAC_RADIUS} 0 0 0 ${endPos.x} ${endPos.y}`}
                stroke={sign.color}
                strokeWidth="10"
                fill="none"
                strokeLinecap="butt"
              />
              {/* Sign symbol */}
              <SvgText
                x={position.x}
                y={position.y + 5}
                fontSize="20"
                fill="#e6e6fa"
                textAnchor="middle"
                fontFamily={fontLoaded ? "Physis" : "System"}
              >
                {sign.symbol}
              </SvgText>
            </G>
          );
        })}

        {/* House numbers */}
        {houses &&
          Array.from({ length: 12 }, (_, i) => {
            // Calculate the cusp position for each house starting from the Ascendant
            // House 1 is at the Ascendant, then increment clockwise (after mirroring)
            const houseCuspLongitude = houses.ascendant + i * 30;

            // Use the same positioning logic as planets and zodiac signs
            const position = longitudeToPosition(
              houseCuspLongitude,
              HOUSES_RADIUS,
              ascendantSign
            );

            return (
              <SvgText
                key={i + 1}
                x={position.x}
                y={position.y + 5}
                fontSize="8"
                fill="#e6e6fa"
                textAnchor="middle"
                fontFamily="System"
              >
                {i + 1}
              </SvgText>
            );
          })}

        {/* Aspect lines */}
        {aspectLines.map((line, index) => (
          <Line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth="1"
            opacity={0.7}
          />
        ))}

        {/* Planets */}
        {testPlanetPositions.map((planet, index) => {
          const signColor = getZodiacSignColor(planet.sign);
          return (
            <G key={planet.name}>
              {/* Line marker from zodiac circle to planet (50% length) */}
              <Line
                x1={planet.x}
                y1={planet.y}
                x2={planet.x + (planet.labelX - planet.x) * 0.5}
                y2={planet.y + (planet.labelY - planet.y) * 0.5}
                stroke={signColor}
                strokeWidth="1"
                opacity={0.6}
              />
              {/* Planet symbol with Physis font */}
              <SvgText
                x={planet.labelX - 8}
                y={planet.labelY + 5}
                fontSize="14"
                fill={signColor}
                textAnchor="middle"
                fontFamily={fontLoaded ? "Physis" : "System"}
              >
                {planet.symbol}
              </SvgText>
              {/* Planet degree with system font */}
              <SvgText
                x={planet.labelX + 8}
                y={planet.labelY + 5}
                fontSize="12"
                fill={signColor}
                textAnchor="middle"
                fontFamily="System"
              >
                {Math.floor(planet.degree % 30)}
              </SvgText>
              {/* Retrograde indicator */}
              {planet.isRetrograde && (
                <SvgText
                  x={planet.labelX}
                  y={planet.labelY - 8}
                  fontSize="10"
                  fill="#FF6B6B"
                  textAnchor="middle"
                  fontFamily="System"
                  fontWeight="bold"
                >
                  R
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Ascendant */}
        {houses && (
          <G key="ascendant">
            {(() => {
              const ascendantPosition = longitudeToPosition(
                houses.ascendant,
                PLANETS_RADIUS,
                ascendantSign
              );
              const ascendantLabelPosition = longitudeToPosition(
                houses.ascendant,
                PLANET_LABELS_RADIUS,
                ascendantSign
              );
              const ascendantSignColor = getZodiacSignColor(
                houses.ascendantSign
              );

              return (
                <>
                  {/* Line marker from zodiac circle to ascendant (50% length) */}
                  <Line
                    x1={ascendantPosition.x}
                    y1={ascendantPosition.y}
                    x2={
                      ascendantPosition.x +
                      (ascendantLabelPosition.x - ascendantPosition.x) * 0.5
                    }
                    y2={
                      ascendantPosition.y +
                      (ascendantLabelPosition.y - ascendantPosition.y) * 0.5
                    }
                    stroke={ascendantSignColor}
                    strokeWidth="1"
                    opacity={0.6}
                  />
                  {/* Ascendant symbol with Physis font */}
                  <SvgText
                    x={ascendantLabelPosition.x - 8}
                    y={ascendantLabelPosition.y + 5}
                    fontSize="14"
                    fill={ascendantSignColor}
                    textAnchor="middle"
                    fontFamily={fontLoaded ? "Physis" : "System"}
                  >
                    !
                  </SvgText>
                  {/* Ascendant degree with system font */}
                  <SvgText
                    x={ascendantLabelPosition.x + 8}
                    y={ascendantLabelPosition.y + 5}
                    fontSize="12"
                    fill={ascendantSignColor}
                    textAnchor="middle"
                    fontFamily="System"
                  >
                    {Math.floor(houses.ascendant % 30)}
                  </SvgText>
                </>
              );
            })()}
          </G>
        )}
      </Svg>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e6e6fa" />
          <Text style={styles.loadingText}>Updating chart...</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  loadingText: {
    color: "#8a8a8a",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 15, 35, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  errorOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 107, 107, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: {
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
});
