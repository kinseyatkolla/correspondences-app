/**
 * Merge consecutive high-scoring samples into ranked election windows.
 */

function sameLocalDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function mergeWindows(samples, options = {}) {
  const {
    scoreFloor = 55,
    minSamples = 2,
    maxPerDay = 2,
    maxTotal = 10,
  } = options;

  const sorted = [...samples].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  const windows = [];
  let current = null;

  for (const s of sorted) {
    if (s.score < scoreFloor) {
      if (current) {
        windows.push(finalizeWindow(current));
        current = null;
      }
      continue;
    }
    if (!current) {
      current = {
        start: s.timestamp,
        end: s.timestamp,
        peak: s,
        samples: [s],
      };
      continue;
    }
    const gapMs = s.timestamp - current.end;
    const maxGapMs = options.maxGapMs ?? 6 * 60 * 1000;
    if (gapMs <= maxGapMs) {
      current.end = s.timestamp;
      current.samples.push(s);
      if (s.score > current.peak.score) current.peak = s;
    } else {
      windows.push(finalizeWindow(current));
      current = {
        start: s.timestamp,
        end: s.timestamp,
        peak: s,
        samples: [s],
      };
    }
  }
  if (current) windows.push(finalizeWindow(current));

  const viable = windows.filter((w) => w.sampleCount >= minSamples);
  viable.sort((a, b) => b.peakScore - a.peakScore);

  const byDay = new Map();
  const picked = [];
  for (const w of viable) {
    const dayKey = w.peakTime.toISOString().slice(0, 10);
    const count = byDay.get(dayKey) || 0;
    if (count >= maxPerDay) continue;
    picked.push(w);
    byDay.set(dayKey, count + 1);
    if (picked.length >= maxTotal) break;
  }

  return picked;
}

function finalizeWindow(current) {
  const ev = current.peak.evaluation;
  return {
    startTime: new Date(current.start),
    endTime: new Date(current.end),
    peakTime: new Date(current.peak.timestamp),
    peakScore: ev?.rankScore ?? current.peak.score,
    peakGrade: current.peak.grade,
    peakEvaluation: ev,
    sampleCount: current.samples.length,
  };
}

/**
 * One best peak per calendar day, then take the top N days by score.
 * Works well for monthly highlight lists (no need for multi-sample runs).
 */
function sampleSortKey(s) {
  const rank = s.rankScore ?? s.score ?? 0;
  const natal = s.natalScore ?? 0;
  return { rank, natal };
}

function compareSamples(a, b) {
  const ka = sampleSortKey(a);
  const kb = sampleSortKey(b);
  if (kb.rank !== ka.rank) return kb.rank - ka.rank;
  return kb.natal - ka.natal;
}

function buildBestPeakPerDay(samples, options) {
  const {
    rankScoreFloor = 35,
    localDayKeyFn = null,
  } = options;
  const byDay = new Map();

  for (const s of samples) {
    const rank = s.rankScore ?? s.score ?? 0;
    if (rank < rankScoreFloor) continue;

    const dayKey = localDayKeyFn
      ? localDayKeyFn(s.timestamp)
      : new Date(s.timestamp).toISOString().slice(0, 10);
    const existing = byDay.get(dayKey);
    if (!existing || compareSamples(s, existing.peak) < 0) {
      byDay.set(dayKey, {
        start: s.timestamp,
        end: s.timestamp,
        peak: s,
        samples: [s],
      });
    }
  }
  return byDay;
}

function pickTopDailyPeaks(samples, options = {}) {
  const {
    scoreFloor = 35,
    rankScoreFloor = 35,
    maxTotal = 15,
    maxPerDay = 1,
    windowPaddingMs = 5 * 60 * 1000,
    localDayKeyFn = null,
  } = options;

  let byDay = buildBestPeakPerDay(samples, { rankScoreFloor, localDayKeyFn });
  let relaxedFloor = false;

  if (byDay.size === 0 && samples.length > 0) {
    byDay = buildBestPeakPerDay(samples, { rankScoreFloor: 0, localDayKeyFn });
    relaxedFloor = true;
  }

  const windows = [...byDay.values()]
    .map((current) => {
      const w = finalizeWindow(current);
      w.peakRankScore =
        current.peak.rankScore ?? current.peak.evaluation?.rankScore ?? w.peakScore;
      w.peakNatalScore =
        current.peak.natalScore ?? current.peak.evaluation?.natalScore ?? null;
      w.startTime = new Date(w.peakTime.getTime() - windowPaddingMs);
      w.endTime = new Date(w.peakTime.getTime() + windowPaddingMs);
      w.relaxedScoreFloor = relaxedFloor;
      return w;
    })
    .sort((a, b) => {
      const ra = a.peakRankScore ?? a.peakScore;
      const rb = b.peakRankScore ?? b.peakScore;
      if (rb !== ra) return rb - ra;
      return (b.peakNatalScore ?? 0) - (a.peakNatalScore ?? 0);
    });

  let picked = pickWindowsWithDayCap(
    windows,
    maxPerDay,
    maxTotal,
    localDayKeyFn,
  );

  if (picked.length === 0 && samples.length > 0) {
    picked = buildTopSampleWindows(samples, {
      maxTotal,
      maxPerDay,
      windowPaddingMs,
      localDayKeyFn,
    });
  }

  return picked;
}

function pickWindowsWithDayCap(windows, maxPerDay, maxTotal, localDayKeyFn) {
  const picked = [];
  const dayCounts = new Map();
  for (const w of windows) {
    const peakMs = w.peakTime?.getTime?.() ?? new Date(w.peakTime).getTime();
    const dayKey = localDayKeyFn
      ? localDayKeyFn(peakMs)
      : new Date(peakMs).toISOString().slice(0, 10);
    const count = dayCounts.get(dayKey) || 0;
    if (count >= maxPerDay) continue;
    picked.push(w);
    dayCounts.set(dayKey, count + 1);
    if (picked.length >= maxTotal) break;
  }
  return picked;
}

/** Direct top-N samples when daily grouping produces no rows. */
function buildTopSampleWindows(samples, options = {}) {
  const {
    maxTotal = 15,
    maxPerDay = 1,
    windowPaddingMs = 5 * 60 * 1000,
    localDayKeyFn = null,
  } = options;

  const sorted = [...samples].sort((a, b) => compareSamples(a, b));
  const picked = [];
  const dayCounts = new Map();

  for (const s of sorted) {
    const dayKey = localDayKeyFn
      ? localDayKeyFn(s.timestamp)
      : new Date(s.timestamp).toISOString().slice(0, 10);
    const count = dayCounts.get(dayKey) || 0;
    if (count >= maxPerDay) continue;

    const w = finalizeWindow({
      start: s.timestamp,
      end: s.timestamp,
      peak: s,
      samples: [s],
    });
    w.startTime = new Date(s.timestamp - windowPaddingMs);
    w.endTime = new Date(s.timestamp + windowPaddingMs);
    w.fallbackPick = true;
    picked.push(w);
    dayCounts.set(dayKey, count + 1);
    if (picked.length >= maxTotal) break;
  }
  return picked;
}

function serializeElectionWindows(windows) {
  return windows.map((w) => ({
    startTime: new Date(w.startTime).toISOString(),
    endTime: new Date(w.endTime).toISOString(),
    peakTime: new Date(w.peakTime).toISOString(),
    peakScore: w.peakScore,
    peakGrade: w.peakGrade,
    peakEvaluation: w.peakEvaluation,
    sampleCount: w.sampleCount ?? 1,
    peakRankScore: w.peakRankScore,
    peakNatalScore: w.peakNatalScore,
    relaxedScoreFloor: w.relaxedScoreFloor,
    fallbackPick: w.fallbackPick,
  }));
}

module.exports = {
  mergeWindows,
  pickTopDailyPeaks,
  buildTopSampleWindows,
  serializeElectionWindows,
  sameLocalDay,
};
