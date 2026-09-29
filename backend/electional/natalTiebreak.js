/**
 * Natal tiebreak score (0–100): election chart as transit to natal.
 * Secondary sort key after election rankScore when natalRooting is on.
 */

const { isDayChart } = require("./electionSect");
const {
  wholeSignHouse,
  getPlanet,
  angularDistance,
  sectBenefic,
  contrarySectMalefic,
} = require("./chartHelpers");

const TRANSIT_ORB_DEG = 3;

function scoreNatalTiebreak(chart, natal) {
  const ascLon = natal?.ascendantLongitude ?? natal?.ascendant;
  if (!Number.isFinite(ascLon)) {
    return { natalScore: null, factors: [] };
  }

  const electionAsc = chart.houses?.ascendant;
  const sun = getPlanet(chart, "sun");
  if (electionAsc == null || !sun) {
    return { natalScore: 50, factors: [] };
  }

  const isDay = isDayChart(electionAsc, sun.longitude);
  const emphasize = sectBenefic(isDay);
  const avoid = contrarySectMalefic(isDay);

  let score = 50;
  const factors = [];

  const electionAscHouse = wholeSignHouse(electionAsc, ascLon);
  if ([1, 10, 11].includes(electionAscHouse)) {
    score += 12;
    factors.push({
      id: "natal-election-asc-good-house",
      label: "Election Asc in favorable natal house",
      effect: "positive",
    });
  } else if ([6, 8, 12].includes(electionAscHouse)) {
    score -= 15;
    factors.push({
      id: "natal-election-asc-bad-house",
      label: "Election Asc in difficult natal house",
      effect: "negative",
    });
  }

  const targets = [{ lon: ascLon, label: "natal Asc" }];
  if (Number.isFinite(natal.moonLongitude)) {
    targets.push({ lon: natal.moonLongitude, label: "natal Moon" });
  }
  if (Number.isFinite(natal.mcLongitude ?? natal.mc)) {
    targets.push({ lon: natal.mcLongitude ?? natal.mc, label: "natal MC" });
  }

  for (const planetName of ["jupiter", "venus", "mars", "saturn", "sun", "moon"]) {
    const p = getPlanet(chart, planetName);
    if (!p) continue;
    for (const t of targets) {
      const dist = angularDistance(p.longitude, t.lon);
      if (dist > TRANSIT_ORB_DEG) continue;
      if (planetName === emphasize) {
        score += 8;
        factors.push({
          id: `natal-${planetName}-emphasis-${t.label}`,
          label: `${planetName} within ${TRANSIT_ORB_DEG}° of ${t.label}`,
          effect: "positive",
        });
      } else if (planetName === avoid) {
        score -= 10;
        factors.push({
          id: `natal-${planetName}-avoid-${t.label}`,
          label: `${planetName} within ${TRANSIT_ORB_DEG}° of ${t.label}`,
          effect: "negative",
        });
      }
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { natalScore: score, factors };
}

module.exports = { scoreNatalTiebreak, TRANSIT_ORB_DEG };
