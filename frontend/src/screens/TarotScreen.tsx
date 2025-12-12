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
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";
import OnboardingOverlay from "../components/OnboardingOverlay";

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotScreen({ navigation, route }: any) {
  const { tarotCards: allTarotCards, loading: tarotLoading } = useTarot();
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
  // Static import map for all tarot card images
  const tarotCardImages: { [key: string]: any } = {
    // Major Arcana
    "Major Arcana-0": require("../../assets/images/tarot/RWSa-T-00.png"),
    "Major Arcana-1": require("../../assets/images/tarot/RWSa-T-01.png"),
    "Major Arcana-2": require("../../assets/images/tarot/RWSa-T-02.png"),
    "Major Arcana-3": require("../../assets/images/tarot/RWSa-T-03.png"),
    "Major Arcana-4": require("../../assets/images/tarot/RWSa-T-04.png"),
    "Major Arcana-5": require("../../assets/images/tarot/RWSa-T-05.png"),
    "Major Arcana-6": require("../../assets/images/tarot/RWSa-T-06.png"),
    "Major Arcana-7": require("../../assets/images/tarot/RWSa-T-07.png"),
    "Major Arcana-8": require("../../assets/images/tarot/RWSa-T-08.png"),
    "Major Arcana-9": require("../../assets/images/tarot/RWSa-T-09.png"),
    "Major Arcana-10": require("../../assets/images/tarot/RWSa-T-10.png"),
    "Major Arcana-11": require("../../assets/images/tarot/RWSa-T-11.png"),
    "Major Arcana-12": require("../../assets/images/tarot/RWSa-T-12.png"),
    "Major Arcana-13": require("../../assets/images/tarot/RWSa-T-13.png"),
    "Major Arcana-14": require("../../assets/images/tarot/RWSa-T-14.png"),
    "Major Arcana-15": require("../../assets/images/tarot/RWSa-T-15.png"),
    "Major Arcana-16": require("../../assets/images/tarot/RWSa-T-16.png"),
    "Major Arcana-17": require("../../assets/images/tarot/RWSa-T-17.png"),
    "Major Arcana-18": require("../../assets/images/tarot/RWSa-T-18.png"),
    "Major Arcana-19": require("../../assets/images/tarot/RWSa-T-19.png"),
    "Major Arcana-20": require("../../assets/images/tarot/RWSa-T-20.png"),
    "Major Arcana-21": require("../../assets/images/tarot/RWSa-T-21.png"),

    // Cups
    "Cups-1": require("../../assets/images/tarot/RWSa-C-0A.png"),
    "Cups-2": require("../../assets/images/tarot/RWSa-C-02.png"),
    "Cups-3": require("../../assets/images/tarot/RWSa-C-03.png"),
    "Cups-4": require("../../assets/images/tarot/RWSa-C-04.png"),
    "Cups-5": require("../../assets/images/tarot/RWSa-C-05.png"),
    "Cups-6": require("../../assets/images/tarot/RWSa-C-06.png"),
    "Cups-7": require("../../assets/images/tarot/RWSa-C-07.png"),
    "Cups-8": require("../../assets/images/tarot/RWSa-C-08.png"),
    "Cups-9": require("../../assets/images/tarot/RWSa-C-09.png"),
    "Cups-10": require("../../assets/images/tarot/RWSa-C-10.png"),
    "Cups-11": require("../../assets/images/tarot/RWSa-C-J1.png"),
    "Cups-12": require("../../assets/images/tarot/RWSa-C-J2.png"),
    "Cups-13": require("../../assets/images/tarot/RWSa-C-QU.png"),
    "Cups-14": require("../../assets/images/tarot/RWSa-C-KI.png"),

    // Pentacles
    "Pentacles-1": require("../../assets/images/tarot/RWSa-P-0A.png"),
    "Pentacles-2": require("../../assets/images/tarot/RWSa-P-02.png"),
    "Pentacles-3": require("../../assets/images/tarot/RWSa-P-03.png"),
    "Pentacles-4": require("../../assets/images/tarot/RWSa-P-04.png"),
    "Pentacles-5": require("../../assets/images/tarot/RWSa-P-05.png"),
    "Pentacles-6": require("../../assets/images/tarot/RWSa-P-06.png"),
    "Pentacles-7": require("../../assets/images/tarot/RWSa-P-07.png"),
    "Pentacles-8": require("../../assets/images/tarot/RWSa-P-08.png"),
    "Pentacles-9": require("../../assets/images/tarot/RWSa-P-09.png"),
    "Pentacles-10": require("../../assets/images/tarot/RWSa-P-10.png"),
    "Pentacles-11": require("../../assets/images/tarot/RWSa-P-J1.png"),
    "Pentacles-12": require("../../assets/images/tarot/RWSa-P-J2.png"),
    "Pentacles-13": require("../../assets/images/tarot/RWSa-P-QU.png"),
    "Pentacles-14": require("../../assets/images/tarot/RWSa-P-KI.png"),

    // Swords
    "Swords-1": require("../../assets/images/tarot/RWSa-S-0A.png"),
    "Swords-2": require("../../assets/images/tarot/RWSa-S-02.png"),
    "Swords-3": require("../../assets/images/tarot/RWSa-S-03.png"),
    "Swords-4": require("../../assets/images/tarot/RWSa-S-04.png"),
    "Swords-5": require("../../assets/images/tarot/RWSa-S-05.png"),
    "Swords-6": require("../../assets/images/tarot/RWSa-S-06.png"),
    "Swords-7": require("../../assets/images/tarot/RWSa-S-07.png"),
    "Swords-8": require("../../assets/images/tarot/RWSa-S-08.png"),
    "Swords-9": require("../../assets/images/tarot/RWSa-S-09.png"),
    "Swords-10": require("../../assets/images/tarot/RWSa-S-10.png"),
    "Swords-11": require("../../assets/images/tarot/RWSa-S-J1.png"),
    "Swords-12": require("../../assets/images/tarot/RWSa-S-J2.png"),
    "Swords-13": require("../../assets/images/tarot/RWSa-S-QU.png"),
    "Swords-14": require("../../assets/images/tarot/RWSa-S-KI.png"),

    // Wands
    "Wands-1": require("../../assets/images/tarot/RWSa-W-0A.png"),
    "Wands-2": require("../../assets/images/tarot/RWSa-W-02.png"),
    "Wands-3": require("../../assets/images/tarot/RWSa-W-03.png"),
    "Wands-4": require("../../assets/images/tarot/RWSa-W-04.png"),
    "Wands-5": require("../../assets/images/tarot/RWSa-W-05.png"),
    "Wands-6": require("../../assets/images/tarot/RWSa-W-06.png"),
    "Wands-7": require("../../assets/images/tarot/RWSa-W-07.png"),
    "Wands-8": require("../../assets/images/tarot/RWSa-W-08.png"),
    "Wands-9": require("../../assets/images/tarot/RWSa-W-09.png"),
    "Wands-10": require("../../assets/images/tarot/RWSa-W-10.png"),
    "Wands-11": require("../../assets/images/tarot/RWSa-W-J1.png"),
    "Wands-12": require("../../assets/images/tarot/RWSa-W-J2.png"),
    "Wands-13": require("../../assets/images/tarot/RWSa-W-QU.png"),
    "Wands-14": require("../../assets/images/tarot/RWSa-W-KI.png"),
  };

  const getCardImagePath = (card: TarotCard) => {
    const key = `${card.suit}-${card.number}`;
    return tarotCardImages[key] || null;
  };

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
          <View style={overlayStyles.modalOverlay}>
            <View style={overlayStyles.modalContent}>
              <ScrollView style={overlayStyles.modalScroll}>
                {selectedCard && (
                  <>
                    <View style={overlayStyles.modalHeader}>
                      <Text style={overlayStyles.modalTitle}>
                        {selectedCard.name}
                      </Text>
                      <Text style={overlayStyles.modalSubtitle}>
                        {selectedCard.suit}{" "}
                        {selectedCard.number > 0 && `#${selectedCard.number}`}
                      </Text>
                      {selectedCard.element && (
                        <Text style={overlayStyles.modalElement}>
                          {getElementEmoji(selectedCard.element)}{" "}
                          {selectedCard.element}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={overlayStyles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={overlayStyles.closeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={overlayStyles.cardImageContainer}>
                      <Image
                        source={getCardImagePath(selectedCard)}
                        style={overlayStyles.cardImage}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={overlayStyles.section}>
                      <Text style={overlayStyles.sectionTitle}>
                        Description
                      </Text>
                      <Text style={overlayStyles.sectionText}>
                        {selectedCard.description}
                      </Text>
                    </View>

                    <View style={overlayStyles.section}>
                      <Text style={overlayStyles.sectionTitle}>Keywords</Text>
                      {selectedCard.keywords.map((keyword, index) => (
                        <Text key={index} style={overlayStyles.listItem}>
                          • {keyword}
                        </Text>
                      ))}
                    </View>

                    <View style={overlayStyles.section}>
                      <Text style={overlayStyles.sectionTitle}>
                        Upright Meaning
                      </Text>
                      <Text style={overlayStyles.sectionText}>
                        {selectedCard.uprightMeaning}
                      </Text>
                    </View>

                    <View style={overlayStyles.section}>
                      <Text style={overlayStyles.sectionTitle}>
                        Reversed Meaning
                      </Text>
                      <Text style={overlayStyles.sectionText}>
                        {selectedCard.reversedMeaning}
                      </Text>
                    </View>

                    {selectedCard.astrologicalCorrespondence && (
                      <View style={overlayStyles.section}>
                        <Text style={overlayStyles.sectionTitle}>
                          Astrological Correspondence
                        </Text>
                        <Text style={overlayStyles.sectionText}>
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
