// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { usePhysisFont } from "../utils/physisFont";
import {
  getPlanetKeysFromNames,
  getZodiacKeysFromNames,
} from "../utils/physisSymbolMap";
import { getZodiacColorStyle } from "../utils/colorUtils";

type TarotCategory = {
  id: string;
  title: string;
  emoji: string;
  description: string;
};

const tarotCategories: TarotCategory[] = [
  {
    id: "major-arcana",
    title: "Major Arcana",
    emoji: "🔮",
    description: "22 cards of the major journey",
  },
  {
    id: "wands",
    title: "Wands",
    emoji: "🪄",
    description: "Energy & creativity",
  },
  {
    id: "coins",
    title: "Coins",
    emoji: "🪙",
    description: "Material & practical",
  },
  {
    id: "swords",
    title: "Swords",
    emoji: "⚔️",
    description: "Mind & communication",
  },
  {
    id: "cups",
    title: "Cups",
    emoji: "🏆",
    description: "Emotions & relationships",
  },
  {
    id: "element-fire",
    title: "Fire",
    emoji: "🔥",
    description: "Element correspondences",
  },
  {
    id: "element-water",
    title: "Water",
    emoji: "💧",
    description: "Element correspondences",
  },
  {
    id: "element-air",
    title: "Air",
    emoji: "💨",
    description: "Element correspondences",
  },
  {
    id: "element-earth",
    title: "Earth",
    emoji: "🌍",
    description: "Element correspondences",
  },
  {
    id: "planet-sun",
    title: "Sun",
    emoji: "☀️",
    description: "Planet correspondences",
  },
  {
    id: "planet-moon",
    title: "Moon",
    emoji: "🌙",
    description: "Planet correspondences",
  },
  {
    id: "planet-mercury",
    title: "Mercury",
    emoji: "☿",
    description: "Planet correspondences",
  },
  {
    id: "planet-venus",
    title: "Venus",
    emoji: "♀",
    description: "Planet correspondences",
  },
  {
    id: "planet-mars",
    title: "Mars",
    emoji: "♂",
    description: "Planet correspondences",
  },
  {
    id: "planet-jupiter",
    title: "Jupiter",
    emoji: "♃",
    description: "Planet correspondences",
  },
  {
    id: "planet-saturn",
    title: "Saturn",
    emoji: "♄",
    description: "Planet correspondences",
  },
  {
    id: "planet-uranus",
    title: "Uranus",
    emoji: "♅",
    description: "Planet correspondences",
  },
  {
    id: "planet-neptune",
    title: "Neptune",
    emoji: "♆",
    description: "Planet correspondences",
  },
  {
    id: "planet-pluto",
    title: "Pluto",
    emoji: "♇",
    description: "Planet correspondences",
  },
  {
    id: "zodiac-aries",
    title: "Aries",
    emoji: "♈",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-taurus",
    title: "Taurus",
    emoji: "♉",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-gemini",
    title: "Gemini",
    emoji: "♊",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-cancer",
    title: "Cancer",
    emoji: "♋",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-leo",
    title: "Leo",
    emoji: "♌",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-virgo",
    title: "Virgo",
    emoji: "♍",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-libra",
    title: "Libra",
    emoji: "♎",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-scorpio",
    title: "Scorpio",
    emoji: "♏",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-sagittarius",
    title: "Sagittarius",
    emoji: "♐",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-capricorn",
    title: "Capricorn",
    emoji: "♑",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-aquarius",
    title: "Aquarius",
    emoji: "♒",
    description: "Zodiac correspondences",
  },
  {
    id: "zodiac-pisces",
    title: "Pisces",
    emoji: "♓",
    description: "Zodiac correspondences",
  },
];

const PLANET_SYMBOL_COLORS: Record<string, string> = {
  sun: "orange",
  moon: "cornflowerblue",
  mercury: "forestgreen",
  venus: "violet",
  mars: "red",
  jupiter: "gold",
  saturn: "#666666",
  uranus: "steelblue",
  neptune: "indigo",
  pluto: "saddlebrown",
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView | null>(null);
  const { fontLoaded } = usePhysisFont();
  const planetKeys = getPlanetKeysFromNames();
  const zodiacKeys = getZodiacKeysFromNames();
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
    (search = "", categoryId = "") => {
      if (!search.trim() && !categoryId) {
        setTarotCards(allTarotCards);
        setFilteredCards([]);
        return;
      }

      const q = search.toLowerCase();
      const hay = (s?: string) => (s ?? "").toLowerCase().includes(q);
      const astroAndDecan = (card: TarotCard) =>
        `${card.astrologicalCorrespondence ?? ""} ${card.decan ?? ""}`.toLowerCase();
      const matchesCategory = (card: TarotCard) => {
        switch (categoryId) {
          case "major-arcana":
            return card.suit === "Major Arcana";
          case "wands":
            return card.suit === "Wands";
          case "coins":
            return card.suit === "Coins" || card.suit === "Pentacles";
          case "swords":
            return card.suit === "Swords";
          case "cups":
            return card.suit === "Cups";
          case "element-fire":
            return card.element === "Fire";
          case "element-water":
            return card.element === "Water";
          case "element-air":
            return card.element === "Air";
          case "element-earth":
            return card.element === "Earth";
          case "planet-sun":
            return /\bsun\b/.test(astroAndDecan(card));
          case "planet-moon":
            return /\bmoon\b/.test(astroAndDecan(card));
          case "planet-mercury":
            return /\bmercury\b/.test(astroAndDecan(card));
          case "planet-venus":
            return /\bvenus\b/.test(astroAndDecan(card));
          case "planet-mars":
            return /\bmars\b/.test(astroAndDecan(card));
          case "planet-jupiter":
            return /\bjupiter\b/.test(astroAndDecan(card));
          case "planet-saturn":
            return /\bsaturn\b/.test(astroAndDecan(card));
          case "planet-uranus":
            return /\buranus\b/.test(astroAndDecan(card));
          case "planet-neptune":
            return /\bneptune\b/.test(astroAndDecan(card));
          case "planet-pluto":
            return /\bpluto\b/.test(astroAndDecan(card));
          case "zodiac-aries":
            return /\baries\b/.test(astroAndDecan(card));
          case "zodiac-taurus":
            return /\btaurus\b/.test(astroAndDecan(card));
          case "zodiac-gemini":
            return /\bgemini\b/.test(astroAndDecan(card));
          case "zodiac-cancer":
            return /\bcancer\b/.test(astroAndDecan(card));
          case "zodiac-leo":
            return /\bleo\b/.test(astroAndDecan(card));
          case "zodiac-virgo":
            return /\bvirgo\b/.test(astroAndDecan(card));
          case "zodiac-libra":
            return /\blibra\b/.test(astroAndDecan(card));
          case "zodiac-scorpio":
            return /\bscorpio\b/.test(astroAndDecan(card));
          case "zodiac-sagittarius":
            return /\bsagittarius\b/.test(astroAndDecan(card));
          case "zodiac-capricorn":
            return /\bcapricorn\b/.test(astroAndDecan(card));
          case "zodiac-aquarius":
            return /\baquarius\b/.test(astroAndDecan(card));
          case "zodiac-pisces":
            return /\bpisces\b/.test(astroAndDecan(card));
          default:
            return true;
        }
      };

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

        const categoryMatch = !categoryId || matchesCategory(card);

        return matchesSearch && categoryMatch;
      });

      if (search || categoryId) {
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

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery("");
    filterTarotCards("", categoryId);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
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
  const renderCategorySection = (category: TarotCategory) => (
    <TouchableOpacity
      style={[sharedUI.categoryCard, styles.categoryCard]}
      onPress={() => handleCategoryPress(category.id)}
    >
      {(() => {
        const isPlanetCategory = category.id.startsWith("planet-");
        const isZodiacCategory = category.id.startsWith("zodiac-");
        const colorKey = category.title.toLowerCase();
        const planetColor = PLANET_SYMBOL_COLORS[colorKey];
        const zodiacColor = getZodiacColorStyle(category.title).color;
        return (
          <Text
            style={[
              sharedUI.categoryEmoji,
              (isPlanetCategory || isZodiacCategory) && fontLoaded
                ? styles.physisCategoryEmoji
                : null,
              isZodiacCategory && fontLoaded
                ? styles.zodiacPhysisCategoryEmoji
                : null,
              isPlanetCategory && planetColor ? { color: planetColor } : null,
              isZodiacCategory ? { color: zodiacColor } : null,
            ]}
          >
            {isPlanetCategory && fontLoaded
              ? (planetKeys[category.title] ?? category.emoji)
              : isZodiacCategory && fontLoaded
                ? (zodiacKeys[category.title] ?? category.emoji)
                : category.emoji}
          </Text>
        );
      })()}
      <Text style={sharedUI.categoryTitle}>{category.title}</Text>
      <Text style={sharedUI.categoryDescription}>{category.description}</Text>
    </TouchableOpacity>
  );

  const categoryRows = tarotCategories.reduce<TarotCategory[][]>(
    (rows, category, index) => {
      if (index % 2 === 0) rows.push([category]);
      else rows[rows.length - 1].push(category);
      return rows;
    },
    [],
  );

  const renderCategories = () => (
    <View style={styles.categoryList}>
      {categoryRows.map((row, rowIndex) => (
        <View key={`category-row-${rowIndex}`} style={styles.categoryRow}>
          {row.map((category) => (
            <View key={category.id} style={styles.categoryCol}>
              {renderCategorySection(category)}
            </View>
          ))}
          {row.length === 1 ? <View style={styles.categoryCol} /> : null}
        </View>
      ))}
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
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tarot cards..."
            placeholderTextColor="#8a8a8a"
            value={searchQuery}
            onChangeText={handleSearchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            keyboardAppearance="dark"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>✕</Text>
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
                style={[sharedUI.listItem, styles.resultListItem]}
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
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 52,
  },
  searchContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: "#e6e6fa",
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  searchButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultListItem: {
    borderRadius: 10,
  },
  categoryList: {
    width: "100%",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    width: "100%",
    marginBottom: 10,
  },
  categoryCol: {
    width: "48.5%",
    display: "flex",
  },
  categoryCard: {
    width: "100%",
    flex: 1,
    marginHorizontal: 0,
    borderRadius: 10,
  },
  physisCategoryEmoji: {
    fontFamily: "Physis",
    fontSize: 52,
    lineHeight: 54,
  },
  zodiacPhysisCategoryEmoji: {
    fontSize: 58,
    lineHeight: 60,
  },
});
