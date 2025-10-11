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

// ============================================================================
// COMPONENT
// ============================================================================
export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

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
});
