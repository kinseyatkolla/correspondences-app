import { isWeb } from "../utils/platformUtils";

/** Deployed API used by web builds and as the default for all platforms. */
const PRODUCTION_API_BASE_URL =
  "https://correspondences-app-production.up.railway.app/api";

/**
 * Set in `frontend/.env` as EXPO_PUBLIC_API_URL (see `.env.example`).
 * When unset, production is used so the app works without a local backend.
 */
const envUrl =
  typeof process !== "undefined"
    ? process.env.EXPO_PUBLIC_API_URL?.trim()
    : undefined;

/** True when URL points at a private LAN host (often wrong for Expo web). */
export function isLanApiUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  } catch {
    return false;
  }
}

function resolveApiBaseUrl(): string {
  if (!envUrl) return PRODUCTION_API_BASE_URL;

  const forceLan =
    typeof process !== "undefined" &&
    process.env.EXPO_PUBLIC_FORCE_LAN_API === "true";

  if (isWeb && !forceLan && isLanApiUrl(envUrl)) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn(
        `[api] EXPO_PUBLIC_API_URL is LAN (${envUrl}); using production on web. ` +
          "Use http://localhost:3000/api for local backend on web, or set EXPO_PUBLIC_FORCE_LAN_API=true.",
      );
    }
    return PRODUCTION_API_BASE_URL;
  }

  return envUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
