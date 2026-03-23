import { StyleSheet } from "react-native";

export const sharedUI = StyleSheet.create({
  // Page headers
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#e6e6fa",
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#b19cd9",
    marginBottom: 20,
    textAlign: "center",
  },

  // Buttons (primary: tarot deck selected purple; secondary: drawerMutedPanel grey)
  primaryButton: {
    backgroundColor: "#4a2c7a",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#6b4c9a",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    borderWidth: 1,
    borderColor: "#444",
  },
  secondaryButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
  },

  // Search components
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    padding: 15,
    color: "#e6e6fa",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  searchButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 3,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  clearButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Cards and items
  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
    textAlign: "center",
  },
  categoryDescription: {
    fontSize: 12,
    color: "#b19cd9",
    textAlign: "center",
    lineHeight: 16,
  },

  // List items
  listItem: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 15,
    marginBottom: 10,
    borderRadius: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#b19cd9",
    marginBottom: 4,
  },
  listItemKeywords: {
    fontSize: 12,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
  listItemEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  arrow: {
    fontSize: 24,
    color: "#8a8a8a",
  },

  // Footer
  listFooter: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#b19cd9",
    fontSize: 14,
  },

  // Results container
  resultsContainer: {
    marginTop: 20,
  },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // Will inherit from parent
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#b19cd9",
  },

  // Additional common styles
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
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
  modalCloseButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4a2c7a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 5,
  },
  modalCloseButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2d1b69",
  },
  modalListItem: {
    fontSize: 16,
    color: "#e6e6fa",
    marginBottom: 5,
    lineHeight: 22,
  },
  modalImageContainer: {
    width: "100%",
    marginBottom: 0,
  },
  modalCardImageContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  modalCardImage: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  modalFlowerImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
  },

  drawerContainer: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingBottom: 40,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  drawerOverlayLight: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerTitle: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
  },
  drawerTitleCompact: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  drawerCloseText: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  drawerCloseTextCompact: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
  },
  drawerContent: {
    padding: 20,
  },
  drawerSection: {
    marginBottom: 24,
  },
  drawerSectionText: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
  },
  drawerMutedPanel: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  drawerButton: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  drawerButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
  },
  drawerPrimaryButton: {
    backgroundColor: "#4a2c7a",
    borderColor: "#6b4c9a",
  },
  drawerPrimaryButtonText: { color: "#fff" },
  drawerButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
  },
  drawerButtonTextDisabled: { color: "#8a8a8a" },
  drawerNameLabel: {
    fontSize: 12,
    color: "#8a8a8a",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  drawerName: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "600",
    marginBottom: 4,
  },
  drawerSmallTitle: {
    fontSize: 12,
    color: "#8a8a8a",
    fontFamily: "monospace",
  },
});
