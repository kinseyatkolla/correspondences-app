/** Display helpers for zodiacal releasing (matches backend 360-day year). */

export const ZR_YEAR_LENGTH_DAYS = 360;

const DAY_MS = 24 * 60 * 60 * 1000;

export const PERIOD_SWITCH_COUNTDOWN_MS = 7 * DAY_MS;

export const SIGN_MINOR_YEARS: Record<string, number> = {
  Aries: 15,
  Taurus: 8,
  Gemini: 20,
  Cancer: 25,
  Leo: 19,
  Virgo: 20,
  Libra: 8,
  Scorpio: 15,
  Sagittarius: 12,
  Capricorn: 27,
  Aquarius: 30,
  Pisces: 12,
};

const RULER_SYMBOL: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
};

/** Releasing age (whole years) at an instant, using 360-day years from birth. */
export function releasingAgeAtMs(birthMs: number, atMs: number): number {
  if (atMs <= birthMs) return 0;
  const yearMs = ZR_YEAR_LENGTH_DAYS * DAY_MS;
  return Math.floor((atMs - birthMs) / yearMs);
}

export function formatReleasingDate(
  ms: number,
  timeZone: string,
  includeTime = false,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).formatToParts(new Date(ms));
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const base = `${get("year")}, ${get("month")} ${get("day")}`;
  if (!includeTime) return base;
  return `${base}, ${get("hour")}:${get("minute")}`;
}

export function formatRulerLabel(ruler: string): string {
  const key = ruler.toLowerCase();
  const sym = RULER_SYMBOL[key];
  const name = key.charAt(0).toUpperCase() + key.slice(1);
  return sym ? `${sym} ${name}` : name;
}

export function periodStatusSuffix(p: {
  isPreLoosingOfBond?: boolean;
  isLoosingOfBond?: boolean;
  isCulminatingFromFortune?: boolean;
}): string {
  const tags: string[] = [];
  if (p.isPreLoosingOfBond) tags.push("Pre LB");
  if (p.isLoosingOfBond) tags.push("LB");
  if (p.isCulminatingFromFortune) tags.push("Culm.");
  return tags.length ? ` — ${tags.join(" ")}` : "";
}

export function isWithinSwitchCountdownWindow(
  periodEndMs: number,
  nowMs: number = Date.now(),
): boolean {
  const remaining = periodEndMs - nowMs;
  return remaining > 0 && remaining <= PERIOD_SWITCH_COUNTDOWN_MS;
}

/** Human-readable countdown until period end (next sign). */
export function formatSwitchCountdown(
  periodEndMs: number,
  nowMs: number = Date.now(),
): string {
  const ms = Math.max(0, periodEndMs - nowMs);
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad2 = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${hours}h ${pad2(minutes)}m`;
  return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
}
