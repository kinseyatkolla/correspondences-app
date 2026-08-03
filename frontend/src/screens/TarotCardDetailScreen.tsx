import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { TarotCard } from "../services/api";
import { useTarot } from "../contexts/TarotContext";
import {
  getTarotImages,
  resolveTarotFaceFromMap,
} from "../utils/tarotImageHelper";
import { sharedUI } from "../styles/sharedUI";
import { drawCardBackgrounds } from "../styles/drawCardsUI";

type TarotCardDetailRouteProp = RouteProp<
  { TarotCardDetail: { cardId: string } },
  "TarotCardDetail"
>;

function renderWithSuperscriptCitations(
  text: string,
  onCitationPress: () => void,
) {
  const nodes: React.ReactNode[] = [];
  const regex = /(\d+)(?=\s*(?:•|$))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    const numberIndex = match.index;
    if (numberIndex > lastIndex) {
      nodes.push(
        <Text key={`t-${key++}`} style={sharedUI.sectionText}>
          {text.slice(lastIndex, numberIndex)}
        </Text>,
      );
    }
    nodes.push(
      <Text
        key={`s-${key++}`}
        style={styles.superscriptCitation}
        onPress={onCitationPress}
      >
        {match[1]}
      </Text>,
    );
    lastIndex = numberIndex + match[1].length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Text key={`t-${key++}`} style={sharedUI.sectionText}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }

  return nodes;
}

function getElementEmoji(element?: string) {
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
}

function isCourtCard(card: TarotCard) {
  const courtNames = ["Page", "Knight", "Queen", "King"];
  const elementalSuits = ["Wands", "Coins", "Swords", "Cups"];
  return (
    elementalSuits.includes(card.suit) &&
    courtNames.some((name) => card.name.includes(name))
  );
}

export default function TarotCardDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<TarotCardDetailRouteProp>();
  const cardId = route.params?.cardId;
  const {
    tarotCards: allTarotCards,
    loading: tarotLoading,
    selectedDeck,
  } = useTarot();

  const card = useMemo(
    () => allTarotCards.find((c) => c._id === cardId),
    [allTarotCards, cardId],
  );

  const tarotFaceImages = getTarotImages(selectedDeck ?? "rws");
  const getCardImageSource = (c: TarotCard) =>
    resolveTarotFaceFromMap(tarotFaceImages, c.imageName);

  useEffect(() => {
    if (tarotLoading) return;
    if (!cardId || !card) {
      navigation.goBack();
    }
  }, [tarotLoading, cardId, card, navigation]);

  const handleCitationPress = () => {
    navigation.navigate("TarotReferences" as never);
  };

  if (tarotLoading || !card) {
    return (
      <View
        style={[
          sharedUI.loadingContainer,
          { backgroundColor: drawCardBackgrounds.tarot },
        ]}
      >
        <ActivityIndicator size="large" color="#b19cd9" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sharedUI.modalTitle}>{card.name}</Text>
        {!isCourtCard(card) ? (
          <Text style={sharedUI.modalSubtitle}>
            {card.suit} {card.number > 0 && `#${card.number}`}
          </Text>
        ) : null}
        {card.esotericTitle ? (
          <Text style={sharedUI.modalSubtitle}>{card.esotericTitle}</Text>
        ) : null}
        {card.element ? (
          <Text style={sharedUI.modalElement}>
            {getElementEmoji(card.element)} {card.element}
          </Text>
        ) : null}
        {card.dates ? (
          <Text style={sharedUI.modalElement}>{card.dates}</Text>
        ) : null}
        {card.decan ? (
          <Text style={sharedUI.modalElement}>Decan: {card.decan}</Text>
        ) : null}
        {card.decanKeyword ? (
          <Text style={[sharedUI.sectionText, styles.decanKeyword]}>
            {card.decanKeyword}
          </Text>
        ) : null}

        <View
          style={[sharedUI.modalCardImageContainer, styles.cardImageContainer]}
        >
          <Image
            source={getCardImageSource(card)}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.section}>
          <Text style={sharedUI.sectionTitle}>Keywords</Text>
          <Text style={sharedUI.sectionText}>
            {(card.keywords ?? []).join(", ")}
          </Text>
          {(card.keywords2 ?? []).length > 0 ? (
            <Text style={[sharedUI.sectionText, styles.keywords2]}>
              {(card.keywords2 ?? []).join(", ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={sharedUI.sectionTitle}>Description</Text>
          {card.dotsQuotes ? (
            <Text style={[sharedUI.sectionText, styles.dotsQuotes]}>
              {renderWithSuperscriptCitations(
                card.dotsQuotes,
                handleCitationPress,
              )}
            </Text>
          ) : null}
          {card.description1 ? (
            <Text style={sharedUI.sectionText}>{card.description1}</Text>
          ) : null}
          {card.description2 ? (
            <Text style={[sharedUI.sectionText, styles.description2]}>
              {card.description2}
            </Text>
          ) : null}
          {!card.description1 && !card.description2 ? (
            <Text style={sharedUI.sectionText}>{card.description}</Text>
          ) : null}
        </View>

        {card.astrologicalCorrespondence ? (
          <View style={styles.section}>
            <Text style={sharedUI.sectionTitle}>
              Astrological Correspondence
            </Text>
            <Text style={sharedUI.sectionText}>
              {card.astrologicalCorrespondence}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <TouchableOpacity
        style={styles.bottomNavBar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.bottomNavArrow}>‹</Text>
        <Text style={styles.bottomNavText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: drawCardBackgrounds.tarot,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  bottomNavBar: {
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
  bottomNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  bottomNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(230, 230, 250, 0.15)",
  },
  cardImage: {
    width: 240,
    height: 360,
    borderRadius: 12,
  },
  cardImageContainer: {
    marginBottom: 0,
  },
  decanKeyword: {
    marginTop: 8,
    fontStyle: "italic",
  },
  keywords2: {
    marginTop: 8,
  },
  dotsQuotes: {
    marginBottom: 10,
    fontStyle: "italic",
  },
  superscriptCitation: {
    fontSize: 11,
    lineHeight: 18,
    transform: [{ translateY: -4 }],
  },
  description2: {
    marginTop: 10,
  },
});
