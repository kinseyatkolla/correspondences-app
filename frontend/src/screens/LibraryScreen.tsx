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
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiService, LibraryItem, ISBNBookData } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface LibraryScreenProps {
  navigation: any;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [isbnInput, setIsbnInput] = useState("");
  const [bookLookupLoading, setBookLookupLoading] = useState(false);
  const [lookupResults, setLookupResults] = useState<ISBNBookData[]>([]);
  const [showLookupResults, setShowLookupResults] = useState(false);

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

  const handleBookLookup = useCallback(async () => {
    const title = titleInput.trim();
    const author = authorInput.trim();
    const isbn = isbnInput.trim();

    if (!title && !author && !isbn) {
      Alert.alert("Error", "Please enter at least a title, author, or ISBN");
      return;
    }

    try {
      setBookLookupLoading(true);
      const response = await apiService.searchBooks({
        title: title || undefined,
        author: author || undefined,
        isbn: isbn || undefined,
      });
      setLookupResults(response.data);
      setShowLookupResults(true);
    } catch (error) {
      console.error("Error searching for books:", error);
      Alert.alert("Error", "Failed to search for books");
    } finally {
      setBookLookupLoading(false);
    }
  }, [titleInput, authorInput, isbnInput]);

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

        // Clear lookup results and inputs
        setLookupResults([]);
        setShowLookupResults(false);
        setTitleInput("");
        setAuthorInput("");
        setIsbnInput("");
      } catch (error) {
        console.error("Error adding book to library:", error);
        Alert.alert("Error", "Failed to add book to library");
      }
    },
    [loadLibraryItems]
  );

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  useEffect(() => {
    loadLibraryItems();
  }, []);

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

  const renderBookLookupResults = () => {
    if (!lookupResults || lookupResults.length === 0) return null;

    return (
      <View style={overlayStyles.section}>
        <Text style={overlayStyles.sectionTitle}>
          📖{" "}
          {lookupResults.length === 1
            ? "Book Found"
            : `${lookupResults.length} Books Found`}
        </Text>
        {lookupResults.map((book, index) => (
          <View key={index} style={styles.lookupResultItem}>
            <Text style={styles.resourceTitle}>{book.title}</Text>
            <Text style={styles.resourceAuthor}>
              by {book.authors.join(", ")}
            </Text>
            <Text style={styles.resourceDescription}>
              {book.publisher} • {book.publishedDate}
              {book.isbn && ` • ISBN: ${book.isbn}`}
            </Text>
            {book.description && (
              <Text style={styles.resourceDescription} numberOfLines={3}>
                {book.description}
              </Text>
            )}
            <TouchableOpacity
              style={styles.addBookButton}
              onPress={() => handleAddBookToLibrary(book)}
            >
              <Text style={styles.addBookButtonText}>+ Add to Library</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
        {/* Book Search Section */}
        <View style={overlayStyles.section}>
          <Text style={overlayStyles.sectionTitle}>🔍 Search for Books</Text>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Book Title (optional)"
              placeholderTextColor="#8a8a8a"
              value={titleInput}
              onChangeText={setTitleInput}
              returnKeyType="next"
            />
          </View>

          {/* Author Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Author Name (optional)"
              placeholderTextColor="#8a8a8a"
              value={authorInput}
              onChangeText={setAuthorInput}
              returnKeyType="next"
            />
          </View>

          {/* ISBN Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="ISBN (10 or 13 digits, optional)"
              placeholderTextColor="#8a8a8a"
              value={isbnInput}
              onChangeText={setIsbnInput}
              keyboardType="numeric"
              returnKeyType="search"
              onSubmitEditing={handleBookLookup}
            />
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleBookLookup}
            disabled={bookLookupLoading}
          >
            {bookLookupLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>🔍 Search Books</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Book Search Results */}
        {showLookupResults && renderBookLookupResults()}

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
  inputContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#e6e6fa",
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#b19cd9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
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
