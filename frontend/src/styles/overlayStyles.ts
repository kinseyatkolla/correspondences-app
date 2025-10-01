import { StyleSheet } from "react-native";

export const overlayStyles = StyleSheet.create({
  // Modal overlay styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#4a2c7a",
  },
  modalScroll: {
    maxHeight: "100%",
  },
  modalHeader: {
    padding: 20,
    position: "relative",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#b19cd9",
    fontStyle: "italic",
    marginBottom: 5,
  },
  modalElement: {
    fontSize: 14,
    color: "#8a8a8a",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4a2c7a",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Section styles
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2d1b69",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b19cd9",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: "#e6e6fa",
    lineHeight: 24,
  },
  listItem: {
    fontSize: 16,
    color: "#e6e6fa",
    marginBottom: 5,
    lineHeight: 22,
  },
  // Image container styles
  imageContainer: {
    width: "100%",
    marginBottom: 0,
  },
  cardImageContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cardImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  flowerImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
  },
});
