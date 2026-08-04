// ============================================================================
// IMPORTS
// ============================================================================
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
  Animated,
} from "react-native";
import { FlowerEssence } from "../services/api";
import { getFlowerEmoji } from "../utils/imageHelper";
import { sharedUI } from "../styles/sharedUI";
import { useFlowers } from "../contexts/FlowersContext";

// ============================================================================
// DATA & CONSTANTS
// ============================================================================
// Import all flower images
const flowerImages: { [key: string]: any } = {
  "agrimony.png": require("../../assets/images/flowers/agrimony.webp"),
  "aloevera.png": require("../../assets/images/flowers/aloevera.webp"),
  "aspen.png": require("../../assets/images/flowers/aspen.webp"),
  "basil.png": require("../../assets/images/flowers/basil.webp"),
  "beech.png": require("../../assets/images/flowers/beech.webp"),
  "centaury.png": require("../../assets/images/flowers/centaury.webp"),
  "cerato.png": require("../../assets/images/flowers/cerato.webp"),
  "chamomile.png": require("../../assets/images/flowers/chamomile.webp"),
  "cherryplumb.png": require("../../assets/images/flowers/cherryplumb.webp"),
  "chestnutbud.png": require("../../assets/images/flowers/chestnutbud.webp"),
  "chicory.png": require("../../assets/images/flowers/chicory.webp"),
  "clematis.png": require("../../assets/images/flowers/clematis.webp"),
  "crabapple.png": require("../../assets/images/flowers/crabapple.webp"),
  "dandelion.png": require("../../assets/images/flowers/dandelion.webp"),
  "default.jpg": require("../../assets/images/flowers/chamomile.webp"),
  "dill.png": require("../../assets/images/flowers/dill.webp"),
  "dogwood.png": require("../../assets/images/flowers/dogwood.webp"),
  "elm.png": require("../../assets/images/flowers/elm.webp"),
  "gorse.png": require("../../assets/images/flowers/gorse.webp"),
  "heather.png": require("../../assets/images/flowers/heather.webp"),
  "hibiscus.png": require("../../assets/images/flowers/hibiscus.webp"),
  "holly.png": require("../../assets/images/flowers/holly.webp"),
  "honeysuckle.png": require("../../assets/images/flowers/honeysuckle.webp"),
  "hornbeam.png": require("../../assets/images/flowers/hornbeam.webp"),
  "larch.png": require("../../assets/images/flowers/larch.webp"),
  "lavender.png": require("../../assets/images/flowers/lavender.webp"),
  "mimulus.png": require("../../assets/images/flowers/mimulus.webp"),
  "morningglory.png": require("../../assets/images/flowers/morningglory.webp"),
  "mullein.png": require("../../assets/images/flowers/mullein.webp"),
  "mustard.png": require("../../assets/images/flowers/mustard.webp"),
  "oak.png": require("../../assets/images/flowers/oak.webp"),
  "olive.png": require("../../assets/images/flowers/olive.webp"),
  "peppermint.png": require("../../assets/images/flowers/peppermint.webp"),
  "pine.png": require("../../assets/images/flowers/pine.webp"),
  "redchestnut.png": require("../../assets/images/flowers/redchestnut.webp"),
  "redclover.png": require("../../assets/images/flowers/redclover.webp"),
  "rockrose.png": require("../../assets/images/flowers/rockrose.webp"),
  "rockwater.png": require("../../assets/images/flowers/rockwater.webp"),
  "rosemary.png": require("../../assets/images/flowers/rosemary.webp"),
  "sage.png": require("../../assets/images/flowers/sage.webp"),
  "scleranthus.png": require("../../assets/images/flowers/scleranthus.webp"),
  "starofbethlehem.png": require("../../assets/images/flowers/starofbethlehem.webp"),
  "sunflower.png": require("../../assets/images/flowers/sunflower.webp"),
  "sweetchestnut.png": require("../../assets/images/flowers/sweetchestnut.webp"),
  "vervain.png": require("../../assets/images/flowers/vervain.webp"),
  "vine.png": require("../../assets/images/flowers/vine.webp"),
  "walnut.png": require("../../assets/images/flowers/walnut.webp"),
  "waterviolet.png": require("../../assets/images/flowers/waterviolet.webp"),
  "whitechestnut.png": require("../../assets/images/flowers/whitechestnut.webp"),
  "wildoat.png": require("../../assets/images/flowers/wildoat.webp"),
  "wildrose.png": require("../../assets/images/flowers/wildrose.webp"),
  "willow.png": require("../../assets/images/flowers/willow.webp"),
  "yarrow.png": require("../../assets/images/flowers/yarrow.webp"),
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function FlowersScreen({ navigation }: any) {
  const { flowers: allFlowers, loading: flowersLoading } = useFlowers();
  const [flowerEssences, setFlowerEssences] = useState<FlowerEssence[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlower, setSelectedFlower] = useState<FlowerEssence | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useState(new Animated.Value(0))[0];

  // ===== LIFECYCLE =====
  useEffect(() => {
    if (allFlowers.length > 0) {
      setFlowerEssences(allFlowers);
    }
  }, [allFlowers]);

  // ===== SEARCH FUNCTIONS =====
  const filterFlowers = useCallback(
    (search = "") => {
      if (!search.trim()) {
        setFlowerEssences(allFlowers);
        return;
      }

      const filtered = allFlowers.filter(
        (flower) =>
          flower.commonName.toLowerCase().includes(search.toLowerCase()) ||
          flower.latinName.toLowerCase().includes(search.toLowerCase()) ||
          flower.description.toLowerCase().includes(search.toLowerCase())
      );
      setFlowerEssences(filtered);
    },
    [allFlowers]
  );

  // ===== EVENT HANDLERS =====
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    filterFlowers(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    filterFlowers("");
  };

  const handleFlowerPress = (flower: FlowerEssence) => {
    setSelectedFlower(flower);
    setModalVisible(true);
    // Reset flip state when opening a new flower
    setIsFlipped(false);
    flipAnimation.setValue(0);
  };

  const handleRandomDraw = async () => {
    // Navigate to the flower draw screen with the already loaded flowers
    navigation.navigate("FlowerDraw", { flowers: flowerEssences });
  };

  const handleImageFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);

    Animated.timing(flipAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // ===== LOADING STATES =====
  if (flowersLoading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#0e2515" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading flower essences...</Text>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sharedUI.pageTitle}>🌸 Flower Essences</Text>
        <Text style={sharedUI.pageSubtitle}>
          Discover the healing properties of flowers
        </Text>

        <View style={sharedUI.searchContainer}>
          <TextInput
            style={sharedUI.searchInput}
            placeholder="Search flower essences..."
            placeholderTextColor="#8a8a8a"
            value={searchQuery}
            onChangeText={handleSearchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            keyboardAppearance="dark"
          />
          <TouchableOpacity
            style={sharedUI.searchButton}
            onPress={handleSearch}
          >
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
          <View style={sharedUI.modalOverlay}>
            <View style={sharedUI.modalContent}>
              <ScrollView style={sharedUI.modalScroll}>
                {selectedFlower && (
                  <>
                    <View style={sharedUI.modalHeader}>
                      <Text style={sharedUI.modalTitle}>
                        {selectedFlower.commonName}
                      </Text>
                      <Text style={sharedUI.modalSubtitle}>
                        {selectedFlower.latinName}
                      </Text>
                      <TouchableOpacity
                        style={sharedUI.modalCloseButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={sharedUI.modalCloseButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Flower Image */}
                    <View style={sharedUI.modalImageContainer}>
                      <TouchableOpacity
                        onPress={handleImageFlip}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={{
                            transform: [
                              {
                                rotateZ: flipAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0deg", "180deg"],
                                }),
                              },
                            ],
                          }}
                        >
                          <Image
                            source={
                              selectedFlower.imageName &&
                              flowerImages[selectedFlower.imageName]
                                ? flowerImages[selectedFlower.imageName]
                                : flowerImages["default.jpg"]
                            }
                            style={sharedUI.modalFlowerImage}
                            resizeMode="contain"
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Description
                      </Text>
                      <Text style={sharedUI.sectionText}>
                        {selectedFlower.description}
                      </Text>
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Positive Qualities
                      </Text>
                      {selectedFlower.positiveQualities.map(
                        (quality, index) => (
                          <Text key={index} style={sharedUI.modalListItem}>
                            • {quality}
                          </Text>
                        )
                      )}
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Patterns of Imbalance
                      </Text>
                      {selectedFlower.patternsOfImbalance.map(
                        (pattern, index) => (
                          <Text key={index} style={sharedUI.modalListItem}>
                            • {pattern}
                          </Text>
                        )
                      )}
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Cross References
                      </Text>
                      {selectedFlower.crossReferences.map(
                        (reference, index) => (
                          <Text key={index} style={sharedUI.modalListItem}>
                            • {reference}
                          </Text>
                        )
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Draw Navigation Bar - Moved to bottom */}
      <TouchableOpacity
        style={styles.drawNavBar}
        onPress={() => navigation.navigate("FlowerDraw")}
        activeOpacity={0.8}
      >
        <Text style={styles.drawNavArrow}>‹</Text>
        <Text style={styles.drawNavText}>DRAW A RANDOM FLOWER</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e2515",
  },
  drawNavBar: {
    position: "absolute",
    bottom: 0, // Position directly above the tab bar
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  drawNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  drawNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Account for draw nav bar only (40)
  },
});
