/**
 * Pure lunar motion helpers (VOC tests given sampled aspect events).
 * Ephemeris sampling lives on the backend.
 */

const { ASPECT_ANGLES } = require("./constants");

const VOC_TARGETS = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"];

function aspectWithinTravel(events, travelDeg) {
  return events.filter((e) => e.travelDeg <= travelDeg && e.exact);
}

function detectHellenisticVoc(events, travelLimit = 30) {
  const hits = aspectWithinTravel(events, travelLimit);
  return hits.length === 0;
}

function detectModernVoc(eventsInSign) {
  return eventsInSign.length === 0;
}

function pickNextApplication(events) {
  const next = events.find((e) => e.applying && e.travelDeg > 0);
  if (!next) return null;
  return {
    planet: next.planet,
    aspect: next.aspect,
    travelDeg: next.travelDeg,
    applying: true,
  };
}

function pickLastSeparation(events) {
  const past = events.filter((e) => !e.applying && e.travelDeg <= 0);
  if (!past.length) return null;
  const last = past[past.length - 1];
  return {
    planet: last.planet,
    aspect: last.aspect,
  };
}

module.exports = {
  VOC_TARGETS,
  ASPECT_ANGLES,
  detectHellenisticVoc,
  detectModernVoc,
  pickNextApplication,
  pickLastSeparation,
};
