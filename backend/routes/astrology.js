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

// Helper function to calculate speed manually from position differences
// This is necessary because SEFLG_SPEED with topocentric coordinates is unreliable
function calculateSpeedFromPositions(
  julianDay,
  planetId,
  useTopocentric = true
) {
  const flags = useTopocentric ? SEFLG_TOPOCTR : 0;
  const smallOffset = 1 / (24 * 60); // 1 minute offset

  try {
    const resultBefore = sweph.calc_ut(
      julianDay - smallOffset,
      planetId,
      flags
    );
    const resultAfter = sweph.calc_ut(julianDay + smallOffset, planetId, flags);

    if (
      resultBefore.data &&
      resultBefore.data.length >= 1 &&
      resultAfter.data &&
      resultAfter.data.length >= 1
    ) {
      const lonBefore = resultBefore.data[0];
      const lonAfter = resultAfter.data[0];

      // Normalize longitude difference (handle wrap-around)
      let lonDiff = lonAfter - lonBefore;
      if (lonDiff > 180) lonDiff -= 360;
      if (lonDiff < -180) lonDiff += 360;

      // Speed = longitude change / time change (degrees per day)
      const timeChangeDays = 2 * smallOffset;
      return lonDiff / timeChangeDays;
    }
  } catch (error) {
    // If calculation fails, return 0
  }

  return 0;
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
        const result = sweph.calc_ut(julianDay, planet.id, 0); // No flags needed, we calculate speed manually

        if (result.data && result.data.length >= 1) {
          const longitude = result.data[0];
          // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
          // This endpoint doesn't use topocentric, but we'll calculate manually for consistency
          const speed = calculateSpeedFromPositions(
            julianDay,
            planet.id,
            false
          );
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
          SEFLG_TOPOCTR // Don't use SEFLG_SPEED, we calculate manually
        );

        if (result.data && result.data.length >= 1) {
          const longitude = result.data[0];
          // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
          const speed = calculateSpeedFromPositions(julianDay, planet.id, true);
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
          SEFLG_TOPOCTR // Don't use SEFLG_SPEED, we calculate manually
        );

        if (result.data && result.data.length >= 1) {
          const longitude = result.data[0];
          // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
          const speed = calculateSpeedFromPositions(julianDay, planet.id, true);
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

  return bestJD;
}

// Helper function to find exact station time using bisection root-finding
// We know speed changes sign between prevSpeed and currentSpeed, so we can use bisection
// to find the exact point where speed = 0
function findExactStationTime(
  planetId,
  prevJD,
  currentJD,
  prevSpeed,
  currentSpeed,
  maxIterations = 50,
  toleranceDays = 0.001 / (24 * 60 * 60) // 1 millisecond tolerance
) {
  const planetName = getPlanetNameFromId(planetId);
  const prevDate = julianDayToDate(prevJD);
  const currentDate = julianDayToDate(currentJD);
  const timeDiffHours = ((currentJD - prevJD) * 24).toFixed(2);
  const stationType =
    prevSpeed > 0 && currentSpeed < 0 ? "retrograde" : "direct";

  // Special logging for Jupiter retrograde station on Nov 11, 2025 (expected ~9:37 AM)
  const isJupiterNov11 =
    planetName.toLowerCase() === "jupiter" &&
    prevDate.getUTCFullYear() === 2025 &&
    prevDate.getUTCMonth() === 10 && // November (0-indexed)
    prevDate.getUTCDate() === 11 &&
    stationType === "retrograde";

  // Station refinement logs removed for cleanliness - keep only errors
  // console.log(`🔍 [STATION REFINEMENT] ${planetName} ${stationType} station`);
  // console.log(
  //   `   Sample window: ${prevDate.toISOString()} to ${currentDate.toISOString()} (${timeDiffHours}h)`
  // );
  // IMPORTANT: Recalculate speeds at sample points using calculateSpeedFromPositions
  // The input speeds may be average speeds over the interval (for large time differences),
  // but we need actual instantaneous speeds for accurate bisection
  let recalculatedPrevSpeed = prevSpeed;
  let recalculatedCurrentSpeed = currentSpeed;
  try {
    recalculatedPrevSpeed = calculateSpeedFromPositions(prevJD, planetId, true);
    recalculatedCurrentSpeed = calculateSpeedFromPositions(
      currentJD,
      planetId,
      true
    );
  } catch (error) {
    // Use input speeds if recalculation fails
  }

  // Use bisection to find where speed = 0
  // We know speed changes sign between prevJD and currentJD
  let low = prevJD;
  let high = currentJD;
  let lowSpeed = recalculatedPrevSpeed;
  let highSpeed = recalculatedCurrentSpeed;

  // Track whether we'll do bisection or just refinement search
  let skipBisection = false;

  // If recalculated speeds have same sign, we can't use bisection
  // but we'll still do a refinement search to find the minimum speed
  if (Math.sign(lowSpeed) === Math.sign(highSpeed)) {
    // If both speeds are very close to zero (within 0.001°/day), proceed with bisection anyway
    // The station might be between the samples even if both calculated speeds have same sign
    if (Math.abs(lowSpeed) > 0.001 || Math.abs(highSpeed) > 0.001) {
      // Try checking speeds at points slightly inside the interval
      const offsetDays = (currentJD - prevJD) * 0.1; // 10% into the interval
      try {
        const offsetLowSpeed = calculateSpeedFromPositions(
          prevJD + offsetDays,
          planetId,
          true
        );
        const offsetHighSpeed = calculateSpeedFromPositions(
          currentJD - offsetDays,
          planetId,
          true
        );

        // If offset speeds have opposite signs, use them for bisection
        if (Math.sign(offsetLowSpeed) !== Math.sign(offsetHighSpeed)) {
          low = prevJD + offsetDays;
          high = currentJD - offsetDays;
          lowSpeed = offsetLowSpeed;
          highSpeed = offsetHighSpeed;
        } else {
          // Still same sign even with offsets - can't use bisection
          // We'll skip bisection and go straight to refinement search
          skipBisection = true;
        }
      } catch (error) {
        // If offset calculation fails, can't use bisection - do refinement search instead
        skipBisection = true;
      }
    }
    // If both speeds are very small (< 0.001°/day), proceed with bisection anyway
    // as the station is likely somewhere in between
  }

  // Initialize bestJD - use midpoint if doing bisection, otherwise use point with lower speed
  let bestJD;
  let bestSpeedAbs = Infinity;
  let iterations = 0;

  if (skipBisection) {
    // Can't use bisection - initialize to whichever endpoint has speed closer to zero
    bestJD =
      Math.abs(recalculatedCurrentSpeed) < Math.abs(recalculatedPrevSpeed)
        ? currentJD
        : prevJD;
    bestSpeedAbs = Math.min(
      Math.abs(recalculatedPrevSpeed),
      Math.abs(recalculatedCurrentSpeed)
    );
  } else {
    // Initialize bestJD to midpoint to avoid starting at exact hour sample times
    const initialMidJD = (low + high) / 2;
    bestJD = initialMidJD;

    // Calculate initial speed at midpoint
    try {
      const initialResult = sweph.calc_ut(
        initialMidJD,
        planetId,
        SEFLG_TOPOCTR
      );
      if (initialResult.data && initialResult.data.length >= 1) {
        const initialSpeed = calculateSpeedFromPositions(
          initialMidJD,
          planetId,
          true
        );
        bestSpeedAbs = Math.abs(initialSpeed);
      }
    } catch (error) {}
  }

  // Only do bisection if we have opposite signs
  if (!skipBisection) {
    while (high - low > toleranceDays && iterations < maxIterations) {
      iterations++;
      const midJD = (low + high) / 2;

      try {
        // Don't use SEFLG_SPEED flag - we calculate speed manually
        const result = sweph.calc_ut(midJD, planetId, SEFLG_TOPOCTR);

        if (result.data && result.data.length >= 1) {
          // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
          const midSpeed = calculateSpeedFromPositions(midJD, planetId, true);
          const midSpeedAbs = Math.abs(midSpeed);

          // Track the best (closest to zero) speed we've found
          // Always update if we find a better speed (no threshold to avoid getting stuck)
          if (midSpeedAbs < bestSpeedAbs) {
            bestSpeedAbs = midSpeedAbs;
            bestJD = midJD;
          }

          // Bisection: determine which half contains the zero crossing
          const lowSign = Math.sign(lowSpeed);
          const midSign = Math.sign(midSpeed);

          if (lowSign !== midSign) {
            // Zero crossing is between low and mid
            high = midJD;
            highSpeed = midSpeed;
          } else {
            // Zero crossing is between mid and high
            low = midJD;
            lowSpeed = midSpeed;
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
  }

  // After bisection (if used), do a fine-grained search across an EXPANDED window
  // Expand search window to 6 hours before prevJD and 6 hours after currentJD
  // This ensures we catch stations that occur near sample boundaries
  const searchStepSeconds = 30; // 30 second steps (reasonable granularity without being too slow)
  const searchStepDays = searchStepSeconds / (24 * 60 * 60);
  const expansionHours = 6; // Search 6 hours before and after the detected interval
  const expansionDays = expansionHours / 24;
  const expandedPrevJD = prevJD - expansionDays;
  const expandedCurrentJD = currentJD + expansionDays;
  const totalWindowDays = expandedCurrentJD - expandedPrevJD;

  // Track the best point before refinement search for comparison
  const beforeRefinementJD = bestJD;
  const beforeRefinementSpeed = bestSpeedAbs;

  // Search from expandedPrevJD to expandedCurrentJD
  for (
    let testJD = expandedPrevJD;
    testJD <= expandedCurrentJD;
    testJD += searchStepDays
  ) {
    try {
      // Don't use SEFLG_SPEED flag - we calculate speed manually
      const result = sweph.calc_ut(testJD, planetId, SEFLG_TOPOCTR);

      if (result.data && result.data.length >= 1) {
        // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
        const testSpeed = calculateSpeedFromPositions(testJD, planetId, true);
        const testSpeedAbs = Math.abs(testSpeed);

        // Always update if we find a better speed (no threshold to avoid getting stuck at exact hours)
        if (testSpeedAbs < bestSpeedAbs) {
          bestSpeedAbs = testSpeedAbs;
          bestJD = testJD;
        }
      }
    } catch (error) {
      // Skip errors
    }
  }

  // Always do a final fine-grained search around the best point found
  const offsetSeconds = Math.abs((bestJD - beforeRefinementJD) * 24 * 60 * 60);
  // Use a larger search window if the offset from bisection is large (suggests bisection may have been wrong)
  const fineWindowSeconds = offsetSeconds > 300 ? 600 : 300; // ±10 minutes if large offset, ±5 minutes otherwise
  const fineStepSeconds = 1; // 1 second steps for maximum precision
  const fineWindowDays = fineWindowSeconds / (24 * 60 * 60);
  const fineStepDays = fineStepSeconds / (24 * 60 * 60);
  const fineBestJD = bestJD;
  const fineBestSpeed = bestSpeedAbs;
  let fineChecked = 0;

  for (
    let offset = -fineWindowDays;
    offset <= fineWindowDays;
    offset += fineStepDays
  ) {
    const fineJD = bestJD + offset;
    // Allow fine-grained search within the expanded window (6 hours before/after original interval)
    if (fineJD < expandedPrevJD || fineJD > expandedCurrentJD) continue;

    try {
      const fineSpeed = calculateSpeedFromPositions(fineJD, planetId, true);
      const fineSpeedAbs = Math.abs(fineSpeed);
      fineChecked++;
      if (fineSpeedAbs < bestSpeedAbs) {
        bestSpeedAbs = fineSpeedAbs;
        bestJD = fineJD;
      }
    } catch (error) {
      // Skip
    }
  }

  const exactDate = julianDayToDate(bestJD);

  return bestJD;
}

// Helper function to find exact aspect time using hierarchical search (hour -> minute -> second)
function findExactAspectTime(
  planet1Id,
  planet2Id,
  targetAngle,
  prevJD,
  currentJD,
  prevAngle,
  currentAngle,
  maxIterations = 30, // Not used in hierarchical search, kept for compatibility
  toleranceDays = 0.01 / (24 * 60 * 60) // Not used in hierarchical search, kept for compatibility
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

  // If we're not crossing the exact angle, return the sample that's closer
  // (This shouldn't happen if detection is working correctly, but safety check)
  if (prevDistance > 1 && currentDistance > 1) {
    return prevDistance < currentDistance ? prevJD : currentJD;
  }

  // Expand search window significantly before prevJD and after currentJD
  // This ensures we catch aspects that occur well outside sample boundaries
  // Use at least 24 hours expansion (1 full day on each side) to handle cases
  // where the aspect occurs much later than the initial sample window suggests
  const windowSizeHours = (currentJD - prevJD) * 24;
  const expansionHours = Math.max(24, windowSizeHours * 2); // At least 24h, or 2x window size
  const expansionDays = expansionHours / 24;
  const expandedPrevJD = prevJD - expansionDays;
  const expandedCurrentJD = currentJD + expansionDays;

  // Hierarchical search: find best hour, then best minute, then best second
  // Initialize bestJD to whichever sample is closer to target angle
  let bestJD = prevDistance < currentDistance ? prevJD : currentJD;
  let bestDistance = Math.min(prevDistance, currentDistance);

  // Step 1: Find the best hour within the expanded window
  // Sample every hour (at :00 minutes) in the expanded window
  const hoursInWindow = Math.ceil((expandedCurrentJD - expandedPrevJD) * 24);

  let bestHourDate = null;
  let bestHourDistance = bestDistance;

  for (let h = 0; h <= hoursInWindow; h++) {
    const hourJD = expandedPrevJD + h / 24;

    // Skip if outside expanded window
    if (hourJD < expandedPrevJD || hourJD > expandedCurrentJD) continue;

    try {
      const result1 = sweph.calc_ut(
        hourJD,
        planet1Id,
        SEFLG_TOPOCTR | SEFLG_SPEED
      );
      const result2 = sweph.calc_ut(
        hourJD,
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
        const angle = Math.min(diff, 360 - diff);
        const distance = getDistanceFromTarget(angle);

        if (distance < bestHourDistance - 1e-10) {
          bestHourDistance = distance;
          bestJD = hourJD;
        }
      }
    } catch (error) {
      // Skip errors for individual hours
    }
  }

  // Even if no better hour found, we should still check minutes and seconds
  // because the optimal time might be between hour boundaries
  if (bestHourDistance >= bestDistance - 1e-10) {
    // Reset to initial best values so we search around the initial sample time
    bestHourDistance = bestDistance;
    // Use the hour containing the initial best time (round down to hour start)
    const initialBestDate = julianDayToDate(bestJD);
    const hourStartDate = new Date(initialBestDate);
    hourStartDate.setUTCMinutes(0, 0, 0);
    // Convert back to JD (approximate - this should be fine for our search)
    const msSinceEpoch = hourStartDate.getTime();
    const jdOffset = 2440587.5;
    const msPerDay = 86400000;
    const hourStartJD = msSinceEpoch / msPerDay + jdOffset;
    bestJD = hourStartJD;
  }

  bestHourDate = julianDayToDate(bestJD);

  // Step 2: Find the best minute - search in best hour plus adjacent hours for better precision
  // Search 1 hour before, the best hour, and 1 hour after (to catch optimal times near boundaries)

  const bestHourJD = bestJD;
  let bestMinuteDate = bestHourDate;
  let bestMinuteDistance = bestHourDistance;

  // Search in 3 hours: bestHour - 1h, bestHour, bestHour + 1h
  const hoursToSearch = [bestHourJD - 1 / 24, bestHourJD, bestHourJD + 1 / 24];

  for (const hourJD of hoursToSearch) {
    // Skip if outside expanded window
    if (hourJD < expandedPrevJD || hourJD > expandedCurrentJD) continue;

    // Check all 60 minutes in this hour
    for (let m = 0; m < 60; m++) {
      const minuteJD = hourJD + m / (24 * 60);

      // Skip if outside expanded window
      if (minuteJD < expandedPrevJD || minuteJD > expandedCurrentJD) continue;

      try {
        const result1 = sweph.calc_ut(
          minuteJD,
          planet1Id,
          SEFLG_TOPOCTR | SEFLG_SPEED
        );
        const result2 = sweph.calc_ut(
          minuteJD,
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
          const angle = Math.min(diff, 360 - diff);
          const distance = getDistanceFromTarget(angle);

          if (distance < bestMinuteDistance - 1e-10) {
            bestMinuteDistance = distance;
            bestMinuteDate = julianDayToDate(minuteJD);
            bestJD = minuteJD;
          }
        }
      } catch (error) {
        // Skip errors for individual minutes
      }
    }
  }

  // Step 3: Find the best second - search in best minute plus adjacent minutes for better precision
  // Search 1 minute before, the best minute, and 1 minute after (to catch optimal times near boundaries)

  const bestMinuteJD = bestJD;
  let bestSecondDate = bestMinuteDate;
  let bestSecondDistance = bestMinuteDistance;

  // Search in 3 minutes: bestMinute - 1m, bestMinute, bestMinute + 1m
  const minutesToSearch = [
    bestMinuteJD - 1 / (24 * 60),
    bestMinuteJD,
    bestMinuteJD + 1 / (24 * 60),
  ];

  for (const minuteJD of minutesToSearch) {
    // Skip if outside expanded window
    if (minuteJD < expandedPrevJD || minuteJD > expandedCurrentJD) continue;

    // Check all 60 seconds in this minute
    for (let s = 0; s < 60; s++) {
      const secondJD = minuteJD + s / (24 * 60 * 60);

      // Skip if outside expanded window
      if (secondJD < expandedPrevJD || secondJD > expandedCurrentJD) continue;

      try {
        const result1 = sweph.calc_ut(
          secondJD,
          planet1Id,
          SEFLG_TOPOCTR | SEFLG_SPEED
        );
        const result2 = sweph.calc_ut(
          secondJD,
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
          const angle = Math.min(diff, 360 - diff);
          const distance = getDistanceFromTarget(angle);

          if (distance < bestSecondDistance - 1e-10) {
            bestSecondDistance = distance;
            bestSecondDate = julianDayToDate(secondJD);
            bestJD = secondJD;
          }
        }
      } catch (error) {
        // Skip errors for individual seconds
      }
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
    const seenTimestamps = new Set(); // Track timestamps to prevent duplicates
    while (currentDate <= endDate) {
      const julianDay = calculateJulianDay(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth() + 1,
        currentDate.getUTCDate(),
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        currentDate.getUTCSeconds()
      );

      // Check for duplicate timestamps (shouldn't happen, but safeguard)
      const timestamp = currentDate.toISOString();
      if (seenTimestamps.has(timestamp)) {
        console.warn(
          `⚠️ Duplicate timestamp detected: ${timestamp}, skipping sample`
        );
        // Skip this sample and advance to next
        currentDate.setTime(
          currentDate.getTime() + sampleInterval * 60 * 60 * 1000
        );
        continue;
      }
      seenTimestamps.add(timestamp);

      const sample = {
        julianDay,
        timestamp,
        planets: {},
      };

      // Calculate planetary positions
      planetIds.forEach((planet) => {
        try {
          const result = sweph.calc_ut(
            julianDay,
            planet.id,
            SEFLG_TOPOCTR // Don't use SEFLG_SPEED, we calculate speed manually
          );

          if (result.data && result.data.length >= 1) {
            const longitude = result.data[0];
            // Always calculate speed manually - SEFLG_SPEED with topocentric coordinates is unreliable
            // For ephemeris samples, we can use the previous sample's longitude for better accuracy with larger time differences
            let speed = 0;
            if (samples.length > 0) {
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
            // Fallback to manual calculation if we don't have a previous sample
            if (speed === 0 && samples.length === 0) {
              speed = calculateSpeedFromPositions(julianDay, planet.id, true);
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
          }
        } catch (planetError) {
          console.error(`Error calculating ${planet.name}:`, planetError);
        }
      });

      samples.push(sample);

      // Move to next sample time
      // Add milliseconds directly to avoid date wrapping issues
      currentDate.setTime(
        currentDate.getTime() + sampleInterval * 60 * 60 * 1000
      );
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
