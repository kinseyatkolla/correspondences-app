import * as Location from "expo-location";
import { isWeb } from "./platformUtils";

export type GeoCoords = {
  latitude: number;
  longitude: number;
};

const DEFAULT_LOCATION: GeoCoords = {
  latitude: 40.7128,
  longitude: -74.006,
};

function getBrowserLocation(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

/** Current device coordinates; uses browser API on web and expo-location on native. */
export async function getCurrentCoordinates(): Promise<GeoCoords> {
  if (isWeb) {
    try {
      return await getBrowserLocation();
    } catch (error) {
      console.error("Browser geolocation error:", error);
      return DEFAULT_LOCATION;
    }
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Native geolocation error:", error);
    return DEFAULT_LOCATION;
  }
}

/** Human-readable place name for coordinates. */
export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number,
): Promise<string> {
  if (isWeb) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return "";
      const data = await response.json();
      return (
        data.display_name ||
        [data.address?.city, data.address?.state, data.address?.country]
          .filter(Boolean)
          .join(", ")
      );
    } catch (error) {
      console.error("Web reverse geocode error:", error);
      return "";
    }
  }

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    if (!addresses?.length) return "";
    const address = addresses[0];
    const parts: string[] = [];
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    if (address.country) parts.push(address.country);
    return parts.join(", ");
  } catch (error) {
    console.error("Native reverse geocode error:", error);
    return "";
  }
}

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  label?: string;
};

/** Search for a place by name; Nominatim on web, expo-location on native. */
export async function geocodeQuery(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (isWeb) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data as Array<{ lat: string; lon: string; display_name?: string }>).map(
        (item) => ({
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          label: item.display_name,
        }),
      );
    } catch (error) {
      console.error("Web geocode error:", error);
      return [];
    }
  }

  try {
    const results = await Location.geocodeAsync(trimmed);
    return results.map((result) => ({
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  } catch (error) {
    console.error("Native geocode error:", error);
    return [];
  }
}

export { DEFAULT_LOCATION };
