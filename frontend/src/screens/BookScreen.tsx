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
import { apiService, BookOfShadowsEntry, LibraryItem } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// COMPONENT
// ============================================================================
export default function BookScreen() {
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
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

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

  const loadLibraryItems = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const response = await apiService.getLibraryItems();
      console.log(`Loaded ${response.data.length} library items`);
      setLibraryItems(response.data);
    } catch (error) {
      console.error("Error loading library items:", error);
      Alert.alert("Error", "Failed to load library items");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // ===== EVENT HANDLERS =====
  const handleButtonPress = (section: string) => {
    switch (section) {
      case "Library":
        loadLibraryItems();
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
      Numbers: "numbers",
      Colors: "colors",
      Plants: "plants",
      Planets: "planets",
      Metals: "metals",
      Aspects: "aspects",
      "Zodiac Signs": "zodiac-signs",
      Houses: "houses",
      Decans: "decans",
      "Moon Phases": "moon-phases",
      Seasons: "seasons",
      Weekdays: "weekdays",
      "Equinox & Solstices": "equinox-solstices",
      Tarot: "tarot",
      Symbols: "symbols",
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

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case "book":
        return "📖";
      case "videolink":
        return "🎥";
      case "audiolink":
        return "🎧";
      case "article":
        return "📄";
      case "website":
        return "🌐";
      default:
        return "📚";
    }
  };

  const renderLibraryItems = (mediaType: string, title: string) => {
    const items = libraryItems.filter((item) => item.mediaType === mediaType);
    if (items.length === 0) return null;

    return (
      <View style={overlayStyles.section}>
        <Text style={overlayStyles.sectionTitle}>{title}</Text>
        {items.map((item) => (
          <View key={item._id} style={styles.resourceItem}>
            <Text style={styles.resourceTitle}>
              {getMediaTypeIcon(item.mediaType)} {item.name}
            </Text>
            <Text style={styles.resourceAuthor}>
              {item.author && `by ${item.author}`}
              {item.year && ` (${item.year})`}
            </Text>
            {item.description && (
              <Text style={styles.resourceDescription}>{item.description}</Text>
            )}
            {item.sourceUrl && (
              <Text style={styles.resourceUrl}>🔗 {item.sourceUrl}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

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
                    <Text style={overlayStyles.modalSubtitle}>
                      {selectedEntry.category}
                    </Text>
                    <TouchableOpacity
                      style={overlayStyles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={overlayStyles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={overlayStyles.section}>
                    <Text style={overlayStyles.sectionTitle}>Description</Text>
                    <Text style={overlayStyles.sectionText}>
                      {selectedEntry.description}
                    </Text>
                  </View>

                  {selectedEntry.content && (
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

                  {selectedEntry.correspondences &&
                    selectedEntry.correspondences.length > 0 && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>
                          Correspondences
                        </Text>
                        {selectedEntry.correspondences.map(
                          (correspondence, index) => (
                            <Text key={index} style={overlayStyles.listItem}>
                              • {correspondence}
                            </Text>
                          )
                        )}
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

      {/* Library Modal */}
      <Modal
        visible={libraryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={sharedUI.backButton}
              onPress={() => setLibraryModalVisible(false)}
            >
              <Text style={sharedUI.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📚 Library</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.fullScreenModalScroll}>
            {libraryLoading ? (
              <View style={sharedUI.loadingContainer}>
                <ActivityIndicator size="large" color="#b19cd9" />
                <Text style={sharedUI.loadingText}>Loading Library...</Text>
              </View>
            ) : (
              <>
                {renderLibraryItems("book", "📖 Books")}
                {renderLibraryItems("videolink", "🎥 Video Lessons")}
                {renderLibraryItems("audiolink", "🎧 Audio Resources")}
                {renderLibraryItems("article", "📄 Articles")}
                {renderLibraryItems("website", "🌐 Websites")}
                {renderLibraryItems("other", "📚 Other Resources")}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Bibliography Modal */}
      <Modal
        visible={bibliographyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={sharedUI.backButton}
              onPress={() => setBibliographyModalVisible(false)}
            >
              <Text style={sharedUI.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📖 Bibliography</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.fullScreenModalScroll}>
            <View style={overlayStyles.section}>
              <Text style={overlayStyles.sectionTitle}>Primary Sources</Text>
              <Text style={styles.bibliographyItem}>
                Cunningham, Scott.{" "}
                <Text style={styles.bibliographyTitle}>
                  Cunningham's Encyclopedia of Magical Herbs
                </Text>
                . Llewellyn Publications, 1985.
              </Text>
              <Text style={styles.bibliographyItem}>
                Kynes, Sandra.{" "}
                <Text style={styles.bibliographyTitle}>
                  The Complete Book of Correspondences
                </Text>
                . Llewellyn Publications, 2003.
              </Text>
              <Text style={styles.bibliographyItem}>
                Greer, Mary K.{" "}
                <Text style={styles.bibliographyTitle}>
                  Tarot for Your Self
                </Text>
                . New Page Books, 2002.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={overlayStyles.sectionTitle}>Historical Sources</Text>
              <Text style={styles.bibliographyItem}>
                Agrippa, Heinrich Cornelius.{" "}
                <Text style={styles.bibliographyTitle}>
                  Three Books of Occult Philosophy
                </Text>
                . Translated by James Freake, 1651.
              </Text>
              <Text style={styles.bibliographyItem}>
                Barrett, Francis.{" "}
                <Text style={styles.bibliographyTitle}>The Magus</Text>. 1801.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={overlayStyles.sectionTitle}>Modern References</Text>
              <Text style={styles.bibliographyItem}>
                Conway, D.J.{" "}
                <Text style={styles.bibliographyTitle}>
                  Crystal Enchantments
                </Text>
                . Llewellyn Publications, 1999.
              </Text>
              <Text style={styles.bibliographyItem}>
                Morrison, Dorothy.{" "}
                <Text style={styles.bibliographyTitle}>Everyday Magic</Text>.
                Llewellyn Publications, 1998.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Glossary Modal */}
      <Modal
        visible={glossaryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={sharedUI.backButton}
              onPress={() => setGlossaryModalVisible(false)}
            >
              <Text style={sharedUI.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📚 Glossary</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.fullScreenModalScroll}>
            <View style={overlayStyles.section}>
              <Text style={styles.glossaryTerm}>Correspondence</Text>
              <Text style={styles.glossaryDefinition}>
                A symbolic relationship between different elements in magic,
                such as colors, herbs, crystals, and planets. These connections
                are used to enhance magical workings.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={styles.glossaryTerm}>Elemental</Text>
              <Text style={styles.glossaryDefinition}>
                Relating to the four classical elements: Earth, Air, Fire, and
                Water. Each element has specific correspondences and magical
                properties.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={styles.glossaryTerm}>Ephemeris</Text>
              <Text style={styles.glossaryDefinition}>
                A table showing the positions of celestial bodies at specific
                times. Used in astrology and magical timing.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={styles.glossaryTerm}>Natal Chart</Text>
              <Text style={styles.glossaryDefinition}>
                An astrological chart showing the positions of planets at the
                time and place of birth. Also called a birth chart.
              </Text>
            </View>

            <View style={overlayStyles.section}>
              <Text style={styles.glossaryTerm}>Physis</Text>
              <Text style={styles.glossaryDefinition}>
                A custom font containing astrological and magical symbols used
                throughout this application for enhanced visual representation.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 60, // Same width as back button to center the title
  },
  // Full-screen modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#111",
  },
  fullScreenModalScroll: {
    flex: 1,
    padding: 20,
  },
  // Resource item styles for Library
  resourceItem: {
    backgroundColor: "#222",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  resourceAuthor: {
    fontSize: 14,
    color: "#b19cd9",
    marginBottom: 10,
    fontStyle: "italic",
  },
  resourceDescription: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
  },
  resourceUrl: {
    fontSize: 12,
    color: "#b19cd9",
    marginTop: 5,
    fontStyle: "italic",
  },
  // Bibliography styles
  bibliographyItem: {
    fontSize: 14,
    color: "#e6e6fa",
    marginBottom: 15,
    lineHeight: 20,
  },
  bibliographyTitle: {
    fontWeight: "bold",
    color: "#b19cd9",
  },
  // Glossary styles
  glossaryTerm: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 8,
  },
  glossaryDefinition: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
    marginBottom: 20,
  },
});
