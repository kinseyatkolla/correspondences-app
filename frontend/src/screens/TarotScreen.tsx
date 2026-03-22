// ============================================================================
// IMPORTS
// ============================================================================
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
import { TarotCard } from "../services/api";
import { useTarot } from "../contexts/TarotContext";
import {
  getTarotImages,
  resolveTarotFaceFromMap,
} from "../utils/tarotImageHelper";
import { sharedUI } from "../styles/sharedUI";
import OnboardingOverlay from "../components/OnboardingOverlay";

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotScreen({ navigation, route }: any) {
  const {
    tarotCards: allTarotCards,
    loading: tarotLoading,
    selectedDeck,
  } = useTarot();
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<TarotCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ===== LIFECYCLE =====
  useEffect(() => {
    filterTarotCards(searchQuery, selectedCategory);
  }, [allTarotCards, searchQuery, selectedCategory]);

  // Handle navigation params (e.g., from Book of Shadows)
  useEffect(() => {
    if (route?.params?.searchQuery && allTarotCards.length > 0) {
      const query = route.params.searchQuery;
      setSearchQuery(query);

      // Find and open the matching card
      const matchingCard = allTarotCards.find(
        (card) => card.name.toLowerCase() === query.toLowerCase()
      );

      if (matchingCard) {
        setSelectedCard(matchingCard);
        setModalVisible(true);
      }

      // Clear the param after processing
      navigation.setParams({ searchQuery: undefined });
    }
  }, [route?.params?.searchQuery, allTarotCards]);

  // ===== FILTERING FUNCTIONS =====
  const filterTarotCards = useCallback(
    (search = "", suit = "") => {
      if (!search.trim() && !suit) {
        setTarotCards(allTarotCards);
        setFilteredCards([]);
        return;
      }

      const filtered = allTarotCards.filter((card) => {
        const matchesSearch =
          !search.trim() ||
          card.name.toLowerCase().includes(search.toLowerCase()) ||
          card.uprightMeaning.toLowerCase().includes(search.toLowerCase()) ||
          card.reversedMeaning.toLowerCase().includes(search.toLowerCase()) ||
          card.description.toLowerCase().includes(search.toLowerCase());

        const matchesSuit = !suit || card.suit === suit;

        return matchesSearch && matchesSuit;
      });

      if (search || suit) {
        setFilteredCards(filtered);
      } else {
        setTarotCards(filtered);
        setFilteredCards([]);
      }
    },
    [allTarotCards]
  );

  // ===== EVENT HANDLERS =====
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    filterTarotCards(searchQuery, selectedCategory);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredCards([]);
    setSelectedCategory(null);
    filterTarotCards();
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
    filterTarotCards("", category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setFilteredCards([]);
  };

  const handleCardPress = (card: TarotCard) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const getElementEmoji = (element?: string) => {
    switch (element) {
      case "Fire":
        return "🔥";
      case "Water":
        return "💧";
      case "Air":
        return "💨";
      case "Earth":
        return "🌍";
      case "Spirit":
        return "✨";
      default:
        return "";
    }
  };

  // ===== DATA & CONSTANTS =====
  const tarotFaceImages = getTarotImages(selectedDeck ?? "rws");

  const getCardImageSource = (card: TarotCard) =>
    resolveTarotFaceFromMap(tarotFaceImages, card.imageName);

  // ===== RENDER HELPERS =====
  const renderCategorySection = (
    title: string,
    suit: string,
    emoji: string,
    description: string
  ) => (
    <TouchableOpacity
      style={sharedUI.categoryCard}
      onPress={() => handleCategoryPress(suit)}
    >
      <Text style={sharedUI.categoryEmoji}>{emoji}</Text>
      <Text style={sharedUI.categoryTitle}>{title}</Text>
      <Text style={sharedUI.categoryDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <View style={sharedUI.categoriesContainer}>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Major Arcana",
          "Major Arcana",
          "🔮",
          "22 cards of the major journey"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Cups",
          "Cups",
          "🏆",
          "Emotions & relationships"
        )}
        {renderCategorySection(
          "Pentacles",
          "Pentacles",
          "🪙",
          "Material & practical"
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Swords",
          "Swords",
          "⚔️",
          "Mind & communication"
        )}
        {renderCategorySection("Wands", "Wands", "🪄", "Energy & creativity")}
      </View>
    </View>
  );

  // ===== LOADING STATES =====
  if (tarotLoading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#0f1a3f" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading tarot cards...</Text>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      <OnboardingOverlay screenKey="TAROT" />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sharedUI.pageTitle}>🔮 Tarot</Text>
        <Text style={sharedUI.pageSubtitle}>
          Discover the wisdom of the tarot
        </Text>

        <View style={sharedUI.searchContainer}>
          <TextInput
            style={sharedUI.searchInput}
            placeholder="Search tarot cards..."
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

        {selectedCategory && (
          <TouchableOpacity
            style={sharedUI.backButton}
            onPress={handleBackToCategories}
          >
            <Text style={sharedUI.backButtonText}>← Back to Categories</Text>
          </TouchableOpacity>
        )}

        {filteredCards.length > 0 && (
          <View style={sharedUI.resultsContainer}>
            {filteredCards.map((card) => (
              <TouchableOpacity
                key={card._id}
                style={sharedUI.listItem}
                onPress={() => handleCardPress(card)}
              >
                <View style={sharedUI.listItemContent}>
                  <Text style={sharedUI.listItemTitle}>{card.name}</Text>
                  <Text style={sharedUI.listItemSubtitle}>{card.suit}</Text>
                  {card.keywords && card.keywords.length > 0 && (
                    <Text style={sharedUI.listItemKeywords}>
                      {card.keywords.slice(0, 3).join(" • ")}
                    </Text>
                  )}
                </View>
                <Text style={sharedUI.arrow}>›</Text>
              </TouchableOpacity>
            ))}
            <View style={sharedUI.listFooter}>
              <Text style={sharedUI.footerText}>
                Showing {filteredCards.length} cards
              </Text>
            </View>
          </View>
        )}

        {renderCategories()}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={sharedUI.modalOverlay}>
            <View style={sharedUI.modalContent}>
              <ScrollView style={sharedUI.modalScroll}>
                {selectedCard && (
                  <>
                    <View style={sharedUI.modalHeader}>
                      <Text style={sharedUI.modalTitle}>
                        {selectedCard.name}
                      </Text>
                      <Text style={sharedUI.modalSubtitle}>
                        {selectedCard.suit}{" "}
                        {selectedCard.number > 0 && `#${selectedCard.number}`}
                      </Text>
                      {selectedCard.element && (
                        <Text style={sharedUI.modalElement}>
                          {getElementEmoji(selectedCard.element)}{" "}
                          {selectedCard.element}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={sharedUI.modalCloseButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={sharedUI.modalCloseButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={sharedUI.modalCardImageContainer}>
                      <Image
                        source={getCardImageSource(selectedCard)}
                        style={sharedUI.modalCardImage}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Description
                      </Text>
                      <Text style={sharedUI.sectionText}>
                        {selectedCard.description}
                      </Text>
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>Keywords</Text>
                      {selectedCard.keywords.map((keyword, index) => (
                        <Text key={index} style={sharedUI.modalListItem}>
                          • {keyword}
                        </Text>
                      ))}
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Upright Meaning
                      </Text>
                      <Text style={sharedUI.sectionText}>
                        {selectedCard.uprightMeaning}
                      </Text>
                    </View>

                    <View style={sharedUI.modalSection}>
                      <Text style={sharedUI.sectionTitle}>
                        Reversed Meaning
                      </Text>
                      <Text style={sharedUI.sectionText}>
                        {selectedCard.reversedMeaning}
                      </Text>
                    </View>

                    {selectedCard.astrologicalCorrespondence && (
                      <View style={sharedUI.modalSection}>
                        <Text style={sharedUI.sectionTitle}>
                          Astrological Correspondence
                        </Text>
                        <Text style={sharedUI.sectionText}>
                          {selectedCard.astrologicalCorrespondence}
                        </Text>
                      </View>
                    )}
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
        onPress={() => navigation.navigate("TarotDraw")}
        activeOpacity={0.8}
      >
        <Text style={styles.drawNavArrow}>‹</Text>
        <Text style={styles.drawNavText}>DRAW A RANDOM CARD</Text>
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
    backgroundColor: "#0f1a3f",
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
  drawNavArrow: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  drawNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Account for draw nav bar only (40)
  },
});
