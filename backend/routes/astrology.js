const express = require("express");
const router = express.Router();

// Swiss Ephemeris - use require to avoid TypeScript issues
const sweph = require("sweph");

// Backend cache for year-ephemeris data
// Key format: "year-latitude-longitude-sampleInterval"
// Year data never changes, so we cache it permanently (no expiration)
const yearEphemerisCache = new Map();
// Note: Year data is cached permanently since it never changes
// We only clean up old entries when cache size exceeds limit

// Swiss Ephemeris flags
const SEFLG_TOPOCTR = 0x00040000; // Topocentric position flag
const SEFLG_SPEED = 0x00000002; // Include speed in calculation

// Type definitions for reference (JavaScript comments)
/**
 * @typedef {Object} BirthData
 * @property {number} year
 * @property {number} month
 * @property {number} day
 * @property {number} [hour=12]
 * @property {number} [minute=0]
 * @property {number} [second=0]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [houseSystem='P']
 */

/**
 * @typedef {Object} PlanetPosition
 * @property {number} longitude
 * @property {number} latitude
 * @property {number} distance
 * @property {number} speed
 * @property {number} zodiacSign
 * @property {number} degree
 */

/**
 * @typedef {Object} HouseData
 * @property {number[]} cusps
 * @property {number} ascendant
 * @property {number} mc
 * @property {number} armc
 * @property {number} vertex
 * @property {number} equatorialAscendant
 * @property {number} coAscendant
 * @property {number} polarAscendant
 */

// Helper function to calculate Julian Day
function calculateJulianDay(
  year,
  month,
  day,
  hour = 12,
  minute = 0,
  second = 0
) {
  const decimalHour = hour + minute / 60 + second / 3600;
  return sweph.julday(
    Number(year),
    Number(month),
    Number(day),
    Number(decimalHour),
    1
  );
}

// Helper function to get zodiac sign from longitude
function getZodiacSign(longitude) {
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
  return signs[Math.floor(longitude / 30)];
}

// Helper function to format degree
function formatDegree(longitude) {
  const degree = longitude % 30;
  const minutes = (degree % 1) * 60;
  const seconds = (minutes % 1) * 60;
  return `${Math.floor(degree)}°${Math.floor(minutes)}'${Math.floor(seconds)}"`;
}

// Basic planetary position calculation
router.post("/planets", (req, res) => {
  console.log("🚀 PLANETS ENDPOINT HIT 🚀");
  try {
    const { year, month, day, hour = 12, minute = 0, second = 0 } = req.body;

    // Validate input
    if (!year || !month || !day) {
      return res.status(400).json({
        success: false,
        error: "Missing required date parameters: year, month, day",
      });
    }

    // Calculate Julian Day
    const julianDay = calculateJulianDay(
      year,
      month,
      day,
      hour,
      minute,
      second
    );

    // Note: For /planets endpoint, we don't have location data, so we'll use geocentric
    // If you want topocentric for this endpoint too, you'll need to add lat/lng parameters

    // Calculate planetary positions
    const planets = {};
    const planetIds = [
      { name: "sun", id: 0, symbol: "☉" },
      { name: "moon", id: 1, symbol: "☽" },
      { name: "mercury", id: 2, symbol: "☿" },
      { name: "venus", id: 3, symbol: "♀" },
      { name: "mars", id: 4, symbol: "♂" },
      { name: "jupiter", id: 5, symbol: "♃" },
      { name: "saturn", id: 6, symbol: "♄" },
      { name: "uranus", id: 7, symbol: "♅" },
      { name: "neptune", id: 8, symbol: "♆" },
      { name: "pluto", id: 9, symbol: "♇" },
    ];

    planetIds.forEach((planet) => {
      try {
        const result = sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);

        if (result.data && result.data.length >= 4) {
          const longitude = result.data[0];
          const speed = result.data[3];
          planets[planet.name] = {
            longitude,
            latitude: result.data[1],
            distance: result.data[2],
            speed,
            zodiacSign: Math.floor(longitude / 30),
            zodiacSignName: getZodiacSign(longitude),
            degree: longitude % 30,
            degreeFormatted: formatDegree(longitude),
            symbol: planet.symbol,
            isRetrograde: speed < 0,
          };
        } else {
          planets[planet.name] = { error: "Invalid result format" };
        }
      } catch (planetError) {
        console.error(`Error calculating ${planet.name}:`, planetError);
        planets[planet.name] = { error: planetError.message };
      }
    });

    res.json({
      success: true,
      data: {
        julianDay,
        inputDate: {
          year,
          month,
          day,
          hour: hour + minute / 60 + second / 3600,
        },
        planets,
      },
    });
  } catch (error) {
    console.error("Planetary calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate planetary positions",
      details: error.message,
    });
  }
});

// Calculate houses for a given location and time
router.post("/houses", (req, res) => {
  console.log("🚀 HOUSES ENDPOINT HIT 🚀");
  try {
    const {
      year,
      month,
      day,
      hour = 12,
      minute = 0,
      second = 0,
      latitude,
      longitude,
      houseSystem = "P", // Placidus
    } = req.body;

    // Validate input
    if (
      !year ||
      !month ||
      !day ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: year, month, day, latitude, longitude",
      });
    }

    const julianDay = calculateJulianDay(
      year,
      month,
      day,
      hour,
      minute,
      second
    );

    // Calculate houses
    const houses = sweph.houses(julianDay, latitude, longitude, houseSystem);

    // Log the parameters used for house calculations
    console.log("🌍 Calculating houses with:", {
      location: { latitude, longitude },
      dateTime: {
        year,
        month,
        day,
        hour,
        minute,
        second,
      },
      julianDay,
      houseSystem,
    });

    const houseData = {
      cusps: houses.houses,
      ascendant: houses.ascendant,
      ascendantSign: getZodiacSign(houses.ascendant),
      ascendantDegree: formatDegree(houses.ascendant),
      mc: houses.mc,
      mcSign: getZodiacSign(houses.mc),
      mcDegree: formatDegree(houses.mc),
      armc: houses.armc,
      vertex: houses.vertex,
      equatorialAscendant: houses.equatorialAscendant,
      coAscendant: houses.coAscendant,
      polarAscendant: houses.polarAscendant,
      houseSystem,
    };

    res.json({
      success: true,
      data: {
        julianDay,
        inputDate: {
          year,
          month,
          day,
          hour: hour + minute / 60 + second / 3600,
        },
        location: { latitude, longitude },
        houses: houseData,
      },
    });
  } catch (error) {
    console.error("House calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate houses",
      details: error.message,
    });
  }
});

// Get complete birth chart (planets + houses)
router.post("/chart", (req, res) => {
  console.log("🚀 CHART ENDPOINT HIT 🚀");
  try {
    const {
      year,
      month,
      day,
      hour = 12,
      minute = 0,
      second = 0,
      latitude,
      longitude,
      houseSystem = "P",
    } = req.body;

    // Validate input
    if (
      !year ||
      !month ||
      !day ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required parameters: year, month, day, latitude, longitude",
      });
    }

    const julianDay = calculateJulianDay(
      year,
      month,
      day,
      hour,
      minute,
      second
    );

    // Set topocentric location for more accurate calculations
    // IMPORTANT: This must be called before any calc_ut() calls to ensure
    // all planetary calculations use the correct location
    sweph.set_topo(longitude, latitude, 0); // 0 altitude for sea level

    // Log the final parameters that will be used for all calculations
    console.log(
      "🌍 Setting topocentric location and date for chart calculations:",
      {
        location: { latitude, longitude },
        dateTime: {
          year,
          month,
          day,
          hour,
          minute,
          second,
        },
        julianDay,
        houseSystem,
        note: "All Swiss Ephemeris calls will use this location and date",
      }
    );

    // Calculate planets
    const planets = {};
    const planetIds = [
      { name: "sun", id: 0, symbol: "☉" },
      { name: "moon", id: 1, symbol: "☽" },
      { name: "mercury", id: 2, symbol: "☿" },
      { name: "venus", id: 3, symbol: "♀" },
      { name: "mars", id: 4, symbol: "♂" },
      { name: "jupiter", id: 5, symbol: "♃" },
      { name: "saturn", id: 6, symbol: "♄" },
      { name: "uranus", id: 7, symbol: "♅" },
      { name: "neptune", id: 8, symbol: "♆" },
      { name: "pluto", id: 9, symbol: "♇" },
    ];

    planetIds.forEach((planet) => {
      try {
        const result = sweph.calc_ut(
          julianDay,
          planet.id,
          SEFLG_TOPOCTR | SEFLG_SPEED
        );

        if (result.data && result.data.length >= 4) {
          const longitude = result.data[0];
          const speed = result.data[3];
          planets[planet.name] = {
            longitude,
            latitude: result.data[1],
            distance: result.data[2],
            speed,
            zodiacSign: Math.floor(longitude / 30),
            zodiacSignName: getZodiacSign(longitude),
            degree: longitude % 30,
            degreeFormatted: formatDegree(longitude),
            symbol: planet.symbol,
            isRetrograde: speed < 0,
          };
        } else {
          planets[planet.name] = { error: "Invalid result format" };
        }
      } catch (planetError) {
        planets[planet.name] = { error: planetError.message };
      }
    });

    // Calculate houses with error handling
    let houses;
    let ascendantDegree, mcDegree, ascendantSign, mcSign;

    try {
      houses = sweph.houses(julianDay, latitude, longitude, houseSystem);

      // Check if we got valid data
      if (
        houses &&
        typeof houses.ascendant === "number" &&
        !isNaN(houses.ascendant)
      ) {
        ascendantDegree = houses.ascendant;
        mcDegree = houses.mc;
      } else {
        console.log("Invalid houses data, trying alternative calculation");
        // Try alternative calculation using points array
        if (houses && houses.data && houses.data.points) {
          ascendantDegree = houses.data.points[0];
          mcDegree = houses.data.points[1];
        } else {
          // Fallback to default values
          ascendantDegree = 0;
          mcDegree = 0;
        }
      }
    } catch (housesError) {
      console.error("Houses calculation failed:", housesError.message);
      // Set default values if calculation fails
      ascendantDegree = 0;
      mcDegree = 0;
      houses = {
        houses: [],
        ascendant: 0,
        mc: 0,
        armc: 0,
        vertex: 0,
        equatorialAscendant: 0,
        coAscendant: 0,
        polarAscendant: 0,
      };
    }

    ascendantSign = getZodiacSign(ascendantDegree);
    mcSign = getZodiacSign(mcDegree);

    const houseData = {
      cusps: houses.houses || [],
      ascendant: ascendantDegree,
      ascendantSign: ascendantSign,
      ascendantDegree: formatDegree(ascendantDegree),
      mc: mcDegree,
      mcSign: mcSign,
      mcDegree: formatDegree(mcDegree),
      armc: houses.armc || 0,
      vertex: houses.vertex || 0,
      equatorialAscendant: houses.equatorialAscendant || 0,
      coAscendant: houses.coAscendant || 0,
      polarAscendant: houses.polarAscendant || 0,
      houseSystem,
    };

    res.json({
      success: true,
      data: {
        julianDay,
        inputDate: {
          year,
          month,
          day,
          hour: hour + minute / 60 + second / 3600,
        },
        location: { latitude, longitude },
        planets,
        houses: houseData,
      },
    });
  } catch (error) {
    console.error("Chart calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate birth chart",
      details: error.message,
    });
  }
});

// Get current chart for current time and location, or custom date/time
router.post("/current-chart", (req, res) => {
  console.log("🚀 CURRENT CHART ENDPOINT HIT 🚀");
  try {
    const { latitude, longitude, year, month, day, hour, minute, second } =
      req.body;

    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: latitude, longitude",
      });
    }

    // Use custom date/time if provided, otherwise get current date and time in UTC
    let finalYear, finalMonth, finalDay, finalHour, finalMinute, finalSecond;

    // Log the raw request body first
    console.log("📊 Received request body:", {
      latitude,
      longitude,
      year,
      month,
      day,
      hour,
      minute,
      second,
    });

    if (year !== undefined && month !== undefined && day !== undefined) {
      // Use custom date/time
      finalYear = Number(year);
      finalMonth = Number(month);
      finalDay = Number(day);
      finalHour = hour !== undefined ? Number(hour) : 12;
      finalMinute = minute !== undefined ? Number(minute) : 0;
      finalSecond = second !== undefined ? Number(second) : 0;
      const calculatedJulianDay = calculateJulianDay(
        finalYear,
        finalMonth,
        finalDay,
        finalHour,
        finalMinute,
        finalSecond
      );
      console.log("📅 Using CUSTOM date/time:", {
        finalYear,
        finalMonth,
        finalDay,
        finalHour,
        finalMinute,
        finalSecond,
        decimalHour: finalHour + finalMinute / 60 + finalSecond / 3600,
        julianDay: calculatedJulianDay,
        note: "Frontend now sends UTC time for consistency",
        timezone: "UTC (converted from local time)",
      });
    } else {
      // Use current date and time in UTC
      const now = new Date();
      finalYear = now.getUTCFullYear();
      finalMonth = now.getUTCMonth() + 1; // JavaScript months are 0-based
      finalDay = now.getUTCDate();
      finalHour = now.getUTCHours();
      finalMinute = now.getUTCMinutes();
      finalSecond = now.getUTCSeconds();
      console.log("📅 Using CURRENT date/time:", {
        finalYear,
        finalMonth,
        finalDay,
        finalHour,
        finalMinute,
        finalSecond,
      });
    }

    const julianDay = calculateJulianDay(
      finalYear,
      finalMonth,
      finalDay,
      finalHour,
      finalMinute,
      finalSecond
    );

    // Set topocentric location for more accurate calculations
    // IMPORTANT: This must be called before any calc_ut() calls to ensure
    // all planetary calculations use the correct location
    sweph.set_topo(longitude, latitude, 0); // 0 altitude for sea level

    // Log the final parameters that will be used for all calculations
    console.log("🌍 Setting topocentric location and date for calculations:", {
      location: { latitude, longitude },
      dateTime: {
        year: finalYear,
        month: finalMonth,
        day: finalDay,
        hour: finalHour,
        minute: finalMinute,
        second: finalSecond,
      },
      julianDay,
      note: "All Swiss Ephemeris calls will use this location and date",
    });

    // Calculate all planets for current chart
    const planets = {};
    const planetIds = [
      { name: "sun", id: 0, symbol: "☉" },
      { name: "moon", id: 1, symbol: "☽" },
      { name: "mercury", id: 2, symbol: "☿" },
      { name: "venus", id: 3, symbol: "♀" },
      { name: "mars", id: 4, symbol: "♂" },
      { name: "jupiter", id: 5, symbol: "♃" },
      { name: "saturn", id: 6, symbol: "♄" },
      { name: "uranus", id: 7, symbol: "♅" },
      { name: "neptune", id: 8, symbol: "♆" },
      { name: "pluto", id: 9, symbol: "♇" },
      { name: "northNode", id: 11, symbol: "☊" }, // True Node
    ];

    planetIds.forEach((planet) => {
      try {
        const result = sweph.calc_ut(
          julianDay,
          planet.id,
          SEFLG_TOPOCTR | SEFLG_SPEED
        );

        if (result.data && result.data.length >= 4) {
          const longitude = result.data[0];
          const speed = result.data[3];
          planets[planet.name] = {
            longitude,
            latitude: result.data[1],
            distance: result.data[2],
            speed,
            zodiacSign: Math.floor(longitude / 30),
            zodiacSignName: getZodiacSign(longitude),
            degree: longitude % 30,
            degreeFormatted: formatDegree(longitude),
            symbol: planet.symbol,
            isRetrograde: speed < 0,
          };
        } else {
          planets[planet.name] = { error: "Invalid result format" };
        }
      } catch (planetError) {
        console.error(`Error calculating ${planet.name}:`, planetError);
        planets[planet.name] = { error: planetError.message };
      }
    });

    // Calculate ascendant and midheaven using houses function
    let ascendantDegree, mcDegree, ascendantSign, mcSign;

    try {
      // Use houses function with whole sign houses ('W')
      const houses = sweph.houses(julianDay, latitude, longitude, "W");
      console.log("🏠 Whole Sign Houses calculation:", {
        julianDay,
        latitude,
        longitude,
        houseSystem: "W (Whole Sign)",
        housesResult: houses,
        ascendantRaw: houses.data?.points?.[0],
        mcRaw: houses.data?.points?.[1],
        ascendantDegrees: houses.data?.points?.[0],
        ascendantSign: getZodiacSign(houses.data?.points?.[0] || 0),
      });

      // Extract ascendant and MC from points array
      // points[0] = Ascendant, points[1] = MC
      ascendantDegree = houses.data.points[0];
      mcDegree = houses.data.points[1];
    } catch (housesError) {
      console.log("houses function failed:", housesError.message);
      // Set default values if it fails
      ascendantDegree = 0;
      mcDegree = 0;
    }

    ascendantSign = getZodiacSign(ascendantDegree);
    mcSign = getZodiacSign(mcDegree);

    // For whole sign houses, each house corresponds to a complete zodiac sign
    // House 1 starts at 0° of the ascendant's sign, House 2 at 0° of the next sign, etc.
    const ascendantSignNumber = Math.floor(ascendantDegree / 30);
    const wholeSignCusps = Array.from(
      { length: 13 }, // 12 houses + 1 for the next house
      (_, i) => ((ascendantSignNumber + i) * 30) % 360
    );

    const houseData = {
      ascendant: ascendantDegree,
      ascendantSign: ascendantSign,
      ascendantDegree: formatDegree(ascendantDegree),
      mc: mcDegree,
      mcSign: mcSign,
      mcDegree: formatDegree(mcDegree),
      houseSystem: "W", // Whole sign houses
      cusps: wholeSignCusps,
    };

    res.json({
      success: true,
      data: {
        julianDay,
        currentTime: {
          year: finalYear,
          month: finalMonth,
          day: finalDay,
          hour: finalHour + finalMinute / 60 + finalSecond / 3600,
          timestamp: new Date(
            finalYear,
            finalMonth - 1,
            finalDay,
            finalHour,
            finalMinute,
            finalSecond
          ).toISOString(),
        },
        location: { latitude, longitude },
        planets,
        houses: houseData,
      },
    });
  } catch (error) {
    console.error("Current chart calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate current chart",
      details: error.message,
    });
  }
});

// Get ephemeris info and status
router.get("/ephemeris-info", (req, res) => {
  try {
    const testJD = sweph.julday(2023, 6, 15, 12.0, 1);
    const testCalc = sweph.calc_ut(testJD, 0, 0); // Sun=0, no flags

    res.json({
      success: true,
      data: {
        status: "working",
        ephemerisType: "Built-in Moshier calculations",
        note: "Using built-in calculations (no data files required)",
        testCalculation: {
          date: "2023-06-15 12:00",
          sunLongitude: testCalc.data ? testCalc.data[0] : testCalc.longitude,
          fullResult: testCalc,
        },
        planetConstants: {
          sun: 0,
          moon: 1,
          mercury: 2,
          venus: 3,
          mars: 4,
          jupiter: 5,
          saturn: 6,
          uranus: 7,
          neptune: 8,
          pluto: 9,
        },
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      note: "Error with Swiss Ephemeris calculations",
    });
  }
});

// Helper function to map planet ID to name (accounting for moon at ID 1)
function getPlanetNameFromId(planetId) {
  const planetIdToName = {
    0: "sun",
    1: "moon",
    2: "mercury",
    3: "venus",
    4: "mars",
    5: "jupiter",
    6: "saturn",
    7: "uranus",
    8: "neptune",
    9: "pluto",
  };
  return planetIdToName[planetId] || `planet${planetId}`;
}

// Helper function to find exact ingress time using binary search
function findExactIngressTime(
  planetId,
  targetSign,
  prevJD,
  currentJD,
  prevLongitude,
  currentLongitude,
  maxIterations = 30, // Increased for higher precision
  toleranceDays = 0.01 / (24 * 60 * 60) // 0.01 second tolerance for maximum precision
) {
  const targetBoundary = targetSign * 30;
  let low = prevJD;
  let high = currentJD;
  let bestJD = currentJD;
  let iterations = 0;

  const planetName = getPlanetNameFromId(planetId);
  const prevDate = julianDayToDate(prevJD);
  const currentDate = julianDayToDate(currentJD);
  const timeDiffHours = ((currentJD - prevJD) * 24).toFixed(2);

  // Normalize longitude for wrap-around
  const normalizeLongitude = (lon) => {
    if (prevLongitude > 330 && currentLongitude < 30 && targetSign === 0) {
      return lon < targetBoundary ? lon + 360 : lon;
    }
    return lon;
  };

  const normPrev = normalizeLongitude(prevLongitude);
  const normCurrent = normalizeLongitude(currentLongitude);

  console.log(
    `🔍 [INGRESS REFINEMENT] ${planetName} entering sign ${targetSign} (boundary ${targetBoundary}°)`
  );
  console.log(
    `   Sample window: ${prevDate.toISOString()} to ${currentDate.toISOString()} (${timeDiffHours}h)`
  );
  console.log(
    `   Longitudes: ${prevLongitude.toFixed(6)}° → ${currentLongitude.toFixed(
      6
    )}° (normalized: ${normPrev.toFixed(6)}° → ${normCurrent.toFixed(6)}°)`
  );

  while (high - low > toleranceDays && iterations < maxIterations) {
    iterations++;
    const midJD = (low + high) / 2;

    try {
      const result = sweph.calc_ut(
        midJD,
        planetId,
        SEFLG_TOPOCTR | SEFLG_SPEED
      );
      if (result.data && result.data.length >= 1) {
        const midLongitude = normalizeLongitude(result.data[0]);
        const prevBeforeBoundary = normPrev < targetBoundary;
        const midBeforeBoundary = midLongitude < targetBoundary;

        if (prevBeforeBoundary !== midBeforeBoundary) {
          high = midJD;
          bestJD = midJD;
        } else {
          low = midJD;
        }
      } else {
        console.log(
          `   ⚠️ [ITERATION ${iterations}] calc_ut returned invalid data, breaking`
        );
        break;
      }
    } catch (error) {
      console.log(
        `   ❌ [ITERATION ${iterations}] Error in calc_ut: ${error.message}, breaking`
      );
      break;
    }
  }

  const exactDate = julianDayToDate(bestJD);
  const sampleDate = julianDayToDate(currentJD);
  const refined = bestJD !== currentJD;
  const timeDiffSeconds = Math.abs((bestJD - currentJD) * 24 * 60 * 60);
  const timeDiffMinutes = timeDiffSeconds / 60;

  if (refined) {
    console.log(
      `   ✅ [REFINED] Exact time: ${exactDate.toISOString()} (${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(
        1
      )} min from sample, ${iterations} iterations, precision: ±0.01s)`
    );
  } else {
    console.log(
      `   ⚠️ [NO REFINEMENT] Using sample time: ${sampleDate.toISOString()} (${iterations} iterations, diff: ${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(1)} min)`
    );
  }

  return bestJD;
}

// Helper function to find exact station time using binary search
function findExactStationTime(
  planetId,
  prevJD,
  currentJD,
  prevSpeed,
  currentSpeed,
  maxIterations = 30, // Increased for higher precision
  toleranceDays = 0.01 / (24 * 60 * 60) // 0.01 second tolerance for maximum precision
) {
  let low = prevJD;
  let high = currentJD;
  let lowSpeed = prevSpeed; // Track speed at low bound
  let highSpeed = currentSpeed; // Track speed at high bound
  let bestJD = prevJD;
  let bestSpeedDiff = Math.abs(prevSpeed); // Track smallest speed magnitude found
  let iterations = 0;

  const planetName = getPlanetNameFromId(planetId);
  const prevDate = julianDayToDate(prevJD);
  const currentDate = julianDayToDate(currentJD);
  const timeDiffHours = ((currentJD - prevJD) * 24).toFixed(2);
  const stationType =
    prevSpeed > 0 && currentSpeed < 0 ? "retrograde" : "direct";

  console.log(`🔍 [STATION REFINEMENT] ${planetName} ${stationType} station`);
  console.log(
    `   Sample window: ${prevDate.toISOString()} to ${currentDate.toISOString()} (${timeDiffHours}h)`
  );
  console.log(
    `   Speeds: ${prevSpeed.toFixed(6)}°/day → ${currentSpeed.toFixed(
      6
    )}°/day (signs: ${Math.sign(prevSpeed)} → ${Math.sign(currentSpeed)})`
  );

  while (high - low > toleranceDays && iterations < maxIterations) {
    iterations++;
    const midJD = (low + high) / 2;

    try {
      const result = sweph.calc_ut(
        midJD,
        planetId,
        SEFLG_TOPOCTR | SEFLG_SPEED
      );
      if (result.data && result.data.length >= 4) {
        const midSpeed = result.data[3];
        const lowSign = Math.sign(lowSpeed);
        const midSign = Math.sign(midSpeed);
        const highSign = Math.sign(highSpeed);

        // Update best match if this is closer to zero
        if (Math.abs(midSpeed) < bestSpeedDiff) {
          bestSpeedDiff = Math.abs(midSpeed);
          bestJD = midJD;
        }

        // Log progress every 3 iterations
        if (iterations <= 3 || iterations % 3 === 0) {
          const lowDate = julianDayToDate(low);
          const highDate = julianDayToDate(high);
          const windowHours = ((high - low) * 24).toFixed(2);
          console.log(
            `   [ITER ${iterations}] mid=${julianDayToDate(
              midJD
            ).toISOString()}, speed=${midSpeed.toFixed(
              6
            )}°/day, signs=${lowSign}→${midSign}→${highSign}, window=${windowHours}h (${lowDate.toISOString()} → ${highDate.toISOString()})`
          );
          if (bestJD !== prevJD && bestJD !== currentJD) {
            console.log(
              `      → Best so far: ${julianDayToDate(
                bestJD
              ).toISOString()} (speed=${bestSpeedDiff.toFixed(6)}°/day)`
            );
          }
        }

        // Binary search: zero crossing is where sign changes
        // We know lowSpeed and highSpeed have opposite signs (that's how we detected the station)
        if (lowSign !== midSign) {
          // Zero crossing is between low and mid
          high = midJD;
          highSpeed = midSpeed;
          if (iterations <= 3) {
            console.log(
              `      → Zero crossing between low and mid, updating high`
            );
          }
        } else {
          // Zero crossing is between mid and high (lowSign === midSign, but midSign !== highSign)
          low = midJD;
          lowSpeed = midSpeed;
          if (iterations <= 3) {
            console.log(
              `      → Zero crossing between mid and high, updating low`
            );
          }
        }
      } else {
        console.log(
          `   ⚠️ [ITERATION ${iterations}] calc_ut returned invalid data (length: ${result.data?.length}), breaking`
        );
        break;
      }
    } catch (error) {
      console.log(
        `   ❌ [ITERATION ${iterations}] Error in calc_ut: ${error.message}, breaking`
      );
      break;
    }
  }

  const exactDate = julianDayToDate(bestJD);
  const sampleDate = julianDayToDate(currentJD);
  const refined = bestJD !== currentJD;
  const timeDiffSeconds = Math.abs((bestJD - currentJD) * 24 * 60 * 60);
  const timeDiffMinutes = timeDiffSeconds / 60;

  if (refined) {
    console.log(
      `   ✅ [REFINED] Exact time: ${exactDate.toISOString()} (${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(
        1
      )} min from sample, ${iterations} iterations, precision: ±0.01s)`
    );
  } else {
    console.log(
      `   ⚠️ [NO REFINEMENT] Using sample time: ${sampleDate.toISOString()} (${iterations} iterations, diff: ${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(1)} min)`
    );
  }

  return bestJD;
}

// Helper function to find exact aspect time using binary search
function findExactAspectTime(
  planet1Id,
  planet2Id,
  targetAngle,
  prevJD,
  currentJD,
  prevAngle,
  currentAngle,
  maxIterations = 30, // Increased for higher precision
  toleranceDays = 0.01 / (24 * 60 * 60) // 0.01 second tolerance for maximum precision
) {
  const planet1Name = getPlanetNameFromId(planet1Id);
  const planet2Name = getPlanetNameFromId(planet2Id);
  const prevDate = julianDayToDate(prevJD);
  const currentDate = julianDayToDate(currentJD);
  const timeDiffHours = ((currentJD - prevJD) * 24).toFixed(2);

  const aspectNames = {
    0: "conjunct",
    60: "sextile",
    90: "square",
    120: "trine",
    180: "opposition",
  };
  const aspectName = aspectNames[targetAngle] || `${targetAngle}°`;

  // Calculate how far the angle is from the target (0 = exact match)
  const getDistanceFromTarget = (angle) => {
    const diff = Math.abs(angle - targetAngle);
    return Math.min(diff, 360 - diff);
  };

  const prevDistance = getDistanceFromTarget(prevAngle);
  const currentDistance = getDistanceFromTarget(currentAngle);

  console.log(
    `🔍 [ASPECT REFINEMENT] ${planet1Name} ${aspectName} ${planet2Name}`
  );
  console.log(
    `   Sample window: ${prevDate.toISOString()} to ${currentDate.toISOString()} (${timeDiffHours}h)`
  );
  console.log(
    `   Angles: ${prevAngle.toFixed(2)}° → ${currentAngle.toFixed(
      2
    )}° (target: ${targetAngle}°)`
  );
  console.log(
    `   Distances from target: ${prevDistance.toFixed(
      4
    )}° → ${currentDistance.toFixed(4)}°`
  );

  // If we're not crossing the exact angle, return the sample that's closer
  // (This shouldn't happen if detection is working correctly, but safety check)
  if (prevDistance > 1 && currentDistance > 1) {
    console.log(
      `   ⚠️ [NO REFINEMENT] Both distances > 1°, using closer sample`
    );
    return prevDistance < currentDistance ? prevJD : currentJD;
  }

  let low = prevJD;
  let high = currentJD;
  let bestJD = currentJD;
  let bestDistance = currentDistance;
  let iterations = 0;

  // Log initial state
  if (iterations === 0) {
    console.log(
      `   Initial: prevDist=${prevDistance.toFixed(
        4
      )}°, currentDist=${currentDistance.toFixed(4)}°`
    );
  }

  while (high - low > toleranceDays && iterations < maxIterations) {
    iterations++;
    const midJD = (low + high) / 2;
    const midDate = julianDayToDate(midJD);

    try {
      const result1 = sweph.calc_ut(
        midJD,
        planet1Id,
        SEFLG_TOPOCTR | SEFLG_SPEED
      );
      const result2 = sweph.calc_ut(
        midJD,
        planet2Id,
        SEFLG_TOPOCTR | SEFLG_SPEED
      );

      if (
        result1.data &&
        result1.data.length >= 1 &&
        result2.data &&
        result2.data.length >= 1
      ) {
        const lon1 = result1.data[0];
        const lon2 = result2.data[0];
        const diff = Math.abs(lon1 - lon2);
        const midAngle = Math.min(diff, 360 - diff);
        const midDistance = getDistanceFromTarget(midAngle);

        // Log every 3rd iteration for debugging
        if (iterations <= 3 || iterations % 3 === 0) {
          const lowDate = julianDayToDate(low);
          const highDate = julianDayToDate(high);
          const windowHours = ((high - low) * 24).toFixed(2);
          console.log(
            `   [ITER ${iterations}] mid=${midDate.toISOString()}, angle=${midAngle.toFixed(
              2
            )}°, dist=${midDistance.toFixed(
              4
            )}°, window=${windowHours}h (${lowDate.toISOString()} → ${highDate.toISOString()})`
          );
        }

        // Update best match
        if (midDistance < bestDistance) {
          bestDistance = midDistance;
          bestJD = midJD;
          if (iterations <= 3) {
            console.log(`      → New best! dist=${bestDistance.toFixed(4)}°`);
          }
        }

        // If we're very close to exact, we can stop early
        if (midDistance < 0.01) {
          console.log(
            `   ✅ Found exact match (${midDistance.toFixed(
              4
            )}°) at iteration ${iterations}`
          );
          return midJD;
        }

        // Binary search: determine which half contains the exact moment
        // The exact moment is where distance is minimized
        // If mid is closer than both prev and current, we're at the right spot
        // Otherwise, search in the direction that's getting closer
        if (midDistance < prevDistance && midDistance < currentDistance) {
          // We're at a local minimum, this is likely the exact moment
          // But continue to refine
          if (prevDistance < currentDistance) {
            high = midJD;
          } else {
            low = midJD;
          }
        } else if (prevDistance > currentDistance) {
          // Getting closer from prev to current, exact is between mid and current
          low = midJD;
        } else {
          // Getting closer from current to prev, exact is between prev and mid
          high = midJD;
        }
      } else {
        console.log(
          `   ⚠️ [ITERATION ${iterations}] calc_ut returned invalid data, breaking`
        );
        break;
      }
    } catch (error) {
      console.log(
        `   ❌ [ITERATION ${iterations}] Error in calc_ut: ${error.message}, breaking`
      );
      break;
    }
  }

  const exactDate = julianDayToDate(bestJD);
  const sampleDate = julianDayToDate(currentJD);
  const refined = bestJD !== currentJD;
  const timeDiffSeconds = Math.abs((bestJD - currentJD) * 24 * 60 * 60);
  const timeDiffMinutes = timeDiffSeconds / 60;
  const finalWindowHours = ((high - low) * 24).toFixed(2);

  if (refined) {
    console.log(
      `   ✅ [REFINED] Exact time: ${exactDate.toISOString()} (${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(
        1
      )} min from sample, ${iterations} iterations, bestDist=${bestDistance.toFixed(
        4
      )}°, precision: ±0.01s)`
    );
  } else {
    console.log(
      `   ⚠️ [NO REFINEMENT] Using sample time: ${sampleDate.toISOString()} (${iterations} iterations, diff: ${timeDiffSeconds.toFixed(
        3
      )} sec / ${timeDiffMinutes.toFixed(
        1
      )} min, bestDist=${bestDistance.toFixed(
        4
      )}°, finalWindow=${finalWindowHours}h, prevDist=${prevDistance.toFixed(
        4
      )}°, currDist=${currentDistance.toFixed(4)}°)`
    );
    if (bestJD === currentJD && bestDistance === currentDistance) {
      console.log(
        `      💡 Reason: bestJD is sample time, bestDistance matches currentDistance - aspect may not cross exact angle in window`
      );
    }
  }

  return bestJD;
}

// Helper function to convert Julian Day to Date
// Swiss Ephemeris Julian Days are in UT (Universal Time)
// JD 2440587.5 = January 1, 1970 00:00:00 UTC
function julianDayToDate(jd) {
  // Direct calculation: more reliable than using revjul
  // Julian Day is a continuous count of days since January 1, 4713 BC 12:00 UTC
  // JavaScript Date uses milliseconds since January 1, 1970 00:00:00 UTC
  //
  // Important: JD 0.0 = January 1, 4713 BC 12:00:00 UTC (noon)
  // JD 2440587.5 = January 1, 1970 00:00:00 UTC (midnight)
  // So we subtract 2440587.5 to get days since epoch, then convert to milliseconds
  const jdOffset = 2440587.5; // JD for 1970-01-01 00:00:00 UTC
  const msPerDay = 86400000; // milliseconds in a day (24 * 60 * 60 * 1000)
  const msSinceEpoch = (jd - jdOffset) * msPerDay;
  const date = new Date(msSinceEpoch);

  // Ensure we return a valid date
  if (isNaN(date.getTime())) {
    console.error(`Invalid date conversion for JD ${jd}`);
    // Fallback: try using sweph.revjul as backup
    try {
      const result = sweph.revjul(jd, 1);
      if (result && result.year && result.month && result.day !== undefined) {
        const decimalDay = result.day;
        const day = Math.floor(decimalDay); // Integer part is the day
        const fractionalDay = decimalDay - day; // Fractional part is time of day (0-1)
        const totalSeconds = Math.round(fractionalDay * 86400);
        const hour = Math.floor(totalSeconds / 3600);
        const minute = Math.floor((totalSeconds % 3600) / 60);
        const second = totalSeconds % 60;
        return new Date(
          Date.UTC(result.year, result.month - 1, day, hour, minute, second)
        );
      }
    } catch (e) {
      console.error(`Fallback conversion also failed: ${e}`);
    }
  }

  return date;
}

// Get year-long ephemeris data for detecting ingresses and stations
router.post("/year-ephemeris", (req, res) => {
  console.log("🚀 YEAR EPHEMERIS ENDPOINT HIT 🚀");
  try {
    const {
      year,
      latitude = 40.7128, // Default to New York
      longitude = -74.006,
      sampleInterval = 12, // Hours between samples (default: 12 hours for better detection)
    } = req.body;

    if (!year) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: year",
      });
    }

    // Check cache first
    // Year data never changes, so we cache it permanently
    const cacheKey = `${year}-${latitude}-${longitude}-${sampleInterval}`;
    const cachedData = yearEphemerisCache.get(cacheKey);

    if (cachedData) {
      console.log(
        `📦 Using cached year-ephemeris data for ${year} (${cacheKey})`
      );
      return res.json({
        success: true,
        data: cachedData.data,
        cached: true,
      });
    }

    console.log(
      `🌐 Calculating year-ephemeris data for ${year} (cache miss or expired for ${cacheKey})`
    );

    // Set topocentric location
    // IMPORTANT: This must be called before any calc_ut() calls to ensure
    // all planetary calculations use the correct location
    sweph.set_topo(longitude, latitude, 0);

    // Log the location that will be used for all calculations
    console.log(
      "🌍 Setting topocentric location for year-ephemeris calculations:",
      {
        location: { latitude, longitude },
        year,
        sampleInterval,
        note: "All Swiss Ephemeris calc_ut() calls will use this location with their respective dates",
      }
    );

    // Planet IDs to track (including Sun for ingresses, excluding Moon, including North Node)
    const planetIds = [
      { name: "sun", id: 0, symbol: "☉" },
      { name: "mercury", id: 2, symbol: "☿" },
      { name: "venus", id: 3, symbol: "♀" },
      { name: "mars", id: 4, symbol: "♂" },
      { name: "jupiter", id: 5, symbol: "♃" },
      { name: "saturn", id: 6, symbol: "♄" },
      { name: "uranus", id: 7, symbol: "♅" },
      { name: "neptune", id: 8, symbol: "♆" },
      { name: "pluto", id: 9, symbol: "♇" },
      { name: "northNode", id: 11, symbol: "☊" }, // True Node (North Node)
    ];

    // Sample data points throughout the year
    // Use Date.UTC to ensure we're working in UTC, not local time
    const startDate = new Date(Date.UTC(year, 0, 1, 12, 0, 0)); // Jan 1, noon UTC
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59)); // Dec 31, end of day UTC
    const samples = [];

    // Generate samples
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const julianDay = calculateJulianDay(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth() + 1,
        currentDate.getUTCDate(),
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        currentDate.getUTCSeconds()
      );

      const sample = {
        julianDay,
        timestamp: currentDate.toISOString(),
        planets: {},
      };

      // Calculate planetary positions
      planetIds.forEach((planet) => {
        try {
          const result = sweph.calc_ut(
            julianDay,
            planet.id,
            SEFLG_TOPOCTR | SEFLG_SPEED
          );

          if (result.data && result.data.length >= 1) {
            const longitude = result.data[0];
            let speed = result.data[3] || 0; // Try to get speed from result

            // If speed is 0 or missing, calculate it from previous sample's longitude
            // This is necessary because SEFLG_SPEED with topocentric coordinates sometimes returns 0
            if (speed === 0 && samples.length > 0) {
              const prevSample = samples[samples.length - 1];
              const prevPlanet = prevSample.planets[planet.name];
              if (prevPlanet && prevPlanet.longitude !== undefined) {
                // Calculate time difference in days
                const timeDiffDays = julianDay - prevSample.julianDay;
                if (timeDiffDays > 0) {
                  // Calculate longitude difference, handling wrap-around (0-360 degrees)
                  let longitudeDiff = longitude - prevPlanet.longitude;
                  // Normalize to -180 to 180 range
                  if (longitudeDiff > 180) longitudeDiff -= 360;
                  if (longitudeDiff < -180) longitudeDiff += 360;
                  // Speed = change in longitude / change in time (degrees per day)
                  speed = longitudeDiff / timeDiffDays;
                }
              }
            }

            // Debug: Log first few mercury calculations to check speed
            if (planet.name === "mercury" && samples.length < 3) {
              console.log(
                `Mercury calc - JD: ${julianDay}, result.data length: ${
                  result.data.length
                }, speed: ${speed.toFixed(6)}, longitude: ${longitude.toFixed(
                  6
                )}`
              );
            }

            sample.planets[planet.name] = {
              longitude,
              speed,
              zodiacSign: Math.floor(longitude / 30),
              zodiacSignName: getZodiacSign(longitude),
              degree: longitude % 30,
              degreeFormatted: formatDegree(longitude),
              isRetrograde: speed < 0,
            };
          } else {
            // Debug: Log if result structure is unexpected
            if (planet.name === "mercury" && samples.length < 3) {
              console.log(
                `Mercury calc - Unexpected result structure:`,
                result
              );
            }
          }
        } catch (planetError) {
          console.error(`Error calculating ${planet.name}:`, planetError);
        }
      });

      samples.push(sample);

      // Move to next sample time
      currentDate.setUTCHours(currentDate.getUTCHours() + sampleInterval);
    }

    // Detect events and refine timestamps immediately
    const events = [];
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

    // Track planet states for ingress and station detection
    const planetStates = {};
    planetIds.forEach((planet) => {
      planetStates[planet.name] = {
        zodiacSign: -1,
        speed: null,
        longitude: null,
        previousSampleIndex: null,
      };
    });

    // Debug: Track station detection attempts
    const stationChecks = {};
    planetIds.forEach((planet) => {
      if (!["sun", "moon", "northNode"].includes(planet.name)) {
        stationChecks[planet.name] = { checked: 0, found: 0 };
      }
    });

    // Track aspect states
    const aspectStates = {};
    // Track last event time for each aspect to prevent duplicates
    const aspectLastEventTime = {}; // Key: aspectKey, Value: last event JD
    const aspectTypes = [
      { name: "conjunct", angle: 0 },
      { name: "sextile", angle: 60 },
      { name: "square", angle: 90 },
      { name: "trine", angle: 120 },
      { name: "opposition", angle: 180 },
    ];

    // Process samples to detect events
    console.log(`Processing ${samples.length} samples for event detection`);
    console.log(`Tracking stations for planets:`, Object.keys(stationChecks));

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];

      // Check for ingresses and stations
      planetIds.forEach((planet) => {
        const planetData = sample.planets[planet.name];
        if (!planetData) return;

        const prevState = planetStates[planet.name];
        const currentZodiacSign = planetData.zodiacSign;
        const currentLongitude = planetData.longitude;
        const currentSpeed = planetData.speed;

        // Validate speed is a number
        if (
          currentSpeed === undefined ||
          currentSpeed === null ||
          isNaN(currentSpeed)
        ) {
          console.warn(
            `Invalid speed for ${planet.name} at sample ${i}:`,
            currentSpeed
          );
          // Update state anyway to continue processing
          planetStates[planet.name] = {
            zodiacSign: currentZodiacSign,
            speed: prevState.speed, // Keep previous speed if current is invalid
            longitude: currentLongitude,
            previousSampleIndex: i,
          };
          return; // Skip this planet for this sample
        }

        // Log first few speed values for retrograde planets to verify they're being calculated
        if (i < 5 && ["mercury", "venus", "mars"].includes(planet.name)) {
          console.log(
            `[${i}] ${planet.name} speed: ${currentSpeed.toFixed(
              6
            )} deg/day, longitude: ${currentLongitude.toFixed(2)}°`
          );
        }

        // Detect ingress
        if (
          prevState.zodiacSign !== -1 &&
          prevState.zodiacSign !== currentZodiacSign
        ) {
          if (prevState.previousSampleIndex !== null) {
            const prevSample = samples[prevState.previousSampleIndex];
            const sampleDateStr = julianDayToDate(
              sample.julianDay
            ).toISOString();

            const exactJD = findExactIngressTime(
              planet.id,
              currentZodiacSign,
              prevSample.julianDay,
              sample.julianDay,
              prevState.longitude,
              currentLongitude
            );
            const exactDate = julianDayToDate(exactJD);
            const exactDateStr = exactDate.toISOString();
            const timeDiff = Math.abs((exactJD - sample.julianDay) * 24 * 60); // minutes

            if (timeDiff > 1) {
              console.log(
                `   📊 [EVENT CREATED] ${planet.name} ingress: ${
                  signs[prevState.zodiacSign]
                } → ${signs[currentZodiacSign]}`
              );
              console.log(`      Sample time: ${sampleDateStr}`);
              console.log(`      Exact time:  ${exactDateStr}`);
              console.log(`      Difference:  ${timeDiff.toFixed(1)} minutes`);
            }

            events.push({
              type: "ingress",
              planet: planet.name,
              fromSign: signs[prevState.zodiacSign],
              toSign: signs[currentZodiacSign],
              utcDateTime: exactDateStr,
              degree: planetData.degree,
              degreeFormatted: planetData.degreeFormatted,
              isRetrograde: currentSpeed < 0,
            });
          } else {
            console.log(
              `   ⚠️ [MISSING PREV SAMPLE] Cannot refine ${planet.name} ingress: previousSampleIndex is null`
            );
          }
        }

        // Detect station (speed crosses zero)
        // Only check planets that can go retrograde (not sun, moon, or northNode)
        const canRetrograde = !["sun", "moon", "northNode"].includes(
          planet.name
        );

        if (canRetrograde && prevState.speed !== null && i > 0) {
          // Track that we're checking this planet
          if (stationChecks[planet.name]) {
            stationChecks[planet.name].checked++;
          }

          const prevSpeedSign = Math.sign(prevState.speed);
          const currentSpeedSign = Math.sign(currentSpeed);

          // Debug: Log speed values for retrograde planets occasionally
          if (
            i % 100 === 0 &&
            ["mercury", "venus", "mars"].includes(planet.name)
          ) {
            console.log(
              `Speed check [${i}]: ${
                planet.name
              } prevSpeed=${prevState.speed.toFixed(
                6
              )}, currentSpeed=${currentSpeed.toFixed(
                6
              )}, prevSign=${prevSpeedSign}, currentSign=${currentSpeedSign}`
            );
          }

          // Log when speed signs are different (potential station)
          if (
            prevSpeedSign !== 0 &&
            currentSpeedSign !== 0 &&
            prevSpeedSign !== currentSpeedSign
          ) {
            console.log(
              `⚠️ Potential station [${i}]: ${
                planet.name
              } speed sign changed from ${prevSpeedSign} to ${currentSpeedSign} (prevSpeed=${prevState.speed.toFixed(
                6
              )}, currentSpeed=${currentSpeed.toFixed(6)})`
            );
          }

          // Check if speed crossed zero (sign changed)
          // Relaxed threshold - we want to catch stations even if speeds are small
          // A station occurs when speed changes sign (crosses zero)
          const SPEED_THRESHOLD = 0.00001; // degrees per day - very small threshold
          const speedCrossedZero =
            // Both speeds must be non-zero (have a sign)
            prevSpeedSign !== 0 &&
            currentSpeedSign !== 0 &&
            // Signs must be different (crossed zero)
            prevSpeedSign !== currentSpeedSign &&
            // At least one speed should be above threshold to avoid noise
            (Math.abs(prevState.speed) > SPEED_THRESHOLD ||
              Math.abs(currentSpeed) > SPEED_THRESHOLD);

          if (speedCrossedZero) {
            if (stationChecks[planet.name]) {
              stationChecks[planet.name].found++;
            }
            const prevSample = samples[i - 1];
            if (
              prevSample &&
              prevSample.planets &&
              prevSample.planets[planet.name]
            ) {
              const sampleDateStr = julianDayToDate(
                sample.julianDay
              ).toISOString();

              const exactJD = findExactStationTime(
                planet.id,
                prevSample.julianDay,
                sample.julianDay,
                prevState.speed,
                currentSpeed
              );
              const exactDate = julianDayToDate(exactJD);
              const exactDateStr = exactDate.toISOString();
              const timeDiff = Math.abs((exactJD - sample.julianDay) * 24 * 60); // minutes

              const stationType =
                prevState.speed > 0 && currentSpeed < 0
                  ? "retrograde"
                  : "direct";

              if (timeDiff > 1) {
                console.log(
                  `   📊 [EVENT CREATED] ${planet.name} ${stationType} station`
                );
                console.log(`      Sample time: ${sampleDateStr}`);
                console.log(`      Exact time:  ${exactDateStr}`);
                console.log(
                  `      Difference:  ${timeDiff.toFixed(1)} minutes`
                );
              }

              console.log(
                `✅ Station detected: ${planet.name} ${stationType} at ${exactDateStr}`,
                {
                  prevSpeed: prevState.speed,
                  currentSpeed: currentSpeed,
                  prevSpeedSign,
                  currentSpeedSign,
                  degree: planetData.degreeFormatted,
                  sign: planetData.zodiacSignName,
                  sampleIndex: i,
                  timeDiffMinutes: timeDiff.toFixed(1),
                }
              );

              events.push({
                type: "station",
                planet: planet.name,
                stationType,
                utcDateTime: exactDateStr,
                degree: planetData.degree,
                degreeFormatted: planetData.degreeFormatted,
                zodiacSignName: planetData.zodiacSignName,
              });
            }
          }
        }

        // Update planet state
        planetStates[planet.name] = {
          zodiacSign: currentZodiacSign,
          speed: currentSpeed,
          longitude: currentLongitude,
          previousSampleIndex: i,
        };
      });

      // Detect aspects
      const getAngularDistance = (lon1, lon2) => {
        const diff = Math.abs(lon1 - lon2);
        return Math.min(diff, 360 - diff);
      };

      for (let i1 = 0; i1 < planetIds.length; i1++) {
        for (let i2 = i1 + 1; i2 < planetIds.length; i2++) {
          const planet1 = planetIds[i1];
          const planet2 = planetIds[i2];
          const planet1Data = sample.planets[planet1.name];
          const planet2Data = sample.planets[planet2.name];

          if (!planet1Data || !planet2Data) continue;

          const currentAngle = getAngularDistance(
            planet1Data.longitude,
            planet2Data.longitude
          );

          aspectTypes.forEach((aspectType) => {
            const aspectKey = `${planet1.name}-${planet2.name}-${aspectType.name}`;
            const prevAspectState = aspectStates[aspectKey];

            // Calculate distance from target angle (0 = exact match)
            const getDistanceFromTarget = (angle) => {
              const diff = Math.abs(angle - aspectType.angle);
              return Math.min(diff, 360 - diff);
            };

            const currentDistance = getDistanceFromTarget(currentAngle);
            const prevDistance = prevAspectState
              ? getDistanceFromTarget(prevAspectState.lastAngle || currentAngle)
              : 999;

            // Detect aspects using a more robust approach:
            // - Detect when aspect is within orb (0.5 degrees) and wasn't already logged
            // - Detect when aspect crosses into orb (wasn't exact, now is)
            // - Detect when aspect is at its closest point (local minimum)
            const orb = currentDistance;
            const isExact = orb <= 0.5; // 0.5 degree orb for detection
            const wasExact = prevAspectState && prevAspectState.wasExact;
            const prevDist = prevAspectState
              ? getDistanceFromTarget(prevAspectState.lastAngle || currentAngle)
              : 999;

            // Check if this is a local minimum (aspect is at its closest approach)
            // This helps catch aspects that become exact between samples
            let isLocalMinimum = false;
            if (i > 0 && prevAspectState && isExact) {
              // Check next sample if available to determine if this is a local minimum
              let nextDist = 999;
              if (i < samples.length - 1) {
                const nextSample = samples[i + 1];
                const nextP1 = nextSample.planets[planet1.name];
                const nextP2 = nextSample.planets[planet2.name];
                if (nextP1 && nextP2) {
                  const nextAngle = getAngularDistance(
                    nextP1.longitude,
                    nextP2.longitude
                  );
                  nextDist = getDistanceFromTarget(nextAngle);
                }
              }
              // Local minimum: current is closer than both prev and next
              isLocalMinimum =
                currentDistance < prevDist &&
                (nextDist === 999 || currentDistance < nextDist);
            }

            // Detect aspect if:
            // 1. It's within orb and wasn't exact before (crossing into orb) - this is the primary detection
            // 2. It's within orb and is a local minimum (closest approach), but only if we haven't detected it recently
            const isCrossingIntoOrb = !wasExact && isExact && i > 0;

            // Check if we've already detected this aspect recently (within 18 hours = 0.75 days)
            // This prevents detecting the same aspect multiple times as it moves through the orb window
            const lastEventJD = aspectLastEventTime[aspectKey];
            const minTimeBetweenEvents = 0.75; // 18 hours in Julian Days (0.75 days)
            const timeSinceLastEvent = lastEventJD
              ? sample.julianDay - lastEventJD
              : Infinity;
            const isRecentDuplicate = timeSinceLastEvent < minTimeBetweenEvents;

            // Only detect if:
            // - Crossing into orb (primary detection), OR
            // - Local minimum AND we haven't detected it recently AND it wasn't already exact
            // (This catches aspects that became exact between samples without crossing the threshold at a sample time)
            const shouldDetect =
              (isCrossingIntoOrb ||
                (isLocalMinimum && !isRecentDuplicate && !wasExact)) &&
              i > 0;

            if (shouldDetect) {
              // Find exact time if we have previous sample
              if (i > 0) {
                const prevSample = samples[i - 1];
                const prevPlanet1 = prevSample.planets[planet1.name];
                const prevPlanet2 = prevSample.planets[planet2.name];

                if (prevPlanet1 && prevPlanet2) {
                  const prevAngle = getAngularDistance(
                    prevPlanet1.longitude,
                    prevPlanet2.longitude
                  );
                  const prevDistForRefinement =
                    getDistanceFromTarget(prevAngle);

                  // Attempt refinement if we have valid data
                  // Don't require distance to decrease - aspects can be detected at their closest point
                  const sampleDateStr = julianDayToDate(
                    sample.julianDay
                  ).toISOString();

                  // For local minimum detection, we may need to check the next sample too
                  // But for now, refine between prev and current
                  let refinementHighJD = sample.julianDay;
                  let refinementHighAngle = currentAngle;

                  // If this is a local minimum and we have a next sample, refine across the minimum
                  if (isLocalMinimum && i < samples.length - 1) {
                    const nextSample = samples[i + 1];
                    const nextP1 = nextSample.planets[planet1.name];
                    const nextP2 = nextSample.planets[planet2.name];
                    if (nextP1 && nextP2) {
                      refinementHighJD = nextSample.julianDay;
                      refinementHighAngle = getAngularDistance(
                        nextP1.longitude,
                        nextP2.longitude
                      );
                    }
                  }

                  const exactJD = findExactAspectTime(
                    planet1.id,
                    planet2.id,
                    aspectType.angle,
                    prevSample.julianDay,
                    refinementHighJD,
                    prevAngle,
                    refinementHighAngle
                  );
                  const exactDate = julianDayToDate(exactJD);
                  const exactDateStr = exactDate.toISOString();
                  const timeDiff = Math.abs(
                    (exactJD - sample.julianDay) * 24 * 60
                  ); // minutes

                  // Always log aspect events for debugging
                  console.log(
                    `   📊 [EVENT CREATED] ${planet1.name} ${aspectType.name} ${planet2.name}`
                  );
                  console.log(`      Sample time: ${sampleDateStr}`);
                  console.log(`      Exact time:  ${exactDateStr}`);
                  console.log(
                    `      Difference:  ${timeDiff.toFixed(1)} minutes`
                  );

                  events.push({
                    type: "aspect",
                    planet1: planet1.name,
                    planet2: planet2.name,
                    aspectName: aspectType.name,
                    utcDateTime: exactDateStr,
                    orb: orb,
                    planet1Position: {
                      degree: planet1Data.degree,
                      degreeFormatted: planet1Data.degreeFormatted,
                      zodiacSignName: planet1Data.zodiacSignName,
                    },
                    planet2Position: {
                      degree: planet2Data.degree,
                      degreeFormatted: planet2Data.degreeFormatted,
                      zodiacSignName: planet2Data.zodiacSignName,
                    },
                  });

                  // Track the last event time for this aspect to prevent duplicates
                  aspectLastEventTime[aspectKey] = exactJD;
                }
              }
            }

            aspectStates[aspectKey] = {
              wasExact: isExact,
              orb: orb,
              lastAngle: currentAngle,
            };
          });
        }
      }
    }

    // Sort events chronologically
    events.sort((a, b) => new Date(a.utcDateTime) - new Date(b.utcDateTime));

    // Deduplicate aspect events that are too close in time (within 18 hours)
    // This catches any duplicates that might have slipped through
    // Strategy: For each aspect type, keep only the event with the smallest orb within each 18-hour window
    const aspectEventGroups = {}; // Key: aspectKey, Value: array of events for that aspect
    const DEDUPLICATION_WINDOW_HOURS = 18; // 18 hours = 1.5 * sample interval

    // Group aspect events by aspect type
    events.forEach((event) => {
      if (event.type === "aspect") {
        const aspectKey = `${event.planet1}-${event.planet2}-${event.aspectName}`;
        if (!aspectEventGroups[aspectKey]) {
          aspectEventGroups[aspectKey] = [];
        }
        aspectEventGroups[aspectKey].push(event);
      }
    });

    // For each aspect type, deduplicate by keeping only events that are far enough apart
    const deduplicatedAspectEvents = new Set();
    Object.keys(aspectEventGroups).forEach((aspectKey) => {
      const aspectEvents = aspectEventGroups[aspectKey].sort(
        (a, b) => new Date(a.utcDateTime) - new Date(b.utcDateTime)
      );

      let lastKeptEvent = null;
      aspectEvents.forEach((event) => {
        const eventTime = new Date(event.utcDateTime).getTime();

        if (!lastKeptEvent) {
          // First event for this aspect - always keep it
          deduplicatedAspectEvents.add(event);
          lastKeptEvent = event;
        } else {
          const lastTime = new Date(lastKeptEvent.utcDateTime).getTime();
          const timeSinceLastEvent = (eventTime - lastTime) / (1000 * 60 * 60); // hours

          if (timeSinceLastEvent >= DEDUPLICATION_WINDOW_HOURS) {
            // Far enough apart - keep both
            deduplicatedAspectEvents.add(event);
            lastKeptEvent = event;
          } else {
            // Too close - keep the one with smaller orb
            if (event.orb < lastKeptEvent.orb) {
              deduplicatedAspectEvents.delete(lastKeptEvent);
              deduplicatedAspectEvents.add(event);
              lastKeptEvent = event;
              console.log(
                `   🔄 [DEDUP] Replaced duplicate aspect ${aspectKey} (new orb: ${event.orb.toFixed(
                  3
                )}° < old orb: ${lastKeptEvent.orb.toFixed(3)}°)`
              );
            } else {
              console.log(
                `   🔄 [DEDUP] Skipped duplicate aspect ${aspectKey} (existing orb: ${lastKeptEvent.orb.toFixed(
                  3
                )}° <= new orb: ${event.orb.toFixed(3)}°)`
              );
            }
          }
        }
      });
    });

    // Build final deduplicated events list (aspects from set, non-aspects from original)
    const deduplicatedEvents = events.filter(
      (event) => event.type !== "aspect" || deduplicatedAspectEvents.has(event)
    );

    // Log event counts for debugging
    const eventCounts = deduplicatedEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      if (event.type === "station") {
        acc[`station-${event.stationType}`] =
          (acc[`station-${event.stationType}`] || 0) + 1;
      }
      return acc;
    }, {});
    console.log(`Year ephemeris events detected:`, eventCounts);
    console.log(`Station detection checks:`, stationChecks);

    const responseData = {
      year,
      location: { latitude, longitude },
      sampleInterval,
      totalSamples: samples.length,
      events: deduplicatedEvents, // Return deduplicated events with exact timestamps
      samples, // Keep samples for backward compatibility if needed
    };

    // Store in cache (permanent cache for year data)
    yearEphemerisCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(), // Keep timestamp for reference, but don't use for expiration
    });

    // Clean up old cache entries if cache gets too large (keep only last 20 entries)
    // This prevents memory issues while still caching many years
    if (yearEphemerisCache.size > 20) {
      // Remove oldest entries (by timestamp) until we're under the limit
      const entries = Array.from(yearEphemerisCache.entries())
        .map(([key, value]) => ({ key, timestamp: value.timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);

      const entriesToDelete = entries.slice(0, yearEphemerisCache.size - 20);
      entriesToDelete.forEach((entry) => yearEphemerisCache.delete(entry.key));
      console.log(`🗑️ Cleaned up ${entriesToDelete.length} old cache entries`);
    }

    res.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error("Year ephemeris calculation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate year ephemeris",
      details: error.message,
    });
  }
});

module.exports = router;
