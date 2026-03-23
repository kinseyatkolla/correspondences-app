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
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { TarotCard } from "../services/api";
import { useTarot } from "../contexts/TarotContext";
import { sharedUI } from "../styles/sharedUI";
import { drawCardBackgrounds } from "../styles/drawCardsUI";
import OnboardingOverlay from "../components/OnboardingOverlay";

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotScreen({ navigation }: any) {
  const { tarotCards: allTarotCards, loading: tarotLoading } = useTarot();
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<TarotCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ===== LIFECYCLE =====
  useEffect(() => {
    filterTarotCards(searchQuery, selectedCategory ?? "");
  }, [allTarotCards, searchQuery, selectedCategory]);

  // ===== FILTERING FUNCTIONS =====
  const filterTarotCards = useCallback(
    (search = "", suit = "") => {
      if (!search.trim() && !suit) {
        setTarotCards(allTarotCards);
        setFilteredCards([]);
        return;
      }

      const q = search.toLowerCase();
      const hay = (s?: string) => (s ?? "").toLowerCase().includes(q);

      const filtered = allTarotCards.filter((card) => {
        const keywordMatch =
          (card.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
          false;
        const matchesSearch =
          !search.trim() ||
          card.name.toLowerCase().includes(q) ||
          hay(card.description) ||
          hay(card.esotericTitle) ||
          hay(card.decanKeyword) ||
          hay(card.dates) ||
          hay(card.decan) ||
          hay(card.astrologicalCorrespondence) ||
          keywordMatch;

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
    [allTarotCards],
  );

  // ===== EVENT HANDLERS =====
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    filterTarotCards(searchQuery, selectedCategory ?? "");
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
    if (card._id) {
      navigation.navigate("TarotCardDetail", { cardId: card._id });
    }
  };

  // ===== RENDER HELPERS =====
  const renderCategorySection = (
    title: string,
    suit: string,
    emoji: string,
    description: string,
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
          "22 cards of the major journey",
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Cups",
          "Cups",
          "🏆",
          "Emotions & relationships",
        )}
        {renderCategorySection(
          "Pentacles",
          "Pentacles",
          "🪙",
          "Material & practical",
        )}
      </View>
      <View style={sharedUI.categoryRow}>
        {renderCategorySection(
          "Swords",
          "Swords",
          "⚔️",
          "Mind & communication",
        )}
        {renderCategorySection("Wands", "Wands", "🪄", "Energy & creativity")}
      </View>
    </View>
  );

  // ===== LOADING STATES =====
  if (tarotLoading) {
    return (
      <View
        style={[
          sharedUI.loadingContainer,
          { backgroundColor: drawCardBackgrounds.tarot },
        ]}
      >
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
                activeOpacity={0.7}
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
      </ScrollView>

      <TouchableOpacity
        style={styles.drawNavBar}
        onPress={() => navigation.navigate("TarotDraw")}
        activeOpacity={0.8}
      >
        <Text style={styles.drawNavArrow}>‹</Text>
        <Text style={styles.drawNavText}>BACK TO DRAW</Text>
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
    backgroundColor: drawCardBackgrounds.tarot,
  },
  drawNavBar: {
    position: "absolute",
    bottom: 0,
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
    paddingBottom: 40,
  },
});
