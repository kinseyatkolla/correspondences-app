const crypto = require("crypto");
const { searchElectionWindowsAsync } = require("./electionalService");
const { RISING_SIGN_RULES_BLURB } = require("../electional/risingSignAssessment");

const jobs = new Map();
const JOB_TTL_MS = 60 * 60 * 1000;

function pruneOldJobs() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

function buildSearchParams(body) {
  const {
    latitude,
    longitude,
    rangeDays,
    natalRooting,
    natal,
    timeFilter,
    calendarMonth = true,
    startYear,
    startMonth,
    startDay,
    utcOffsetMinutes,
  } = body;

  const now = new Date();
  const startDate = new Date(
    Date.UTC(
      startYear ?? now.getUTCFullYear(),
      (startMonth ?? now.getUTCMonth() + 1) - 1,
      startDay ?? 1,
      0,
      0,
      0,
    ),
  );

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
    startDate,
    rangeDays: rangeDays ? Number(rangeDays) : undefined,
    calendarMonth: calendarMonth !== false,
    natalRooting: natalRooting === true,
    natal,
    timeFilter,
    startYear,
    startMonth,
    utcOffsetMinutes:
      utcOffsetMinutes != null ? Number(utcOffsetMinutes) : undefined,
  };
}

function startElectionSearchJob(body) {
  pruneOldJobs();
  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    status: "pending",
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    error: null,
    data: null,
    progress: { processed: 0, totalSteps: 0, samplesFound: 0 },
  };
  jobs.set(jobId, job);

  (async () => {
    const current = jobs.get(jobId);
    if (!current) return;
    current.startedAt = Date.now();
    try {
      const params = buildSearchParams(body);
      const result = await searchElectionWindowsAsync(params, {
        yieldEvery: 3,
        onProgress: (p) => {
          const j = jobs.get(jobId);
          if (j) j.progress = p;
        },
        isCancelled: () => {
          const j = jobs.get(jobId);
          return !j || j.status === "cancelled";
        },
      });
      const j = jobs.get(jobId);
      if (!j || j.status === "cancelled") return;
      j.status = "complete";
      j.completedAt = Date.now();
      const samplesFound =
        j.progress?.samplesFound ?? result.candidatesCount ?? 0;
      j.data = {
        windows: result.windows ?? [],
        cached: result.cached,
        monthLabel: result.monthLabel,
        rangeDays: result.rangeDays,
        candidatesCount: result.candidatesCount ?? samplesFound,
        samplesFound,
        samplePlanMode: result.samplePlanMode ?? null,
        risingSignRulesBlurb: RISING_SIGN_RULES_BLURB,
      };
      if (j.data.windows.length === 0 && samplesFound > 0) {
        console.warn(
          `Election search job ${jobId}: ${samplesFound} candidates but 0 windows returned`,
        );
      }
    } catch (err) {
      const j = jobs.get(jobId);
      if (!j) return;
      j.status = "failed";
      j.completedAt = Date.now();
      j.error = err.message || "Search failed";
      console.error("Electional search job error:", err);
    }
  })();

  return { jobId, status: "pending" };
}

function getElectionSearchJob(jobId) {
  pruneOldJobs();
  const job = jobs.get(jobId);
  if (!job) return null;
  return {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
    progress: job.progress,
    data: job.status === "complete" ? job.data : null,
  };
}

module.exports = {
  startElectionSearchJob,
  getElectionSearchJob,
  buildSearchParams,
};
