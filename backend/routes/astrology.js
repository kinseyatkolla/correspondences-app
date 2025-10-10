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

module.exports = router;
