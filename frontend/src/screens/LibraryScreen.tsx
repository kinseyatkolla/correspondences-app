import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiService, LibraryItem, ISBNBookData } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

interface LibraryScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function LibraryScreen({
  visible,
  onClose,
}: LibraryScreenProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnLookupLoading, setIsbnLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<ISBNBookData | null>(null);
  const [showLookupResult, setShowLookupResult] = useState(false);

  // ===== API FUNCTIONS =====
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

  const handleISBNLookup = useCallback(async () => {
    if (!isbnInput.trim()) {
      Alert.alert("Error", "Please enter an ISBN");
      return;
    }

    try {
      setIsbnLookupLoading(true);
      const response = await apiService.lookupISBN(isbnInput.trim());
      setLookupResult(response.data);
      setShowLookupResult(true);
    } catch (error) {
      console.error("Error looking up ISBN:", error);
      Alert.alert("Error", "Failed to look up book information");
    } finally {
      setIsbnLookupLoading(false);
    }
  }, [isbnInput]);

  const handleAddBookToLibrary = useCallback(
    async (bookData: ISBNBookData) => {
      try {
        const libraryItem = {
          name: bookData.title,
          author: bookData.authors.join(", "),
          publisher: bookData.publisher,
          year: bookData.publishedDate
            ? parseInt(bookData.publishedDate.split("-")[0])
            : undefined,
          description: bookData.description,
          isbn: bookData.isbn,
          image: bookData.imageLinks?.thumbnail || bookData.imageLinks?.small,
          sourceUrl: bookData.previewLink,
          mediaType: "book" as const,
        };

        await apiService.createLibraryItem(libraryItem);
        Alert.alert("Success", "Book added to library successfully!");

        // Refresh library items
        await loadLibraryItems();

        // Clear lookup result
        setLookupResult(null);
        setShowLookupResult(false);
        setIsbnInput("");
      } catch (error) {
        console.error("Error adding book to library:", error);
        Alert.alert("Error", "Failed to add book to library");
      }
    },
    [loadLibraryItems]
  );

  // ===== LIFECYCLE =====
  useEffect(() => {
    if (visible) {
      loadLibraryItems();
    }
  }, [visible, loadLibraryItems]);

  // ===== RENDER HELPERS =====
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

  const renderISBNLookupResult = () => {
    if (!lookupResult) return null;

    return (
      <View style={overlayStyles.section}>
        <Text style={overlayStyles.sectionTitle}>📖 Book Found</Text>
        <View style={styles.lookupResultItem}>
          <Text style={styles.resourceTitle}>{lookupResult.title}</Text>
          <Text style={styles.resourceAuthor}>
            by {lookupResult.authors.join(", ")}
          </Text>
          <Text style={styles.resourceDescription}>
            {lookupResult.publisher} • {lookupResult.publishedDate}
          </Text>
          {lookupResult.description && (
            <Text style={styles.resourceDescription}>
              {lookupResult.description}
            </Text>
          )}
          <TouchableOpacity
            style={styles.addBookButton}
            onPress={() => handleAddBookToLibrary(lookupResult)}
          >
            <Text style={styles.addBookButtonText}>+ Add to Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenModal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={sharedUI.backButton} onPress={onClose}>
            <Text style={sharedUI.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>📚 Library</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.fullScreenModalScroll}>
          {/* ISBN Lookup Section */}
          <View style={overlayStyles.section}>
            <Text style={overlayStyles.sectionTitle}>🔍 Add Book by ISBN</Text>
            <View style={styles.isbnLookupContainer}>
              <TextInput
                style={styles.isbnInput}
                placeholder="Enter ISBN (10 or 13 digits)"
                placeholderTextColor="#8a8a8a"
                value={isbnInput}
                onChangeText={setIsbnInput}
                keyboardType="numeric"
                returnKeyType="search"
                onSubmitEditing={handleISBNLookup}
              />
              <TouchableOpacity
                style={styles.isbnLookupButton}
                onPress={handleISBNLookup}
                disabled={isbnLookupLoading}
              >
                {isbnLookupLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.isbnLookupButtonText}>🔍 Lookup</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ISBN Lookup Result */}
          {showLookupResult && renderISBNLookupResult()}

          {/* Library Items */}
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
  );
}

const styles = StyleSheet.create({
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
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#111",
  },
  fullScreenModalScroll: {
    flex: 1,
    padding: 20,
  },
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
  isbnLookupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  isbnInput: {
    flex: 1,
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#e6e6fa",
    fontSize: 16,
    marginRight: 10,
  },
  isbnLookupButton: {
    backgroundColor: "#b19cd9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  isbnLookupButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  lookupResultItem: {
    backgroundColor: "#222",
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  addBookButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  addBookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
