import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiService, BookOfShadowsEntry } from "../services/api";

interface BookOfShadowsScreenProps {
  category: string;
  onBack: () => void;
}

export default function BookOfShadowsScreen({
  category,
  onBack,
}: BookOfShadowsScreenProps) {
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

  useEffect(() => {
    loadBosEntries();
  }, [category]);

  const loadBosEntries = useCallback(
    async (search = "") => {
      try {
        setLoading(true);
        const response = await apiService.getBookOfShadowsEntries(
          search,
          category
        );
        console.log(
          `Loaded ${response.data.length} BOS entries for ${category}`
        );
        if (search) {
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
    },
    [category]
  );

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      loadBosEntries(query);
    } else {
      setFilteredEntries([]);
    }
  };

  const handleEntryPress = (entry: BookOfShadowsEntry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEntry(null);
  };

  const renderEntry = ({ item }: { item: BookOfShadowsEntry }) => (
    <TouchableOpacity
      style={styles.entryItem}
      onPress={() => handleEntryPress(item)}
    >
      <Text style={styles.entryName}>{item.name}</Text>
      <Text style={styles.entryDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.keywords && item.keywords.length > 0 && (
        <View style={styles.keywordsContainer}>
          {item.keywords.slice(0, 3).map((keyword, index) => (
            <Text key={index} style={styles.keyword}>
              {keyword}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const displayEntries = searchQuery.trim() ? filteredEntries : bosEntries;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={styles.loadingText}>Loading {category} entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{category}</Text>
        <Text style={styles.subtitle}>Book of Shadows</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${category.toLowerCase()}...`}
          placeholderTextColor="#8a8a8a"
          value={searchQuery}
          onChangeText={handleSearchInput}
        />
      </View>

      <FlatList
        data={displayEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.entriesList}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedEntry?.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              {selectedEntry?.description}
            </Text>

            {selectedEntry?.content && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <Text style={styles.sectionContent}>
                  {selectedEntry.content}
                </Text>
              </View>
            )}

            {selectedEntry?.keywords && selectedEntry.keywords.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Keywords</Text>
                <View style={styles.keywordsGrid}>
                  {selectedEntry.keywords.map((keyword, index) => (
                    <Text key={index} style={styles.modalKeyword}>
                      {keyword}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {selectedEntry?.correspondences &&
              selectedEntry.correspondences.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Correspondences</Text>
                  <View style={styles.correspondencesList}>
                    {selectedEntry.correspondences.map(
                      (correspondence, index) => (
                        <Text key={index} style={styles.correspondence}>
                          • {correspondence}
                        </Text>
                      )
                    )}
                  </View>
                </View>
              )}

            {selectedEntry?.references &&
              selectedEntry.references.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Related Entries</Text>
                  {selectedEntry.references.map((reference, index) => (
                    <Text key={index} style={styles.reference}>
                      • {reference.name}
                    </Text>
                  ))}
                </View>
              )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
  },
  loadingText: {
    color: "#b19cd9",
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#b19cd9",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8a8a8a",
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#e6e6fa",
  },
  entriesList: {
    padding: 20,
    paddingTop: 10,
  },
  entryItem: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  entryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  entryDescription: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
    marginBottom: 10,
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  keyword: {
    backgroundColor: "#2a2a3e",
    color: "#b19cd9",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e6e6fa",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: "#8a8a8a",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: "#e6e6fa",
    lineHeight: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
  },
  keywordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modalKeyword: {
    backgroundColor: "#2a2a3e",
    color: "#b19cd9",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  correspondencesList: {
    marginLeft: 10,
  },
  correspondence: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
    marginBottom: 4,
  },
  reference: {
    fontSize: 14,
    color: "#b19cd9",
    lineHeight: 20,
    marginBottom: 4,
  },
});
