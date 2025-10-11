// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  apiService,
  BookOfShadowsEntry,
  BookOfShadowsCorrespondence,
} from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";
import LibraryScreen from "./LibraryScreen";
import BibliographyScreen from "./BibliographyScreen";
import GlossaryScreen from "./GlossaryScreen";
import WikipediaSection from "../components/WikipediaSection";

// ============================================================================
// COMPONENT
// ============================================================================
export default function BookScreen() {
  const navigation = useNavigation();
  const [bosEntries, setBosEntries] = useState<BookOfShadowsEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BookOfShadowsEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<BookOfShadowsEntry | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [libraryModalVisible, setLibraryModalVisible] = useState(false);
  const [bibliographyModalVisible, setBibliographyModalVisible] =
    useState(false);
  const [glossaryModalVisible, setGlossaryModalVisible] = useState(false);
  const [loadingCorrespondence, setLoadingCorrespondence] = useState(false);

  // ===== LIFECYCLE =====
  useEffect(() => {
    loadBosEntries();
  }, []);

  // ===== API FUNCTIONS =====
  const loadBosEntries = useCallback(async (search = "", category = "") => {
    try {
      setLoading(true);
      const response = await apiService.getBookOfShadowsEntries(
        search,
        category
      );
      console.log(`Loaded ${response.data.length} BOS entries`);
      if (search || category) {
        setFilteredEntries(response.data);
      } else {
        setBosEntries(response.data);
        setFilteredEntries([]);
      }
    } catch (error) {
      console.error("Error loading BOS entries:", error);
      Alert.alert("Error", "Failed to load BOS entries");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== EVENT HANDLERS =====
  const handleButtonPress = (section: string) => {
    switch (section) {
      case "Library":
        setLibraryModalVisible(true);
        break;
      case "Bibliography":
        setBibliographyModalVisible(true);
        break;
      case "Glossary":
        setGlossaryModalVisible(true);
        break;
      default:
        console.log(`Pressed: ${section}`);
    }
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
    setSelectedCategory(categorySlug);
    setSearchQuery("");
    loadBosEntries("", categorySlug);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setFilteredEntries([]);
  };

  const handleEntryPress = (entry: BookOfShadowsEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedCategory(null);
      loadBosEntries(searchQuery.trim());
    } else {
      setFilteredEntries([]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredEntries([]);
    setSelectedCategory(null);
  };

  const handleCorrespondencePress = async (correspondenceName: string) => {
    try {
      setLoadingCorrespondence(true);
      const response = await apiService.getBookOfShadowsEntries(
        correspondenceName
      );
      if (response.data && response.data.length > 0) {
        // Find exact match first, otherwise use first result
        const match =
          response.data.find(
            (entry) =>
              entry.name.toLowerCase() === correspondenceName.toLowerCase()
          ) || response.data[0];
        setSelectedEntry(match);
      } else {
        Alert.alert("Not Found", `No entry found for "${correspondenceName}"`);
      }
    } catch (error) {
      console.error("Error loading correspondence:", error);
      Alert.alert("Error", "Failed to load correspondence entry");
    } finally {
      setLoadingCorrespondence(false);
    }
  };

  const handleViewInTarot = () => {
    if (selectedEntry) {
      setModalVisible(false);
      // Navigate to Tarot tab and specifically to the TarotList screen
      (navigation as any).navigate("Tarot", {
        screen: "TarotList",
        params: { searchQuery: selectedEntry.name },
      });
    }
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

  const renderFooter = () => (
    <View style={sharedUI.listFooter}>
      <Text style={sharedUI.footerText}>
        Showing {filteredEntries.length} entries
      </Text>
    </View>
  );

  // ===== LOADING STATES =====
  if (loading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#111" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading Book of Shadows...</Text>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={sharedUI.pageTitle}>📖 Book of Shadows</Text>
      <Text style={sharedUI.pageSubtitle}>
        Discover the correspondences of the occult
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={sharedUI.smallButton}
          onPress={() => handleButtonPress("Glossary")}
        >
          <Text style={sharedUI.smallButtonText}>📚 Glossary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={sharedUI.smallButton}
          onPress={() => handleButtonPress("Bibliography")}
        >
          <Text style={sharedUI.smallButtonText}>📖 Bibliography</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={sharedUI.smallButton}
          onPress={() => handleButtonPress("Library")}
        >
          <Text style={sharedUI.smallButtonText}>🏛️ Library</Text>
        </TouchableOpacity>
      </View>

      <View style={sharedUI.searchContainer}>
        <TextInput
          style={sharedUI.searchInput}
          placeholder="Search correspondences..."
          placeholderTextColor="#8a8a8a"
          value={searchQuery}
          onChangeText={handleSearchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={sharedUI.searchButton} onPress={handleSearch}>
          <Text style={sharedUI.searchButtonText}>🔍</Text>
        </TouchableOpacity>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={sharedUI.clearButton}
            onPress={handleClearSearch}
          >
            <Text style={sharedUI.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedCategory && (
        <TouchableOpacity
          style={sharedUI.backButton}
          onPress={handleBackToCategories}
        >
          <Text style={sharedUI.backButtonText}>← Back to Categories</Text>
        </TouchableOpacity>
      )}

      {filteredEntries.length > 0 && (
        <View style={sharedUI.resultsContainer}>
          {filteredEntries.map((entry) => (
            <TouchableOpacity
              key={entry._id}
              style={sharedUI.listItem}
              onPress={() => handleEntryPress(entry)}
            >
              <View style={sharedUI.listItemContent}>
                <Text style={sharedUI.listItemTitle}>{entry.name}</Text>
                <Text style={sharedUI.listItemSubtitle}>{entry.category}</Text>
                {entry.keywords && entry.keywords.length > 0 && (
                  <Text style={sharedUI.listItemKeywords}>
                    {entry.keywords.slice(0, 3).join(" • ")}
                  </Text>
                )}
              </View>
              <Text style={sharedUI.arrow}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={sharedUI.listFooter}>
            <Text style={sharedUI.footerText}>
              Showing {filteredEntries.length} entries
            </Text>
          </View>
        </View>
      )}

      {renderCategories()}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={overlayStyles.modalOverlay}>
          <View style={overlayStyles.modalContent}>
            <ScrollView style={overlayStyles.modalScroll}>
              {selectedEntry && (
                <>
                  <View style={overlayStyles.modalHeader}>
                    <Text style={overlayStyles.modalTitle}>
                      {selectedEntry.name}
                    </Text>
                    <TouchableOpacity
                      style={overlayStyles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={overlayStyles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Only show description if it exists and is not empty */}
                  {selectedEntry.description &&
                    selectedEntry.description.trim() !== "" && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>
                          Description
                        </Text>
                        <Text style={overlayStyles.sectionText}>
                          {selectedEntry.description}
                        </Text>
                      </View>
                    )}

                  {/* Show link to Tarot if this is a tarot card */}
                  {selectedEntry.category === "tarotCard" && (
                    <View style={overlayStyles.section}>
                      <TouchableOpacity
                        style={styles.tarotLinkButton}
                        onPress={handleViewInTarot}
                      >
                        <Text style={styles.tarotLinkText}>
                          🃏 View in Tarot Collection
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedEntry.wikiName !== null &&
                    selectedEntry.wikiName !== "null" && (
                      <WikipediaSection
                        searchTerm={selectedEntry.name}
                        wikiName={selectedEntry.wikiName}
                      />
                    )}

                  {selectedEntry.correspondences &&
                    selectedEntry.correspondences.length > 0 && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>
                          Correspondences & Associations
                        </Text>
                        {loadingCorrespondence && (
                          <ActivityIndicator
                            size="small"
                            color="#b19cd9"
                            style={{ marginVertical: 10 }}
                          />
                        )}
                        {selectedEntry.correspondences.map(
                          (correspondence, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() =>
                                handleCorrespondencePress(correspondence.name)
                              }
                              style={styles.correspondenceItem}
                            >
                              <Text style={styles.correspondenceText}>
                                • {correspondence.name} ({correspondence.type})
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    )}

                  {/* Only show content/details if it exists and is not the default pattern */}
                  {selectedEntry.content &&
                    selectedEntry.content.trim() !== "" &&
                    !selectedEntry.content.match(
                      /^Correspondences and associations for .+$/i
                    ) && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>Details</Text>
                        <Text style={overlayStyles.sectionText}>
                          {selectedEntry.content}
                        </Text>
                      </View>
                    )}

                  {selectedEntry.keywords &&
                    selectedEntry.keywords.length > 0 && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>Keywords</Text>
                        {selectedEntry.keywords.map((keyword, index) => (
                          <Text key={index} style={overlayStyles.listItem}>
                            • {keyword}
                          </Text>
                        ))}
                      </View>
                    )}

                  {selectedEntry.references &&
                    selectedEntry.references.length > 0 && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>
                          Related Entries
                        </Text>
                        {selectedEntry.references.map((reference, index) => (
                          <Text key={index} style={overlayStyles.listItem}>
                            • {reference.name}
                          </Text>
                        ))}
                      </View>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Library Screen */}
      <LibraryScreen
        visible={libraryModalVisible}
        onClose={() => setLibraryModalVisible(false)}
      />

      {/* Bibliography Screen */}
      <BibliographyScreen
        visible={bibliographyModalVisible}
        onClose={() => setBibliographyModalVisible(false)}
      />

      {/* Glossary Screen */}
      <GlossaryScreen
        visible={glossaryModalVisible}
        onClose={() => setGlossaryModalVisible(false)}
      />
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
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  tarotLinkButton: {
    backgroundColor: "#b19cd9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  tarotLinkText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  correspondenceItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  correspondenceText: {
    color: "#b19cd9",
    fontSize: 15,
    lineHeight: 22,
    textDecorationLine: "underline",
  },
});
