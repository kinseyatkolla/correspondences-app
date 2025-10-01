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
import { apiService, BookOfShadowsEntry } from "../services/api";

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

  useEffect(() => {
    loadBosEntries();
  }, []);

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

  const renderCategorySection = (
    title: string,
    category: string,
    emoji: string,
    description: string
  ) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category)}
    >
      <Text style={styles.categoryEmoji}>{emoji}</Text>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categoryDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <View style={styles.categoryRow}>
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
      <View style={styles.categoryRow}>
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
      <View style={styles.categoryRow}>
        {renderCategorySection(
          "Metals",
          "Metals",
          "⚡",
          "Metallic correspondences"
        )}
        {renderCategorySection(
          "Aspects",
          "Aspects",
          "🔗",
          "Astrological aspects"
        )}
      </View>
      <View style={styles.categoryRow}>
        {renderCategorySection(
          "Zodiac Signs",
          "Zodiac Signs",
          "♈",
          "Astrological signs"
        )}
        {renderCategorySection("Houses", "Houses", "🏠", "Astrological houses")}
      </View>
      <View style={styles.categoryRow}>
        {renderCategorySection("Decans", "Decans", "📐", "Zodiac decans")}
        {renderCategorySection(
          "Moon Phases",
          "Moon Phases",
          "🌙",
          "Lunar cycles"
        )}
      </View>
      <View style={styles.categoryRow}>
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
      <View style={styles.categoryRow}>
        {renderCategorySection(
          "Equinox & Solstices",
          "Equinox & Solstices",
          "☀️",
          "Solar events"
        )}
        {renderCategorySection("Tarot", "Tarot", "🃏", "Tarot correspondences")}
      </View>
      <View style={styles.categoryRow}>
        {renderCategorySection("Symbols", "Symbols", "🔯", "Mystical symbols")}
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.listFooter}>
      <Text style={styles.footerText}>
        Showing {filteredEntries.length} entries
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={styles.loadingText}>Loading Book of Shadows...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>📖 Book of Shadows</Text>
      <Text style={styles.subtitle}>
        Discover the correspondences of the occult
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handleButtonPress("Glossary")}
        >
          <Text style={styles.smallButtonText}>📚 Glossary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handleButtonPress("Bibliography")}
        >
          <Text style={styles.smallButtonText}>📖 Bibliography</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handleButtonPress("Library")}
        >
          <Text style={styles.smallButtonText}>🏛️ Library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search correspondences..."
          placeholderTextColor="#8a8a8a"
          value={searchQuery}
          onChangeText={handleSearchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedCategory && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToCategories}
        >
          <Text style={styles.backButtonText}>← Back to Categories</Text>
        </TouchableOpacity>
      )}

      {filteredEntries.length > 0 && (
        <View style={styles.resultsContainer}>
          {filteredEntries.map((entry) => (
            <TouchableOpacity
              key={entry._id}
              style={styles.entryItem}
              onPress={() => handleEntryPress(entry)}
            >
              <View style={styles.entryContent}>
                <Text style={styles.entryName}>{entry.name}</Text>
                <Text style={styles.entryCategory}>{entry.category}</Text>
                {entry.keywords && entry.keywords.length > 0 && (
                  <Text style={styles.entryKeywords}>
                    {entry.keywords.slice(0, 3).join(" • ")}
                  </Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.listFooter}>
            <Text style={styles.footerText}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              {selectedEntry && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedEntry.name}</Text>
                    <Text style={styles.modalCategory}>
                      {selectedEntry.category}
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.sectionText}>
                      {selectedEntry.description}
                    </Text>
                  </View>

                  {selectedEntry.content && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Details</Text>
                      <Text style={styles.sectionText}>
                        {selectedEntry.content}
                      </Text>
                    </View>
                  )}

                  {selectedEntry.keywords &&
                    selectedEntry.keywords.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Keywords</Text>
                        {selectedEntry.keywords.map((keyword, index) => (
                          <Text key={index} style={styles.listItem}>
                            • {keyword}
                          </Text>
                        ))}
                      </View>
                    )}

                  {selectedEntry.correspondences &&
                    selectedEntry.correspondences.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Correspondences</Text>
                        {selectedEntry.correspondences.map(
                          (correspondence, index) => (
                            <Text key={index} style={styles.listItem}>
                              • {correspondence}
                            </Text>
                          )
                        )}
                      </View>
                    )}

                  {selectedEntry.references &&
                    selectedEntry.references.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Related Entries</Text>
                        {selectedEntry.references.map((reference, index) => (
                          <Text key={index} style={styles.listItem}>
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
              style={styles.backButton}
              onPress={() => setLibraryModalVisible(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📚 Library</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📖 Books</Text>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  The Complete Book of Correspondences
                </Text>
                <Text style={styles.resourceAuthor}>by Sandra Kynes</Text>
                <Text style={styles.resourceDescription}>
                  A comprehensive guide to magical correspondences including
                  herbs, crystals, colors, and more.
                </Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  Cunningham's Encyclopedia of Magical Herbs
                </Text>
                <Text style={styles.resourceAuthor}>by Scott Cunningham</Text>
                <Text style={styles.resourceDescription}>
                  The definitive guide to magical herbs and their properties,
                  correspondences, and uses.
                </Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>The Magical Household</Text>
                <Text style={styles.resourceAuthor}>
                  by Scott Cunningham & David Harrington
                </Text>
                <Text style={styles.resourceDescription}>
                  Practical magic for everyday life, including household
                  correspondences and rituals.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎥 Video Lessons</Text>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  Introduction to Magical Correspondences
                </Text>
                <Text style={styles.resourceAuthor}>
                  YouTube Channel: The Witch's Library
                </Text>
                <Text style={styles.resourceDescription}>
                  A beginner-friendly series covering the basics of magical
                  correspondences and how to use them.
                </Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  Herbal Magic Masterclass
                </Text>
                <Text style={styles.resourceAuthor}>
                  YouTube Channel: Green Witch Academy
                </Text>
                <Text style={styles.resourceDescription}>
                  Deep dive into herbal correspondences, harvesting, and magical
                  applications.
                </Text>
              </View>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  Crystal Correspondences & Grids
                </Text>
                <Text style={styles.resourceAuthor}>
                  YouTube Channel: Crystal Wisdom
                </Text>
                <Text style={styles.resourceDescription}>
                  Learn about crystal correspondences and how to create
                  effective crystal grids.
                </Text>
              </View>
            </View>
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
              style={styles.backButton}
              onPress={() => setBibliographyModalVisible(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📖 Bibliography</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Sources</Text>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Historical Sources</Text>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Modern References</Text>
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
              style={styles.backButton}
              onPress={() => setGlossaryModalVisible(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📚 Glossary</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.section}>
              <Text style={styles.glossaryTerm}>Correspondence</Text>
              <Text style={styles.glossaryDefinition}>
                A symbolic relationship between different elements in magic,
                such as colors, herbs, crystals, and planets. These connections
                are used to enhance magical workings.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.glossaryTerm}>Elemental</Text>
              <Text style={styles.glossaryDefinition}>
                Relating to the four classical elements: Earth, Air, Fire, and
                Water. Each element has specific correspondences and magical
                properties.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.glossaryTerm}>Ephemeris</Text>
              <Text style={styles.glossaryDefinition}>
                A table showing the positions of celestial bodies at specific
                times. Used in astrology and magical timing.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.glossaryTerm}>Natal Chart</Text>
              <Text style={styles.glossaryDefinition}>
                An astrological chart showing the positions of planets at the
                time and place of birth. Also called a birth chart.
              </Text>
            </View>

            <View style={styles.section}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#b19cd9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#e6e6fa",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#b19cd9",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  smallButton: {
    backgroundColor: "#222",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#333",
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e6e6fa",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#222",
    borderRadius: 3,
    padding: 15,
    color: "#e6e6fa",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#222",
    borderRadius: 3,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  searchButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "#333",
    borderRadius: 3,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
    marginLeft: 5,
  },
  clearButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  backButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    marginTop: 20,
  },
  entryItem: {
    backgroundColor: "#222",
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
    borderColor: "#333",
  },
  entryContent: {
    flex: 1,
  },
  entryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 4,
  },
  entryCategory: {
    fontSize: 14,
    color: "#b19cd9",
    marginBottom: 4,
  },
  entryKeywords: {
    fontSize: 12,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
  arrow: {
    fontSize: 24,
    color: "#8a8a8a",
  },
  listFooter: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#b19cd9",
    fontSize: 14,
  },
  categoriesContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: "#222",
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
    borderColor: "#333",
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
  modalCategory: {
    fontSize: 16,
    color: "#b19cd9",
    fontStyle: "italic",
    marginBottom: 5,
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
  // Full-screen modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#111",
  },
  modalScroll: {
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
