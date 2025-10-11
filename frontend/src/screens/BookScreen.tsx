// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// COMPONENT
// ============================================================================
export default function BookScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  // ===== EVENT HANDLERS =====
  const handleButtonPress = (section: string) => {
    (navigation as any).navigate(section);
  };

  const handleCategoryPress = (category: string) => {
    // Convert display name to category slug
    const categoryMap: { [key: string]: string } = {
      Numbers: "number",
      Colors: "color",
      Plants: "flowerEssence", // Assuming plants map to flower essences
      Planets: "planet",
      Metals: "metal",
      Aspects: "aspect",
      "Zodiac Signs": "zodiacSign",
      Houses: "house",
      Decans: "decan",
      "Moon Phases": "moon-phases", // Keep this as is for now
      Seasons: "season",
      Weekdays: "weekday",
      "Equinox & Solstices": "equinox-solstices", // Keep this as is for now
      Tarot: "tarotCard",
      Symbols: "symbol",
    };

    const categorySlug = categoryMap[category] || category.toLowerCase();

    // Navigate to BookEntriesScreen
    (navigation as any).navigate("BookEntries", {
      category: categorySlug,
      categoryDisplay: category,
    });
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to BookEntriesScreen with search query
      (navigation as any).navigate("BookEntries", {
        search: searchQuery.trim(),
        categoryDisplay: `Search: "${searchQuery.trim()}"`,
      });
      setSearchQuery(""); // Clear search after navigating
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // ===== RENDER HELPERS =====
  const renderCategorySection = (
    title: string,
    category: string,
    emoji: string,
    description: string
  ) => (
    <TouchableOpacity
      style={sharedUI.categoryCard}
      onPress={() => handleCategoryPress(category)}
    >
      <Text style={sharedUI.categoryEmoji}>{emoji}</Text>
      <Text style={sharedUI.categoryTitle}>{title}</Text>
      <Text style={sharedUI.categoryDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <View style={sharedUI.categoriesContainer}>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Numbers",
          "Numbers",
          "🔢",
          "Numerological correspondences"
        )}
        {renderCategorySection(
          "Colors",
          "Colors",
          "🎨",
          "Color symbolism & meaning"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Plants",
          "Plants",
          "🌿",
          "Botanical correspondences"
        )}
        {renderCategorySection(
          "Planets",
          "Planets",
          "🪐",
          "Planetary correspondences"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Metals",
          "Metals",
          "⚡",
          "Metallic correspondences"
        )}
        {renderCategorySection(
          "Aspects",
          "Aspects",
          "📐",
          "Astrological aspects"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Zodiac Signs",
          "Zodiac Signs",
          "♈",
          "Astrological signs"
        )}
        {renderCategorySection("Houses", "Houses", "🏠", "Astrological houses")}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection("Decans", "Decans", "🔗", "Zodiac decans")}
        {renderCategorySection(
          "Moon Phases",
          "Moon Phases",
          "🌙",
          "Lunar cycles"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Seasons",
          "Seasons",
          "🍂",
          "Seasonal correspondences"
        )}
        {renderCategorySection(
          "Weekdays",
          "Weekdays",
          "📅",
          "Days of the week"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Wheel of the Year",
          "Wheel of the Year",
          "☀️",
          "Solar events like Equinox & Solstices"
        )}
        {renderCategorySection("Tarot", "Tarot", "🃏", "Tarot correspondences")}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection("Symbols", "Symbols", "🔯", "Mystical symbols")}
      </View>
    </View>
  );

  // ===== MAIN TEMPLATE =====
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Section - Full height centered */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search correspondences..."
            placeholderTextColor="#8a8a8a"
            value={searchQuery}
            onChangeText={handleSearchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Text Links Section */}
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => handleButtonPress("Glossary")}>
          <Text style={styles.linkText}>GLOSSARY</Text>
        </TouchableOpacity>
        <Text style={styles.linkSeparator}>•</Text>
        <TouchableOpacity onPress={() => handleButtonPress("Bibliography")}>
          <Text style={styles.linkText}>BIBLIOGRAPHY</Text>
        </TouchableOpacity>
        <Text style={styles.linkSeparator}>•</Text>
        <TouchableOpacity onPress={() => handleButtonPress("Library")}>
          <Text style={styles.linkText}>LIBRARY</Text>
        </TouchableOpacity>
      </View>

      {renderCategories()}
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  searchSection: {
    minHeight: 500, // Creates the full-height effect for first view
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 60,
    paddingHorizontal: 25,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: "#333",
  },
  searchInput: {
    flex: 1,
    color: "#e6e6fa",
    fontSize: 13,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  searchButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  searchButtonText: {
    color: "#e6e6fa",
    fontSize: 20,
  },
  clearButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  clearButtonText: {
    color: "#8a8a8a",
    fontSize: 18,
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    flexWrap: "wrap",
  },
  linkText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
    paddingHorizontal: 15,
  },
  linkSeparator: {
    color: "#8a8a8a",
    fontSize: 14,
  },
});
