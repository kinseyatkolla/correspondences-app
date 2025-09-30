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
import { apiService, TarotCard } from "../services/api";

export default function TarotScreen() {
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<TarotCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadTarotCards();
  }, []);

  const loadTarotCards = useCallback(async (search = "", suit = "") => {
    try {
      setLoading(true);
      const response = await apiService.getTarotCards(search, suit);
      console.log(`Loaded ${response.data.length} tarot cards`);
      if (search || suit) {
        setFilteredCards(response.data);
      } else {
        setTarotCards(response.data);
        setFilteredCards([]);
      }
    } catch (error) {
      console.error("Error loading tarot cards:", error);
      Alert.alert("Error", "Failed to load tarot cards");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedCategory(null);
      loadTarotCards(searchQuery.trim());
    } else {
      setFilteredCards([]);
    }
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
    loadTarotCards("", category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setFilteredCards([]);
  };

  const handleCardPress = (card: TarotCard) => {
    setSelectedCard(card);
    setModalVisible(true);
  };

  const handleRandomDraw = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRandomTarotCard();
      setSelectedCard(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error drawing random card:", error);
      Alert.alert("Error", "Failed to draw random card");
    } finally {
      setLoading(false);
    }
  };

  const getCardEmoji = (suit: string) => {
    switch (suit) {
      case "Major Arcana":
        return "🔮";
      case "Cups":
        return "🏆";
      case "Wands":
        return "🪄";
      case "Swords":
        return "⚔️";
      case "Pentacles":
        return "🪙";
      default:
        return "🃏";
    }
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

  const renderCardItem = ({ item }: { item: TarotCard }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => handleCardPress(item)}
    >
      <Text style={styles.cardEmoji}>{getCardEmoji(item.suit)}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardSuit}>
          {item.suit} {item.number > 0 && `#${item.number}`}
        </Text>
        {item.element && (
          <Text style={styles.cardElement}>
            {getElementEmoji(item.element)} {item.element}
          </Text>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  const renderCategorySection = (
    title: string,
    suit: string,
    emoji: string,
    description: string
  ) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(suit)}
    >
      <Text style={styles.categoryEmoji}>{emoji}</Text>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categoryDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <View style={styles.categoryRow}>
        {renderCategorySection(
          "Major Arcana",
          "Major Arcana",
          "🔮",
          "22 cards of the major journey"
        )}
      </View>
      <View style={styles.categoryRow}>
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
      <View style={styles.categoryRow}>
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

  const renderFooter = () => (
    <View style={styles.listFooter}>
      <Text style={styles.footerText}>
        Showing {filteredCards.length} cards
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={styles.loadingText}>Loading tarot cards...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🔮 Tarot Cards</Text>
      <Text style={styles.subtitle}>Discover the wisdom of the tarot</Text>

      <TouchableOpacity style={styles.randomButton} onPress={handleRandomDraw}>
        <Text style={styles.randomButtonText}>🎲 Draw a Random Card</Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tarot cards..."
          placeholderTextColor="#8a8a8a"
          value={searchQuery}
          onChangeText={handleSearchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {selectedCategory && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToCategories}
        >
          <Text style={styles.backButtonText}>← Back to Categories</Text>
        </TouchableOpacity>
      )}

      {filteredCards.length > 0 && (
        <View style={styles.resultsContainer}>
          {filteredCards.map((card) => (
            <TouchableOpacity
              key={card._id}
              style={styles.cardItem}
              onPress={() => handleCardPress(card)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{card.name}</Text>
                <Text style={styles.cardSuit}>{card.suit}</Text>
                {card.keywords && card.keywords.length > 0 && (
                  <Text style={styles.cardKeywords}>
                    {card.keywords.slice(0, 3).join(" • ")}
                  </Text>
                )}
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.listFooter}>
            <Text style={styles.footerText}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              {selectedCard && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedCard.name}</Text>
                    <Text style={styles.modalSuit}>
                      {selectedCard.suit}{" "}
                      {selectedCard.number > 0 && `#${selectedCard.number}`}
                    </Text>
                    {selectedCard.element && (
                      <Text style={styles.modalElement}>
                        {getElementEmoji(selectedCard.element)}{" "}
                        {selectedCard.element}
                      </Text>
                    )}
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
                      {selectedCard.description}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Keywords</Text>
                    {selectedCard.keywords.map((keyword, index) => (
                      <Text key={index} style={styles.listItem}>
                        • {keyword}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upright Meaning</Text>
                    <Text style={styles.sectionText}>
                      {selectedCard.uprightMeaning}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reversed Meaning</Text>
                    <Text style={styles.sectionText}>
                      {selectedCard.reversedMeaning}
                    </Text>
                  </View>

                  {selectedCard.astrologicalCorrespondence && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Astrological Correspondence
                      </Text>
                      <Text style={styles.sectionText}>
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
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  searchInput: {
    backgroundColor: "#3d6b1a",
    borderRadius: 12,
    padding: 15,
    color: "#e6e6fa",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#4a7c1f",
    flex: 1,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#4a7c1f",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  searchButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  listFooter: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#b19cd9",
    fontSize: 14,
  },
  categoriesContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-between",
  },
  categoryCard: {
    backgroundColor: "#3d6b1a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#4a7c1f",
  },
  categoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
    textAlign: "center",
  },
  categoryDescription: {
    fontSize: 12,
    color: "#b19cd9",
    textAlign: "center",
    lineHeight: 16,
  },
  backButton: {
    backgroundColor: "#4a2c7a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  backButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    marginTop: 20,
  },
  cardItem: {
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
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 4,
  },
  cardSuit: {
    fontSize: 14,
    color: "#b19cd9",
    marginBottom: 4,
  },
  cardKeywords: {
    fontSize: 12,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
  cardEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardElement: {
    fontSize: 12,
    color: "#8a8a8a",
    marginTop: 2,
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
  modalSuit: {
    fontSize: 16,
    color: "#b19cd9",
    fontStyle: "italic",
    marginBottom: 5,
  },
  modalElement: {
    fontSize: 14,
    color: "#8a8a8a",
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
