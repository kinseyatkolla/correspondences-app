import { apiService, BirthData } from "../services/api";

/**
 * Find the exact timestamp when a planet crosses a sign boundary (ingress)
 * Uses binary search to find the exact moment between two samples
 */
export async function findExactIngressTime(
  planetName: string,
  targetSign: number, // 0-11, the sign the planet is entering
  prevTime: Date,
  currentTime: Date,
  prevLongitude: number,
  currentLongitude: number,
  latitude: number,
  longitude: number,
  toleranceMinutes: number = 1 // Stop when within 1 minute of exact time
): Promise<Date> {
  // The sign boundary is at targetSign * 30 degrees
  const targetBoundary = targetSign * 30;
  
  // Normalize longitudes to handle wrap-around (e.g., 359° to 1°)
  const normalizeLongitude = (lon: number): number => {
    // Adjust for wrap-around: if crossing from 359° to 1°, we need to handle it
    // If prevLongitude is close to 360 and currentLongitude is close to 0, 
    // the planet wrapped around
    if (prevLongitude > 330 && currentLongitude < 30) {
      // Planet wrapped around from Pisces to Aries
      if (targetSign === 0) {
        // We're looking for 0° (Aries ingress)
        return currentLongitude < targetBoundary ? currentLongitude + 360 : currentLongitude;
      }
    }
    return lon;
  };
  
  const normPrev = normalizeLongitude(prevLongitude);
  const normCurrent = normalizeLongitude(currentLongitude);
  
  // Binary search for exact time
  let low = prevTime.getTime();
  let high = currentTime.getTime();
  let bestTime = currentTime;
  let iterations = 0;
  const maxIterations = 20; // Prevent infinite loops
  
  while (high - low > toleranceMinutes * 60 * 1000 && iterations < maxIterations) {
    iterations++;
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(mid);
    
    try {
      // Get planetary position at midpoint
      const birthData: BirthData = {
        year: midTime.getUTCFullYear(),
        month: midTime.getUTCMonth() + 1,
        day: midTime.getUTCDate(),
        hour: midTime.getUTCHours(),
        minute: midTime.getUTCMinutes(),
        latitude,
        longitude,
      };
      
      const chartResponse = await apiService.getBirthChart(birthData);
      
      if (!chartResponse.success || !chartResponse.data?.planets?.[planetName]) {
        // If API call fails, use current time as fallback
        break;
      }
      
      const midLongitude = chartResponse.data.planets[planetName].longitude;
      const normMid = normalizeLongitude(midLongitude);
      
      // Check if we've crossed the boundary
      const prevBeforeBoundary = normPrev < targetBoundary;
      const midBeforeBoundary = normMid < targetBoundary;
      
      if (prevBeforeBoundary !== midBeforeBoundary) {
        // Boundary is between prev and mid
        high = mid;
        bestTime = midTime;
      } else {
        // Boundary is between mid and current
        low = mid;
      }
    } catch (error) {
      console.error(`Error finding exact ingress time: ${error}`);
      break;
    }
  }
  
  return bestTime;
}

/**
 * Find the exact timestamp when a planet's speed crosses zero (station)
 * Uses binary search to find the exact moment between two samples
 */
export async function findExactStationTime(
  planetName: string,
  prevTime: Date,
  currentTime: Date,
  prevSpeed: number,
  currentSpeed: number,
  latitude: number,
  longitude: number,
  toleranceMinutes: number = 1
): Promise<Date> {
  // Binary search for exact time when speed = 0
  let low = prevTime.getTime();
  let high = currentTime.getTime();
  let bestTime = currentTime;
  let iterations = 0;
  const maxIterations = 20;
  
  while (high - low > toleranceMinutes * 60 * 1000 && iterations < maxIterations) {
    iterations++;
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(mid);
    
    try {
      const birthData: BirthData = {
        year: midTime.getUTCFullYear(),
        month: midTime.getUTCMonth() + 1,
        day: midTime.getUTCDate(),
        hour: midTime.getUTCHours(),
        minute: midTime.getUTCMinutes(),
        latitude,
        longitude,
      };
      
      const chartResponse = await apiService.getBirthChart(birthData);
      
      if (!chartResponse.success || !chartResponse.data?.planets?.[planetName]) {
        break;
      }
      
      const midSpeed = chartResponse.data.planets[planetName].speed;
      
      // Check if speed has crossed zero
      const prevSign = Math.sign(prevSpeed);
      const midSign = Math.sign(midSpeed);
      
      if (prevSign !== midSign) {
        // Zero crossing is between prev and mid
        high = mid;
        bestTime = midTime;
      } else {
        // Zero crossing is between mid and current
        low = mid;
      }
    } catch (error) {
      console.error(`Error finding exact station time: ${error}`);
      break;
    }
  }
  
  return bestTime;
}

/**
 * Find the exact timestamp when an aspect becomes exact
 * Uses binary search to find the exact moment between two samples
 */
export async function findExactAspectTime(
  planet1Name: string,
  planet2Name: string,
  aspectAngle: number, // The target angle for the aspect (0, 60, 90, 120, 180)
  prevTime: Date,
  currentTime: Date,
  prevAngle: number,
  currentAngle: number,
  latitude: number,
  longitude: number,
  toleranceMinutes: number = 1
): Promise<Date> {
  // Calculate angular distance (shortest distance on circle)
  const getAngularDistance = (angle: number): number => {
    const diff = Math.abs(angle - aspectAngle);
    return Math.min(diff, 360 - diff);
  };
  
  // Binary search for exact time
  let low = prevTime.getTime();
  let high = currentTime.getTime();
  let bestTime = currentTime;
  let bestDistance = getAngularDistance(currentAngle);
  let iterations = 0;
  const maxIterations = 20;
  
  while (high - low > toleranceMinutes * 60 * 1000 && iterations < maxIterations) {
    iterations++;
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(mid);
    
    try {
      const birthData: BirthData = {
        year: midTime.getUTCFullYear(),
        month: midTime.getUTCMonth() + 1,
        day: midTime.getUTCDate(),
        hour: midTime.getUTCHours(),
        minute: midTime.getUTCMinutes(),
        latitude,
        longitude,
      };
      
      const chartResponse = await apiService.getBirthChart(birthData);
      
      if (!chartResponse.success || 
          !chartResponse.data?.planets?.[planet1Name] ||
          !chartResponse.data?.planets?.[planet2Name]) {
        break;
      }
      
      const planet1 = chartResponse.data.planets[planet1Name];
      const planet2 = chartResponse.data.planets[planet2Name];
      
      // Calculate angular distance between planets
      const diff = Math.abs(planet1.longitude - planet2.longitude);
      const midAngle = Math.min(diff, 360 - diff);
      const midDistance = getAngularDistance(midAngle);
      
      if (midDistance < bestDistance) {
        bestDistance = midDistance;
        bestTime = midTime;
      }
      
      // Determine which side of the target we're on
      const prevDistance = getAngularDistance(prevAngle);
      const currentDistance = getAngularDistance(currentAngle);
      
      if (prevDistance > currentDistance) {
        // Getting closer, target is between mid and current
        low = mid;
      } else {
        // Getting farther or already past, target is between prev and mid
        high = mid;
      }
    } catch (error) {
      console.error(`Error finding exact aspect time: ${error}`);
      break;
    }
  }
  
  return bestTime;
}

