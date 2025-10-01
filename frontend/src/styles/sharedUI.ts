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

  // Buttons
  primaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  secondaryButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  smallButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e6e6fa",
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

  // Categories container
  categoriesContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-between",
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
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
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
});
