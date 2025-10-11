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
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { apiService, BookOfShadowsEntry } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";
import WikipediaSection from "../components/WikipediaSection";

// ============================================================================
// TYPES
// ============================================================================
type BookEntriesScreenRouteProp = RouteProp<
  {
    BookEntries: {
      category?: string;
      search?: string;
      categoryDisplay: string;
    };
  },
  "BookEntries"
>;

interface BookEntriesScreenProps {
  navigation: any;
  route: BookEntriesScreenRouteProp;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function BookEntriesScreen({
  navigation,
  route,
}: BookEntriesScreenProps) {
  const { category, search, categoryDisplay } = route.params;
  const [entries, setEntries] = useState<BookOfShadowsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<BookOfShadowsEntry | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingCorrespondence, setLoadingCorrespondence] = useState(false);

  // ===== LIFECYCLE =====
  useEffect(() => {
    loadEntries();
  }, [category, search]);

  // ===== API FUNCTIONS =====
  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      // Use search if provided, otherwise use category
      const response = await apiService.getBookOfShadowsEntries(
        search || "",
        category || ""
      );
      console.log(
        `Loaded ${response.data.length} entries for ${
          search ? `search: ${search}` : `category: ${category}`
        }`
      );
      setEntries(response.data);
    } catch (error) {
      console.error("Error loading entries:", error);
      Alert.alert("Error", "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  // ===== EVENT HANDLERS =====
  const handleEntryPress = (entry: BookOfShadowsEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
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
      // Navigate to Tarot tab
      (navigation as any).navigate("Tarot", {
        screen: "TarotList",
        params: { searchQuery: selectedEntry.name },
      });
    }
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#111" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading entries...</Text>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <TouchableOpacity
        style={sharedUI.navBar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={sharedUI.navBarArrow}>‹</Text>
        <Text style={sharedUI.navBarText}>{categoryDisplay.toUpperCase()}</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>

      {/* Entries List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.entriesContainer}>
          {entries.length > 0 ? (
            <>
              {entries.map((entry) => (
                <TouchableOpacity
                  key={entry._id}
                  style={sharedUI.listItem}
                  onPress={() => handleEntryPress(entry)}
                >
                  <View style={sharedUI.listItemContent}>
                    <Text style={sharedUI.listItemTitle}>{entry.name}</Text>
                    <Text style={sharedUI.listItemSubtitle}>
                      {entry.category}
                    </Text>
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
                  Showing {entries.length} entries
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No entries found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Entry Detail Modal */}
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

                  {/* Description */}
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

                  {/* Tarot Link */}
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

                  {/* Wikipedia Section */}
                  {selectedEntry.wikiName !== null &&
                    selectedEntry.wikiName !== "null" && (
                      <WikipediaSection
                        searchTerm={selectedEntry.name}
                        wikiName={selectedEntry.wikiName}
                      />
                    )}

                  {/* Correspondences */}
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

                  {/* Details/Content */}
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

                  {/* Keywords */}
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

                  {/* References */}
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
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  scrollView: {
    flex: 1,
  },
  entriesContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 16,
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
