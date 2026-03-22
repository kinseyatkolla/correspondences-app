import { Dimensions, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Per-screen backdrop; shared layout lives in `drawCardsUI`. */
export const drawCardBackgrounds = {
  flower: "#0e2515",
  tarot: "#302B37",
} as const;

export const drawCardsUI = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backGestureArea: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 9999,
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    marginTop: 50,
    marginBottom: 0,
  },
  card: {
    position: "absolute",
    width: 240,
    height: 360,
  },
  cardTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
