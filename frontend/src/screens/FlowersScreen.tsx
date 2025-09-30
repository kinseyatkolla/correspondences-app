import React, { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { apiService, FlowerEssence } from "../services/api";
import { getFlowerEmoji } from "../utils/imageHelper";

export default function FlowersScreen() {
  const [flowerEssences, setFlowerEssences] = useState<FlowerEssence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlower, setSelectedFlower] = useState<FlowerEssence | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadFlowerEssences();
  }, []);

  const loadFlowerEssences = async (search = "") => {
    try {
      setLoading(true);
      const response = await apiService.getFlowerEssences(search);
      setFlowerEssences(response.data);
    } catch (error) {
      console.error("Error loading flower essences:", error);
      Alert.alert("Error", "Failed to load flower essences");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadFlowerEssences(query);
  };

  const handleFlowerPress = (flower: FlowerEssence) => {
    setSelectedFlower(flower);
    setModalVisible(true);
  };

  const handleRandomDraw = () => {
    if (flowerEssences.length === 0) {
      Alert.alert(
        "No flowers available",
        "Please wait for flowers to load or check your connection."
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * flowerEssences.length);
    const randomFlower = flowerEssences[randomIndex];
    setSelectedFlower(randomFlower);
    setModalVisible(true);
  };

  const renderFlowerItem = ({ item }: { item: FlowerEssence }) => (
    <TouchableOpacity
      style={styles.flowerItem}
      onPress={() => handleFlowerPress(item)}
    >
      <Text style={styles.flowerEmoji}>{getFlowerEmoji(item.imageName)}</Text>
      <View style={styles.flowerInfo}>
        <Text style={styles.flowerName}>{item.commonName}</Text>
        <Text style={styles.flowerLatin}>{item.latinName}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={styles.loadingText}>Loading flower essences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌸 Flower Essences</Text>
      <Text style={styles.subtitle}>
        Discover the healing properties of flowers
      </Text>

      <TouchableOpacity style={styles.randomButton} onPress={handleRandomDraw}>
        <Text style={styles.randomButtonText}>🔮 Draw a Random Flower</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.searchInput}
        placeholder="Search flower essences..."
        placeholderTextColor="#8a8a8a"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={flowerEssences}
        renderItem={renderFlowerItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              {selectedFlower && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedFlower.commonName}
                    </Text>
                    <Text style={styles.modalLatin}>
                      {selectedFlower.latinName}
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
                      {selectedFlower.description}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Positive Qualities</Text>
                    {selectedFlower.positiveQualities.map((quality, index) => (
                      <Text key={index} style={styles.listItem}>
                        • {quality}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Patterns of Imbalance
                    </Text>
                    {selectedFlower.patternsOfImbalance.map(
                      (pattern, index) => (
                        <Text key={index} style={styles.listItem}>
                          • {pattern}
                        </Text>
                      )
                    )}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cross References</Text>
                    {selectedFlower.crossReferences.map((reference, index) => (
                      <Text key={index} style={styles.listItem}>
                        • {reference}
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d5016",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d5016",
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
  randomButton: {
    backgroundColor: "#4a2c7a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#6a4c93",
  },
  randomButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
  },
  searchInput: {
    backgroundColor: "#3d6b1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    color: "#e6e6fa",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#4a7c1f",
  },
  list: {
    flex: 1,
  },
  flowerItem: {
    backgroundColor: "#3d6b1a",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4a7c1f",
  },
  flowerEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  flowerInfo: {
    flex: 1,
  },
  flowerName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: "#e6e6fa",
  },
  flowerLatin: {
    fontSize: 14,
    color: "#b19cd9",
    fontStyle: "italic",
  },
  arrow: {
    fontSize: 24,
    color: "#8a8a8a",
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#4a2c7a",
    position: "relative",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  modalLatin: {
    fontSize: 16,
    color: "#b19cd9",
    fontStyle: "italic",
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
});
