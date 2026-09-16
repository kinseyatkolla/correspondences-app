import { useWindowDimensions } from "react-native";

/** Live viewport size for layout math (cards, charts, etc.). */
export function useLayoutSize() {
  const { width, height } = useWindowDimensions();
  return { width, height };
}
