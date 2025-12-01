const express = require("express");
const router = express.Router();

// Swiss Ephemeris - use require to avoid TypeScript issues
const sweph = require("sweph");

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
      finalYear,
      finalMonth,
      finalDay,
      finalHour,
      finalMinute,
      finalSecond
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
      finalYear,
      finalMonth,
      finalDay,
      finalHour,
      finalMinute,
      finalSecond
    );

    // Calculate houses
    const houses = sweph.houses(julianDay, latitude, longitude, houseSystem);

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
    sweph.set_topo(longitude, latitude, 0); // 0 altitude for sea level

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

    console.log("📊 Received request body:", {
      latitude,
      longitude,
      finalYear,
      finalMonth,
      finalDay,
      finalHour,
      finalMinute,
      finalSecond,
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
    sweph.set_topo(longitude, latitude, 0); // 0 altitude for sea level

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

// Helper function to find exact ingress time using binary search
function findExactIngressTime(
  planetId,
  targetSign,
  prevJD,
  currentJD,
  prevLongitude,
  currentLongitude,
  maxIterations = 20,
  toleranceDays = 1 / (24 * 60) // 1 minute tolerance
) {
  const targetBoundary = targetSign * 30;
  let low = prevJD;
  let high = currentJD;
  let bestJD = currentJD;
  let iterations = 0;

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
      const result = sweph.calc_ut(midJD, planetId, SEFLG_TOPOCTR | SEFLG_SPEED);
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
        break;
      }
    } catch (error) {
      break;
    }
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
  maxIterations = 20,
  toleranceDays = 1 / (24 * 60) // 1 minute tolerance
) {
  let low = prevJD;
  let high = currentJD;
  let bestJD = currentJD;
  let iterations = 0;

  while (high - low > toleranceDays && iterations < maxIterations) {
    iterations++;
    const midJD = (low + high) / 2;

    try {
      const result = sweph.calc_ut(midJD, planetId, SEFLG_TOPOCTR | SEFLG_SPEED);
      if (result.data && result.data.length >= 4) {
        const midSpeed = result.data[3];
        const prevSign = Math.sign(prevSpeed);
        const midSign = Math.sign(midSpeed);

        if (prevSign !== midSign) {
          high = midJD;
          bestJD = midJD;
        } else {
          low = midJD;
        }
      } else {
        break;
      }
    } catch (error) {
      break;
    }
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
  maxIterations = 20,
  toleranceDays = 1 / (24 * 60) // 1 minute tolerance
) {
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

  let low = prevJD;
  let high = currentJD;
  let bestJD = currentJD;
  let bestDistance = currentDistance;
  let iterations = 0;

  while (high - low > toleranceDays && iterations < maxIterations) {
    iterations++;
    const midJD = (low + high) / 2;

    try {
      const result1 = sweph.calc_ut(midJD, planet1Id, SEFLG_TOPOCTR | SEFLG_SPEED);
      const result2 = sweph.calc_ut(midJD, planet2Id, SEFLG_TOPOCTR | SEFLG_SPEED);
      
      if (result1.data && result1.data.length >= 1 && result2.data && result2.data.length >= 1) {
        const lon1 = result1.data[0];
        const lon2 = result2.data[0];
        const diff = Math.abs(lon1 - lon2);
        const midAngle = Math.min(diff, 360 - diff);
        const midDistance = getDistanceFromTarget(midAngle);

        // Update best match
        if (midDistance < bestDistance) {
          bestDistance = midDistance;
          bestJD = midJD;
        }

        // If we're very close to exact, we can stop early
        if (midDistance < 0.01) {
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
        break;
      }
    } catch (error) {
      break;
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
          return new Date(Date.UTC(result.year, result.month - 1, day, hour, minute, second));
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

    // Set topocentric location
    sweph.set_topo(longitude, latitude, 0);

    // Planet IDs to track (including Sun for ingresses, excluding Moon)
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

          if (result.data && result.data.length >= 4) {
            const longitude = result.data[0];
            const speed = result.data[3];
            
            // Debug: Log first few mercury calculations to check speed
            if (planet.name === "mercury" && samples.length < 3) {
              console.log(
                `Mercury calc - JD: ${julianDay}, result.data length: ${result.data.length}, speed: ${speed}, longitude: ${longitude}`
              );
              console.log("Full result.data:", result.data);
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
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
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

    // Track aspect states
    const aspectStates = {};
    const aspectTypes = [
      { name: "conjunct", angle: 0 },
      { name: "sextile", angle: 60 },
      { name: "square", angle: 90 },
      { name: "trine", angle: 120 },
      { name: "opposition", angle: 180 },
    ];

    // Process samples to detect events
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

        // Detect ingress
        if (prevState.zodiacSign !== -1 && prevState.zodiacSign !== currentZodiacSign) {
          if (prevState.previousSampleIndex !== null) {
            const prevSample = samples[prevState.previousSampleIndex];
            const exactJD = findExactIngressTime(
              planet.id,
              currentZodiacSign,
              prevSample.julianDay,
              sample.julianDay,
              prevState.longitude,
              currentLongitude
            );
            const exactDate = julianDayToDate(exactJD);

            events.push({
              type: "ingress",
              planet: planet.name,
              fromSign: signs[prevState.zodiacSign],
              toSign: signs[currentZodiacSign],
              utcDateTime: exactDate.toISOString(),
              degree: planetData.degree,
              degreeFormatted: planetData.degreeFormatted,
              isRetrograde: currentSpeed < 0,
            });
          }
        }

        // Detect station (speed crosses zero)
        if (prevState.speed !== null) {
          const prevSpeedSign = Math.sign(prevState.speed);
          const currentSpeedSign = Math.sign(currentSpeed);
          
          if (prevSpeedSign !== 0 && currentSpeedSign !== 0 && prevSpeedSign !== currentSpeedSign) {
            if (prevState.previousSampleIndex !== null) {
              const prevSample = samples[prevState.previousSampleIndex];
              const exactJD = findExactStationTime(
                planet.id,
                prevSample.julianDay,
                sample.julianDay,
                prevState.speed,
                currentSpeed
              );
              const exactDate = julianDayToDate(exactJD);

              const stationType = prevState.speed > 0 && currentSpeed < 0 ? "retrograde" : "direct";

              events.push({
                type: "station",
                planet: planet.name,
                stationType,
                utcDateTime: exactDate.toISOString(),
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

          const currentAngle = getAngularDistance(planet1Data.longitude, planet2Data.longitude);

          aspectTypes.forEach((aspectType) => {
            const aspectKey = `${planet1.name}-${planet2.name}-${aspectType.name}`;
            const prevAspectState = aspectStates[aspectKey];
            
            // Calculate distance from target angle (0 = exact match)
            const getDistanceFromTarget = (angle) => {
              const diff = Math.abs(angle - aspectType.angle);
              return Math.min(diff, 360 - diff);
            };
            
            const currentDistance = getDistanceFromTarget(currentAngle);
            const prevDistance = prevAspectState ? getDistanceFromTarget(prevAspectState.lastAngle || currentAngle) : 999;
            
            // Detect when aspect crosses the exact angle (becomes exact)
            // We want to catch it when it goes from not-exact to exact
            const orb = currentDistance;
            const isExact = orb <= 0.5; // 0.5 degree orb for detection
            const wasExact = prevAspectState && prevAspectState.wasExact;
            
            // Also check if we're crossing the exact angle (distance is decreasing and crossing zero)
            const isCrossing = !wasExact && isExact && i > 0;

            if (isCrossing) {
              // Find exact time if we have previous sample
              if (i > 0) {
                const prevSample = samples[i - 1];
                const prevPlanet1 = prevSample.planets[planet1.name];
                const prevPlanet2 = prevSample.planets[planet2.name];
                
                if (prevPlanet1 && prevPlanet2) {
                  const prevAngle = getAngularDistance(prevPlanet1.longitude, prevPlanet2.longitude);
                  const prevDist = getDistanceFromTarget(prevAngle);
                  
                  // Only refine if we're actually crossing (distance decreased)
                  if (prevDist > currentDistance) {
                    const exactJD = findExactAspectTime(
                      planet1.id,
                      planet2.id,
                      aspectType.angle,
                      prevSample.julianDay,
                      sample.julianDay,
                      prevAngle,
                      currentAngle
                    );
                    const exactDate = julianDayToDate(exactJD);

                    events.push({
                      type: "aspect",
                      planet1: planet1.name,
                      planet2: planet2.name,
                      aspectName: aspectType.name,
                      utcDateTime: exactDate.toISOString(),
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
                  }
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

    res.json({
      success: true,
      data: {
        year,
        location: { latitude, longitude },
        sampleInterval,
        totalSamples: samples.length,
        events, // Return events with exact timestamps instead of raw samples
        samples, // Keep samples for backward compatibility if needed
      },
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
