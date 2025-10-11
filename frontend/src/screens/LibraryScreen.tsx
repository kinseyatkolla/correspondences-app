// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Dimensions,
  Linking,
} from "react-native";
import { apiService, LibraryItem } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface LibraryScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 10;
const GRID_SPACING = 10;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_SPACING) / 2;

// ============================================================================
// COMPONENT
// ============================================================================
export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================
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

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  useEffect(() => {
    loadLibraryItems();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleBookPress = (book: LibraryItem) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedBook(null);
  };

  const handleOpenLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        Alert.alert("Error", "Unable to open link")
      );
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
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

  const renderBookGrid = () => {
    const books = libraryItems.filter((item) => item.mediaType === "book");
    if (books.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Books</Text>
        <View style={styles.gridContainer}>
          {books.map((book) => (
            <TouchableOpacity
              key={book._id}
              style={styles.bookGridItem}
              onPress={() => handleBookPress(book)}
              activeOpacity={0.7}
            >
              <View style={styles.bookCoverContainer}>
                {book.image ? (
                  <Image
                    source={{ uri: book.image }}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.bookCoverPlaceholder}>
                    <Text style={styles.bookCoverPlaceholderIcon}>📖</Text>
                    <Text
                      style={styles.bookCoverPlaceholderText}
                      numberOfLines={3}
                    >
                      {book.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.name}
              </Text>
              {book.author && (
                <Text style={styles.bookAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLibraryItems = (mediaType: string, title: string) => {
    const items = libraryItems.filter((item) => item.mediaType === mediaType);
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={styles.resourceItem}
            onPress={() =>
              mediaType === "videolink" ? handleOpenLink(item.sourceUrl) : null
            }
            activeOpacity={mediaType === "videolink" ? 0.7 : 1}
          >
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
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBookModal = () => {
    if (!selectedBook) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={overlayStyles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity
            style={overlayStyles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={overlayStyles.closeButton}
              onPress={handleCloseModal}
              activeOpacity={0.7}
            >
              <Text style={overlayStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView style={overlayStyles.modalScroll}>
              {/* Book Cover */}
              {selectedBook.image && (
                <View style={overlayStyles.cardImageContainer}>
                  <Image
                    source={{ uri: selectedBook.image }}
                    style={styles.modalBookCover}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Title and Author */}
              <View style={overlayStyles.modalHeader}>
                <Text style={overlayStyles.modalTitle}>
                  {selectedBook.name}
                </Text>
                {selectedBook.author && (
                  <Text style={overlayStyles.modalSubtitle}>
                    by {selectedBook.author}
                  </Text>
                )}
                {selectedBook.year && (
                  <Text style={overlayStyles.modalElement}>
                    Published: {selectedBook.year}
                  </Text>
                )}
                {selectedBook.publisher && (
                  <Text style={overlayStyles.modalElement}>
                    Publisher: {selectedBook.publisher}
                  </Text>
                )}
              </View>

              {/* Description */}
              {selectedBook.description && (
                <View style={overlayStyles.section}>
                  <Text style={overlayStyles.sectionTitle}>Description</Text>
                  <Text style={overlayStyles.sectionText}>
                    {selectedBook.description}
                  </Text>
                </View>
              )}

              {/* ISBN */}
              {selectedBook.isbn && (
                <View style={overlayStyles.section}>
                  <Text style={overlayStyles.sectionTitle}>ISBN</Text>
                  <Text style={overlayStyles.sectionText}>
                    {selectedBook.isbn}
                  </Text>
                </View>
              )}

              {/* Link */}
              {selectedBook.sourceUrl && (
                <View style={overlayStyles.section}>
                  <TouchableOpacity
                    onPress={() => handleOpenLink(selectedBook.sourceUrl)}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkButtonText}>
                      🔗 View More Information
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={sharedUI.navBar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={sharedUI.navBarArrow}>‹</Text>
        <Text style={sharedUI.navBarText}>LIBRARY</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>
      <ScrollView style={styles.scrollView}>
        {/* Library Items */}
        {libraryLoading ? (
          <View style={sharedUI.loadingContainer}>
            <ActivityIndicator size="large" color="#b19cd9" />
            <Text style={sharedUI.loadingText}>Loading Library...</Text>
          </View>
        ) : (
          <>
            {renderBookGrid()}
            {renderLibraryItems("videolink", "🎥 Video Lessons")}
            {renderLibraryItems("audiolink", "🎧 Audio Resources")}
            {renderLibraryItems("article", "📄 Articles")}
            {renderLibraryItems("website", "🌐 Websites")}
            {renderLibraryItems("other", "📚 Other Resources")}
          </>
        )}
      </ScrollView>

      {/* Book Detail Modal */}
      {renderBookModal()}
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
    padding: GRID_PADDING,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#b19cd9",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  // Book Grid Styles
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bookGridItem: {
    width: ITEM_WIDTH,
    marginBottom: 20,
  },
  bookCoverContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.5,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
  },
  bookCover: {
    width: "100%",
    height: "100%",
  },
  bookCoverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  bookCoverPlaceholderIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  bookCoverPlaceholderText: {
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  bookAuthor: {
    fontSize: 12,
    color: "#b19cd9",
    fontStyle: "italic",
    paddingHorizontal: 2,
  },
  // Modal Styles
  modalBookCover: {
    width: 200,
    height: 300,
    borderRadius: 8,
  },
  linkButton: {
    backgroundColor: "#4a2c7a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  linkButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Other Resource Items (videos, audio, articles, etc.)
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
});
