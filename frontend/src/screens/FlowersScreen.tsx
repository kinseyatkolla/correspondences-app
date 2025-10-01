import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
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
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

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

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadFlowerEssences(searchQuery.trim());
    } else {
      loadFlowerEssences("");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadFlowerEssences("");
  };

  const handleFlowerPress = (flower: FlowerEssence) => {
    setSelectedFlower(flower);
    setModalVisible(true);
  };

  const handleRandomDraw = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRandomFlowerEssence();
      setSelectedFlower(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error drawing random flower:", error);
      Alert.alert("Error", "Failed to draw random flower");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#0e2515" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading flower essences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={sharedUI.pageTitle}>🌸 Flower Essences</Text>
      <Text style={sharedUI.pageSubtitle}>
        Discover the healing properties of flowers
      </Text>

      <TouchableOpacity
        style={sharedUI.primaryButton}
        onPress={handleRandomDraw}
      >
        <Text style={sharedUI.primaryButtonText}>🔮 Draw a Random Flower</Text>
      </TouchableOpacity>

      <View style={sharedUI.searchContainer}>
        <TextInput
          style={sharedUI.searchInput}
          placeholder="Search flower essences..."
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

      {flowerEssences.map((flower) => (
        <TouchableOpacity
          key={flower._id}
          style={sharedUI.listItem}
          onPress={() => handleFlowerPress(flower)}
        >
          <Text style={sharedUI.listItemEmoji}>
            {getFlowerEmoji(flower.imageName)}
          </Text>
          <View style={sharedUI.listItemContent}>
            <Text style={sharedUI.listItemTitle}>{flower.commonName}</Text>
            <Text style={sharedUI.listItemSubtitle}>{flower.latinName}</Text>
          </View>
          <Text style={sharedUI.arrow}>›</Text>
        </TouchableOpacity>
      ))}

      {flowerEssences.length > 0 && (
        <View style={sharedUI.listFooter}>
          <Text style={sharedUI.footerText}>
            Showing {flowerEssences.length} flowers
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={overlayStyles.modalOverlay}>
          <View style={overlayStyles.modalContent}>
            <ScrollView style={overlayStyles.modalScroll}>
              {selectedFlower && (
                <>
                  <View style={overlayStyles.modalHeader}>
                    <Text style={overlayStyles.modalTitle}>
                      {selectedFlower.commonName}
                    </Text>
                    <Text style={overlayStyles.modalSubtitle}>
                      {selectedFlower.latinName}
                    </Text>
                    <TouchableOpacity
                      style={overlayStyles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={overlayStyles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Flower Image */}
                  <View style={overlayStyles.imageContainer}>
                    <Image
                      source={
                        selectedFlower.imageName &&
                        flowerImages[selectedFlower.imageName]
                          ? flowerImages[selectedFlower.imageName]
                          : flowerImages["default.jpg"]
                      }
                      style={overlayStyles.flowerImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={overlayStyles.section}>
                    <Text style={overlayStyles.sectionTitle}>Description</Text>
                    <Text style={overlayStyles.sectionText}>
                      {selectedFlower.description}
                    </Text>
                  </View>

                  <View style={overlayStyles.section}>
                    <Text style={overlayStyles.sectionTitle}>
                      Positive Qualities
                    </Text>
                    {selectedFlower.positiveQualities.map((quality, index) => (
                      <Text key={index} style={overlayStyles.listItem}>
                        • {quality}
                      </Text>
                    ))}
                  </View>

                  <View style={overlayStyles.section}>
                    <Text style={overlayStyles.sectionTitle}>
                      Patterns of Imbalance
                    </Text>
                    {selectedFlower.patternsOfImbalance.map(
                      (pattern, index) => (
                        <Text key={index} style={overlayStyles.listItem}>
                          • {pattern}
                        </Text>
                      )
                    )}
                  </View>

                  <View style={overlayStyles.section}>
                    <Text style={overlayStyles.sectionTitle}>
                      Cross References
                    </Text>
                    {selectedFlower.crossReferences.map((reference, index) => (
                      <Text key={index} style={overlayStyles.listItem}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e2515",
    padding: 20,
  },
});
