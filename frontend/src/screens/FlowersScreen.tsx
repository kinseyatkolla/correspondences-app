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
  Image,
} from "react-native";
import { apiService, FlowerEssence } from "../services/api";
import { getFlowerEmoji } from "../utils/imageHelper";

// Import all flower images
const flowerImages: { [key: string]: any } = {
  "agrimony.png": require("../../assets/images/flowers/agrimony.png"),
  "aloevera.png": require("../../assets/images/flowers/aloevera.png"),
  "aspen.png": require("../../assets/images/flowers/aspen.png"),
  "basil.png": require("../../assets/images/flowers/basil.png"),
  "beech.png": require("../../assets/images/flowers/beech.png"),
  "centaury.png": require("../../assets/images/flowers/centaury.png"),
  "cerato.png": require("../../assets/images/flowers/cerato.png"),
  "chamomile.png": require("../../assets/images/flowers/chamomile.png"),
  "cherryplumb.png": require("../../assets/images/flowers/cherryplumb.png"),
  "chestnutbud.png": require("../../assets/images/flowers/chestnutbud.png"),
  "chicory.png": require("../../assets/images/flowers/chicory.png"),
  "clematis.png": require("../../assets/images/flowers/clematis.png"),
  "crabapple.png": require("../../assets/images/flowers/crabapple.png"),
  "dandelion.png": require("../../assets/images/flowers/dandelion.png"),
  "default.jpg": require("../../assets/images/flowers/default.jpg"),
  "dill.png": require("../../assets/images/flowers/dill.png"),
  "dogwood.png": require("../../assets/images/flowers/dogwood.png"),
  "elm.png": require("../../assets/images/flowers/elm.png"),
  "gorse.png": require("../../assets/images/flowers/gorse.png"),
  "heather.png": require("../../assets/images/flowers/heather.png"),
  "hibiscus.png": require("../../assets/images/flowers/hibiscus.png"),
  "holly.png": require("../../assets/images/flowers/holly.png"),
  "honeysuckle.png": require("../../assets/images/flowers/honeysuckle.png"),
  "hornbeam.png": require("../../assets/images/flowers/hornbeam.png"),
  "larch.png": require("../../assets/images/flowers/larch.png"),
  "lavender.png": require("../../assets/images/flowers/lavender.png"),
  "mimulus.png": require("../../assets/images/flowers/mimulus.png"),
  "morningglory.png": require("../../assets/images/flowers/morningglory.png"),
  "mullein.png": require("../../assets/images/flowers/mullein.png"),
  "mustard.png": require("../../assets/images/flowers/mustard.png"),
  "oak.png": require("../../assets/images/flowers/oak.png"),
  "olive.png": require("../../assets/images/flowers/olive.png"),
  "peppermint.png": require("../../assets/images/flowers/peppermint.png"),
  "pine.png": require("../../assets/images/flowers/pine.png"),
  "redchestnut.png": require("../../assets/images/flowers/redchestnut.png"),
  "redclover.png": require("../../assets/images/flowers/redclover.png"),
  "rockrose.png": require("../../assets/images/flowers/rockrose.png"),
  "rockwater.png": require("../../assets/images/flowers/rockwater.png"),
  "rosemary.png": require("../../assets/images/flowers/rosemary.png"),
  "sage.png": require("../../assets/images/flowers/sage.png"),
  "scleranthus.png": require("../../assets/images/flowers/scleranthus.png"),
  "starofbethlehem.png": require("../../assets/images/flowers/starofbethlehem.png"),
  "sunflower.png": require("../../assets/images/flowers/sunflower.png"),
  "sweetchestnut.png": require("../../assets/images/flowers/sweetchestnut.png"),
  "vervain.png": require("../../assets/images/flowers/vervain.png"),
  "vine.png": require("../../assets/images/flowers/vine.png"),
  "walnut.png": require("../../assets/images/flowers/walnut.png"),
  "waterviolet.png": require("../../assets/images/flowers/waterviolet.png"),
  "whitechestnut.png": require("../../assets/images/flowers/whitechestnut.png"),
  "wildoat.png": require("../../assets/images/flowers/wildoat.png"),
  "wildrose.png": require("../../assets/images/flowers/wildrose.png"),
  "willow.png": require("../../assets/images/flowers/willow.png"),
  "yarrow.png": require("../../assets/images/flowers/yarrow.png"),
};

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

  const loadFlowerEssences = useCallback(async (search = "") => {
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
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFlowerEssences(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

                  {/* Flower Image */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={
                        selectedFlower.imageName &&
                        flowerImages[selectedFlower.imageName]
                          ? flowerImages[selectedFlower.imageName]
                          : flowerImages["default.jpg"]
                      }
                      style={styles.flowerImage}
                      resizeMode="contain"
                    />
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
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    marginBottom: 0,
  },
  flowerImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 1, // This will maintain square aspect ratio, adjust as needed
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
