const { signFromLon, getRuler, signIndex } = require("../../electional/chartHelpers");
const {
  SIGNS,
  ZR_YEAR_LENGTH_DAYS,
  SIGN_MINOR_YEARS,
  FULL_CYCLE_UNITS,
  DAY_MS,
  HOUR_MS,
} = require("./config");
const { periodAngularityMetadata } = require("./angularity");

function periodDurationMs(level, signName, yearLengthDays = ZR_YEAR_LENGTH_DAYS) {
  const units = SIGN_MINOR_YEARS[signName];
  if (units == null) throw new Error(`Unknown sign: ${signName}`);
  switch (level) {
    case 1:
      return units * yearLengthDays * DAY_MS;
    case 2:
      return units * 30 * DAY_MS;
    case 3:
      return units * 2.5 * DAY_MS;
    case 4:
      return units * 5 * HOUR_MS;
    default:
      throw new Error(`Invalid level: ${level}`);
  }
}

function signAt(index) {
  return SIGNS[((index % 12) + 12) % 12];
}

/**
 * Generate child-level periods within a parent window (lazy stop at rangeEndMs).
 */
function generateChildPeriods({
  parentStartMs,
  parentEndMs,
  parentSign,
  childLevel,
  yearLengthDays = ZR_YEAR_LENGTH_DAYS,
  rangeEndMs = parentEndMs,
  fortuneSign,
  releasingLotSign,
}) {
  const periods = [];
  const parentSignIdx = signIndex(parentSign);
  const oppositeReleasingIdx =
    (signIndex(releasingLotSign) + 6) % 12;
  let cursor = parentStartMs;
  let signIdx = parentSignIdx;
  let unitsInLap = 0;
  let nextIsLoosingOfBond = false;
  let seenPreBondOpposite = false;

  const hardStop = Math.min(parentEndMs, rangeEndMs);

  while (cursor < parentEndMs && cursor < hardStop) {
    const sign = signAt(signIdx);
    const units = SIGN_MINOR_YEARS[sign];
    const fullDur = periodDurationMs(childLevel, sign, yearLengthDays);
    let endMs = cursor + fullDur;
    const truncated = endMs > parentEndMs;
    if (endMs > parentEndMs) endMs = parentEndMs;

    const meta = periodAngularityMetadata(sign, fortuneSign, releasingLotSign);
    const isLoosingOfBond = nextIsLoosingOfBond;
    const isOppositeReleasing =
      signIdx === oppositeReleasingIdx && !isLoosingOfBond;
    const isPreLoosingOfBond =
      isOppositeReleasing && !seenPreBondOpposite && !isLoosingOfBond;
    if (isPreLoosingOfBond) seenPreBondOpposite = true;

    periods.push({
      level: childLevel,
      sign,
      ruler: getRuler(sign),
      startMs: cursor,
      endMs,
      truncated,
      isLoosingOfBond,
      isPreLoosingOfBond,
      ...meta,
    });

    nextIsLoosingOfBond = false;

    if (endMs >= parentEndMs || endMs >= hardStop) break;

    cursor = endMs;
    unitsInLap += units;

    if (unitsInLap >= FULL_CYCLE_UNITS) {
      signIdx = (parentSignIdx + 6) % 12;
      unitsInLap = 0;
      nextIsLoosingOfBond = true;
    } else {
      signIdx = (signIdx + 1) % 12;
    }
  }

  return periods;
}

function generateLevel1Periods({
  birthMs,
  releasingSign,
  maxEndMs,
  yearLengthDays = ZR_YEAR_LENGTH_DAYS,
  fortuneSign,
}) {
  const periods = [];
  let cursor = birthMs;
  let signIdx = signIndex(releasingSign);

  while (cursor < maxEndMs) {
    const sign = signAt(signIdx);
    const fullDur = periodDurationMs(1, sign, yearLengthDays);
    let endMs = cursor + fullDur;
    const truncated = endMs > maxEndMs;
    if (endMs > maxEndMs) endMs = maxEndMs;

    const meta = periodAngularityMetadata(sign, fortuneSign, releasingSign);

    periods.push({
      level: 1,
      sign,
      ruler: getRuler(sign),
      startMs: cursor,
      endMs,
      truncated,
      isLoosingOfBond: false,
      isPreLoosingOfBond: false,
      ...meta,
    });

    if (endMs >= maxEndMs) break;
    cursor = endMs;
    signIdx = (signIdx + 1) % 12;
  }

  return periods;
}

function findActivePeriod(periods, atMs) {
  return (
    periods.find((p) => atMs >= p.startMs && atMs < p.endMs) ||
    periods[periods.length - 1] ||
    null
  );
}

/** Walk L1 sequence without building the full timeline (for active lookup). */
function findActiveLevel1({
  birthMs,
  releasingSign,
  atMs,
  yearLengthDays = ZR_YEAR_LENGTH_DAYS,
  fortuneSign,
}) {
  if (atMs < birthMs) return null;
  let cursor = birthMs;
  let signIdx = signIndex(releasingSign);

  while (cursor <= atMs) {
    const sign = signAt(signIdx);
    const endMs = cursor + periodDurationMs(1, sign, yearLengthDays);
    if (atMs >= cursor && atMs < endMs) {
      const meta = periodAngularityMetadata(sign, fortuneSign, releasingSign);
      return {
        level: 1,
        sign,
        ruler: getRuler(sign),
        startMs: cursor,
        endMs,
        truncated: false,
        isLoosingOfBond: false,
        isPreLoosingOfBond: false,
        ...meta,
      };
    }
    cursor = endMs;
    signIdx = (signIdx + 1) % 12;
  }
  return null;
}

/** Walk child periods under a parent until `atMs` is located (no full array). */
function findActiveChildPeriod({
  parentStartMs,
  parentEndMs,
  parentSign,
  childLevel,
  atMs,
  yearLengthDays = ZR_YEAR_LENGTH_DAYS,
  fortuneSign,
  releasingLotSign,
}) {
  if (atMs < parentStartMs || atMs >= parentEndMs) return null;

  const parentSignIdx = signIndex(parentSign);
  const oppositeReleasingIdx = (signIndex(releasingLotSign) + 6) % 12;
  let cursor = parentStartMs;
  let signIdx = parentSignIdx;
  let unitsInLap = 0;
  let nextIsLoosingOfBond = false;
  let seenPreBondOpposite = false;

  while (cursor < parentEndMs) {
    const sign = signAt(signIdx);
    const units = SIGN_MINOR_YEARS[sign];
    const fullDur = periodDurationMs(childLevel, sign, yearLengthDays);
    let endMs = cursor + fullDur;
    const truncated = endMs > parentEndMs;
    if (endMs > parentEndMs) endMs = parentEndMs;

    if (atMs >= cursor && atMs < endMs) {
      const meta = periodAngularityMetadata(sign, fortuneSign, releasingLotSign);
      const isLoosingOfBond = nextIsLoosingOfBond;
      const isOppositeReleasing =
        signIdx === oppositeReleasingIdx && !isLoosingOfBond;
      const isPreLoosingOfBond =
        isOppositeReleasing && !seenPreBondOpposite && !isLoosingOfBond;
      return {
        level: childLevel,
        sign,
        ruler: getRuler(sign),
        startMs: cursor,
        endMs,
        truncated,
        isLoosingOfBond,
        isPreLoosingOfBond,
        ...meta,
      };
    }

    nextIsLoosingOfBond = false;
    if (endMs >= parentEndMs) break;

    cursor = endMs;
    unitsInLap += units;

    if (unitsInLap >= FULL_CYCLE_UNITS) {
      signIdx = (parentSignIdx + 6) % 12;
      unitsInLap = 0;
      nextIsLoosingOfBond = true;
    } else {
      signIdx = (signIdx + 1) % 12;
    }
  }
  return null;
}

/**
 * @param {object} input
 * @param {number} input.birthMs — UTC instant
 * @param {string} input.releasingLotSign — whole sign of chosen lot
 * @param {string} input.fortuneSign — for peak / angularity metadata
 * @param {number} input.atMs — query instant (UTC)
 * @param {number} [input.yearLengthDays]
 */
function getActivePeriods(input) {
  const {
    birthMs,
    releasingLotSign,
    fortuneSign,
    atMs,
    yearLengthDays = ZR_YEAR_LENGTH_DAYS,
  } = input;

  const l1 = findActiveLevel1({
    birthMs,
    releasingSign: releasingLotSign,
    atMs,
    yearLengthDays,
    fortuneSign,
  });
  if (!l1) return { l1: null, l2: null, l3: null, l4: null };

  const l2 = findActiveChildPeriod({
    parentStartMs: l1.startMs,
    parentEndMs: l1.endMs,
    parentSign: l1.sign,
    childLevel: 2,
    atMs,
    yearLengthDays,
    fortuneSign,
    releasingLotSign,
  });

  let l3 = null;
  let l4 = null;

  if (l2) {
    l3 = findActiveChildPeriod({
      parentStartMs: l2.startMs,
      parentEndMs: l2.endMs,
      parentSign: l2.sign,
      childLevel: 3,
      atMs,
      yearLengthDays,
      fortuneSign,
      releasingLotSign,
    });

    if (l3) {
      l4 = findActiveChildPeriod({
        parentStartMs: l3.startMs,
        parentEndMs: l3.endMs,
        parentSign: l3.sign,
        childLevel: 4,
        atMs,
        yearLengthDays,
        fortuneSign,
        releasingLotSign,
      });
    }
  }

  return { l1, l2, l3, l4 };
}

/**
 * Fetch periods for a level within optional time bounds (on demand).
 */
function getPeriodsForLevel({
  birthMs,
  releasingLotSign,
  fortuneSign,
  level,
  parentPeriod,
  fromMs,
  toMs,
  yearLengthDays = ZR_YEAR_LENGTH_DAYS,
}) {
  if (level === 1) {
    return generateLevel1Periods({
      birthMs,
      releasingSign: releasingLotSign,
      maxEndMs: toMs,
      yearLengthDays,
      fortuneSign,
    }).filter((p) => p.endMs > fromMs && p.startMs < toMs);
  }

  if (!parentPeriod) return [];

  return generateChildPeriods({
    parentStartMs: parentPeriod.startMs,
    parentEndMs: parentPeriod.endMs,
    parentSign: parentPeriod.sign,
    childLevel: level,
    yearLengthDays,
    rangeEndMs: toMs,
    fortuneSign,
    releasingLotSign,
  }).filter((p) => p.endMs > fromMs && p.startMs < toMs);
}

function releasingSignFromLot(lot) {
  return lot.sign || signFromLon(lot.longitude);
}

module.exports = {
  periodDurationMs,
  generateChildPeriods,
  generateLevel1Periods,
  getActivePeriods,
  getPeriodsForLevel,
  releasingSignFromLot,
  ZR_YEAR_LENGTH_DAYS,
};
