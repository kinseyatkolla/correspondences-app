import { Platform, StyleSheet } from "react-native";

export const DRAW_CARD_WIDTH = 240;
export const DRAW_CARD_HEIGHT = 360;

/** Per-screen backdrop; shared layout lives in `drawCardsUI`. */
export const drawCardBackgrounds = {
  flower: "#0e2515",
  tarot: "#302B37",
} as const;

/** Stacking order — on web, skip elevation (RN Web maps it to huge box-shadows). */
export function cardStackStyle(zIndex: number) {
  return Platform.OS === "web"
    ? { zIndex }
    : { zIndex, elevation: zIndex };
}

export const drawCardsUI = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  searchNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  searchNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  searchNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  shuffleButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(230, 230, 250, 0.35)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 9999,
  },
  shuffleButtonText: {
    color: "#e6e6fa",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardsContainer: {
    flex: 1,
    position: "relative",
    width: "100%",
    marginTop: 50,
    marginBottom: 40,
  },
  card: {
    position: "absolute",
    width: DRAW_CARD_WIDTH,
    height: DRAW_CARD_HEIGHT,
    ...(Platform.OS === "web"
      ? ({
          // Shadow on the rotated outer wrapper — tracks the card on web.
          filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))",
        } as const)
      : null),
  },
  // Wrapper for drag handlers — needs explicit size on web (% height won't resolve).
  cardInner: {
    width: DRAW_CARD_WIDTH,
    height: DRAW_CARD_HEIGHT,
    cursor: "grab",
    userSelect: "none",
    ...(Platform.OS === "web"
      ? ({
          touchAction: "none",
          borderRadius: 12,
          overflow: "hidden",
        } as const)
      : null),
  } as const,
  cardTouchable: {
    width: DRAW_CARD_WIDTH,
    height: DRAW_CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? null
      : {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }),
  },
  cardImage: {
    width: DRAW_CARD_WIDTH,
    height: DRAW_CARD_HEIGHT,
    ...(Platform.OS === "web"
      ? ({
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        } as const)
      : null),
  },
});
