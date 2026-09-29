const sweph = require("sweph");

const SEFLG_TOPOCTR = 0x00040000;

const PLANET_IDS = [
  { name: "sun", id: 0, symbol: "☉" },
  { name: "moon", id: 1, symbol: "☽" },
  { name: "mercury", id: 2, symbol: "☿" },
  { name: "venus", id: 3, symbol: "♀" },
  { name: "mars", id: 4, symbol: "♂" },
  { name: "jupiter", id: 5, symbol: "♃" },
  { name: "saturn", id: 6, symbol: "♄" },
  { name: "uranus", id: 7, symbol: "♅" },
  { name: "pluto", id: 9, symbol: "♇" },
  { name: "northNode", id: 11, symbol: "☊" },
];

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
  return signs[Math.floor(((longitude % 360) + 360) % 360 / 30)];
}

function formatDegree(longitude) {
  const degree = longitude % 30;
  const minutes = (degree % 1) * 60;
  const seconds = (minutes % 1) * 60;
  return `${Math.floor(degree)}°${Math.floor(minutes)}'${Math.floor(seconds)}"`;
}

function calculateJulianDay(
  year,
  month,
  day,
  hour = 12,
  minute = 0,
  second = 0,
) {
  const decimalHour = hour + minute / 60 + second / 3600;
  return sweph.julday(
    Number(year),
    Number(month),
    Number(day),
    Number(decimalHour),
    1,
  );
}

/** Julian day for a UTC instant (Swiss Ephemeris UT). */
function julianDayFromUtcMs(utcMs) {
  const d = new Date(utcMs);
  return calculateJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
}

/** Build chart for absolute UTC time (use for electional / rising-window search). */
function buildChartAtUtcMs(latitude, longitude, utcMs) {
  return buildChart(latitude, longitude, {
    julianDay: julianDayFromUtcMs(utcMs),
  });
}

function calculateSpeedFromPositions(julianDay, planetId) {
  const smallOffset = 1 / (24 * 60);
  try {
    const resultBefore = sweph.calc_ut(
      julianDay - smallOffset,
      planetId,
      SEFLG_TOPOCTR,
    );
    const resultAfter = sweph.calc_ut(
      julianDay + smallOffset,
      planetId,
      SEFLG_TOPOCTR,
    );
    if (resultBefore.data?.[0] !== undefined && resultAfter.data?.[0] !== undefined) {
      let lonDiff = resultAfter.data[0] - resultBefore.data[0];
      if (lonDiff > 180) lonDiff -= 360;
      if (lonDiff < -180) lonDiff += 360;
      return lonDiff / (2 * smallOffset);
    }
  } catch (_) {
    /* ignore */
  }
  return 0;
}

function buildWholeSignHouses(julianDay, latitude, longitude) {
  const houses = sweph.houses(julianDay, latitude, longitude, "W");
  const ascendantDegree = houses.data?.points?.[0] ?? houses.ascendant ?? 0;
  const mcDegree = houses.data?.points?.[1] ?? houses.mc ?? 0;
  const ascendantSign = getZodiacSign(ascendantDegree);
  const ascendantSignNumber = Math.floor(ascendantDegree / 30);
  const wholeSignCusps = Array.from(
    { length: 13 },
    (_, i) => ((ascendantSignNumber + i) * 30) % 360,
  );
  return {
    ascendant: ascendantDegree,
    ascendantSign,
    ascendantDegree: formatDegree(ascendantDegree),
    mc: mcDegree,
    mcSign: getZodiacSign(mcDegree),
    mcDegree: formatDegree(mcDegree),
    houseSystem: "W",
    cusps: wholeSignCusps,
  };
}

/**
 * @param {object} opts - { julianDay } or { year, month, day, hour, minute, second }
 */
function buildChart(latitude, longitude, opts) {
  const julianDay =
    opts.julianDay ??
    calculateJulianDay(
      opts.year,
      opts.month,
      opts.day,
      opts.hour ?? 12,
      opts.minute ?? 0,
      opts.second ?? 0,
    );

  sweph.set_topo(longitude, latitude, 0);

  const planets = {};
  for (const planet of PLANET_IDS) {
    try {
      const result = sweph.calc_ut(julianDay, planet.id, SEFLG_TOPOCTR);
      if (result.data?.length >= 1) {
        const lon = result.data[0];
        const speed = calculateSpeedFromPositions(julianDay, planet.id);
        planets[planet.name] = {
          longitude: lon,
          latitude: result.data[1],
          distance: result.data[2],
          speed,
          zodiacSign: Math.floor(lon / 30),
          zodiacSignName: getZodiacSign(lon),
          degree: lon % 30,
          degreeFormatted: formatDegree(lon),
          symbol: planet.symbol,
          isRetrograde: speed < 0,
        };
      }
    } catch (_) {
      planets[planet.name] = { error: "calc failed" };
    }
  }

  const houses = buildWholeSignHouses(julianDay, latitude, longitude);

  return {
    julianDay,
    location: { latitude, longitude },
    planets,
    houses,
  };
}

module.exports = {
  buildChart,
  buildChartAtUtcMs,
  buildWholeSignHouses,
  calculateJulianDay,
  julianDayFromUtcMs,
  calculateSpeedFromPositions,
  getZodiacSign,
  PLANET_IDS,
};
