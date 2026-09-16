import { Accelerometer } from "expo-sensors";
import { isWeb } from "./platformUtils";

type ShakeHandler = (event: { x: number; y: number; z: number }) => void;

/** Subscribe to device shake; no-op on web (use a shuffle button instead). */
export function setupShakeListener(
  onShake: ShakeHandler,
  options?: { threshold?: number; timeoutMs?: number; updateIntervalMs?: number },
): () => void {
  if (isWeb) {
    return () => {};
  }

  const threshold = options?.threshold ?? 2.5;
  const timeoutMs = options?.timeoutMs ?? 3000;
  const updateIntervalMs = options?.updateIntervalMs ?? 200;
  let lastShake = 0;

  const handleReading: ShakeHandler = (event) => {
    const acceleration = Math.sqrt(
      event.x * event.x + event.y * event.y + event.z * event.z,
    );
    const now = Date.now();
    if (acceleration > threshold && now - lastShake > timeoutMs) {
      lastShake = now;
      onShake(event);
    }
  };

  Accelerometer.setUpdateInterval(updateIntervalMs);
  const subscription = Accelerometer.addListener(handleReading);

  return () => {
    subscription?.remove();
  };
}
