/** Minimal chart payload for AstrologyChart on the electional list. */

function serializeChartSnapshot(chart) {
  const planets = {};
  for (const [name, p] of Object.entries(chart.planets || {})) {
    if (!p || p.error) continue;
    planets[name] = {
      longitude: p.longitude,
      latitude: p.latitude ?? 0,
      distance: p.distance ?? 0,
      speed: p.speed ?? 0,
      zodiacSign: p.zodiacSign ?? Math.floor(p.longitude / 30),
      zodiacSignName: p.zodiacSignName,
      degree: p.degree ?? p.longitude % 30,
      degreeFormatted: p.degreeFormatted,
      symbol: p.symbol,
      isRetrograde: p.isRetrograde,
    };
  }

  const h = chart.houses || {};
  return {
    planets,
    houses: {
      cusps: h.cusps ?? [],
      ascendant: h.ascendant,
      ascendantSign: h.ascendantSign,
      ascendantDegree: h.ascendantDegree,
      mc: h.mc,
      mcSign: h.mcSign,
      mcDegree: h.mcDegree,
      houseSystem: h.houseSystem ?? "W",
    },
  };
}

module.exports = { serializeChartSnapshot };
