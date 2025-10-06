// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  StatusBar,
  Vibration,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Accelerometer } from "expo-sensors";
import { FlowerEssence } from "../services/api";
import { useFlowers } from "../contexts/FlowersContext";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CardData {
  id: string;
  flower: FlowerEssence | null; // null means not assigned yet
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  isFlipped: boolean;
  isDragging: boolean;
  cardBackIndex: number; // Index for random card back selection
}

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 240; // 3x bigger
const CARD_HEIGHT = 360; // 3x bigger
const INITIAL_CARD_COUNT = 25; // Only render what's visible initially
const MAX_CARD_COUNT = 50; // Total cards we can have

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

// Card back images
const cardBackImages = [
  require("../../assets/images/flowers/flowersCardBack1.png"),
  require("../../assets/images/flowers/flowersCardBack2.png"),
  require("../../assets/images/flowers/flowersCardBack3.png"),
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function FlowerDrawScreen({ navigation, route }: any) {
  const { flowers: allFlowers, loading: flowersLoading } = useFlowers();
  const [cards, setCards] = useState<CardData[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const lastFlipTime = useRef<number>(0);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // ===== LIFECYCLE =====
  useFocusEffect(
    useCallback(() => {
      if (allFlowers.length > 0) {
        initializeCards();
      }
    }, [allFlowers])
  );

  // ===== CARD MANAGEMENT =====
  const initializeCards = () => {
    const newCards: CardData[] = [];
    const margin = 50;
    const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

    for (let i = 0; i < INITIAL_CARD_COUNT; i++) {
      newCards.push({
        id: `card-${i}`,
        flower: null,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: (Math.random() - 0.5) * 60,
        zIndex: i,
        isFlipped: false,
        isDragging: false,
        cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
      });
    }

    setCards(newCards);
    setMaxZIndex(INITIAL_CARD_COUNT - 1);
  };

  const shuffleCards = () => {
    Vibration.vibrate(100);
    const margin = 50;
    const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

    setCards((prevCards) =>
      prevCards.map((card) => ({
        ...card,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: (Math.random() - 0.5) * 60,
        isFlipped: false,
        cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
      }))
    );
  };

  const bringToFront = (cardId: string) => {
    setCards((prevCards) =>
      prevCards.map((card) => ({
        ...card,
        zIndex: card.id === cardId ? maxZIndex + 1 : card.zIndex,
      }))
    );
    setMaxZIndex((prev) => prev + 1);
  };

  const flipCard = (cardId: string) => {
    const now = Date.now();
    const FLIP_DEBOUNCE = 500; // Prevent rapid flipping

    if (now - lastFlipTime.current < FLIP_DEBOUNCE) {
      console.log("Flip debounced - too soon");
      return;
    }

    lastFlipTime.current = now;
    console.log("Flipping card:", cardId);
    setCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === cardId) {
          const newIsFlipped = !card.isFlipped;
          console.log("Card flip state changed to:", newIsFlipped);

          // Assign a random flower when flipping to show the front
          let assignedFlower = card.flower;
          if (newIsFlipped && !card.flower && allFlowers.length > 0) {
            // Pick a random flower from the full collection
            const randomIndex = Math.floor(Math.random() * allFlowers.length);
            assignedFlower = allFlowers[randomIndex];
          }

          return {
            ...card,
            flower: assignedFlower,
            isFlipped: newIsFlipped,
            rotation: newIsFlipped ? 0 : (Math.random() - 0.5) * 60,
          };
        }
        return card;
      })
    );
  };

  const handleCardPress = (cardId: string) => {
    bringToFront(cardId);
  };

  const handleCardLongPress = (cardId: string) => {
    flipCard(cardId);
  };

  const handleDragStart = (cardId: string, event: any) => {
    const touch = event.nativeEvent.touches[0];
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      setDraggedCard(cardId);
      setDragOffset({
        x: touch.pageX - card.x,
        y: touch.pageY - card.y,
      });
      bringToFront(cardId);
      setCards((prevCards) =>
        prevCards.map((c) => (c.id === cardId ? { ...c, isDragging: true } : c))
      );
    }
  };

  const handleDragMove = (cardId: string, event: any) => {
    if (draggedCard === cardId) {
      const touch = event.nativeEvent.touches[0];
      const newX = touch.pageX - dragOffset.x;
      const newY = touch.pageY - dragOffset.y;

      setCards((prevCards) =>
        prevCards.map((c) => (c.id === cardId ? { ...c, x: newX, y: newY } : c))
      );
    }
  };

  const handleDragEnd = (cardId: string) => {
    if (draggedCard === cardId) {
      setDraggedCard(null);
      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === cardId ? { ...c, isDragging: false } : c
        )
      );
    }
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle pinch gesture for flipping cards
  const handlePinchGesture = (cardId: string, event: any) => {
    const touches = event.nativeEvent.touches;

    if (touches.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1]);
      console.log(
        "Pinch detected - distance:",
        currentDistance,
        "last:",
        lastPinchDistance.current
      );

      if (lastPinchDistance.current > 0) {
        const distanceDiff = currentDistance - lastPinchDistance.current;
        console.log("Distance difference:", distanceDiff);

        // If fingers are spreading apart (expanding), flip the card
        if (distanceDiff > 10) {
          // Lower threshold for more responsive expansion
          console.log("Flipping card due to pinch expansion");
          flipCard(cardId);
          lastPinchDistance.current = 0; // Reset to prevent multiple flips
          return;
        }
      }

      lastPinchDistance.current = currentDistance;
    } else {
      lastPinchDistance.current = 0; // Reset when not 2 fingers
    }
  };

  // ===== SHAKE DETECTION =====
  useEffect(() => {
    let lastShake = 0;
    const SHAKE_THRESHOLD = 2.5; // Increased from 1.2 to make it less sensitive
    const SHAKE_TIMEOUT = 3000; // Increased from 1000ms to 3000ms (3 seconds)

    const handleShake = (event: any) => {
      const { x, y, z } = event;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (acceleration > SHAKE_THRESHOLD && now - lastShake > SHAKE_TIMEOUT) {
        lastShake = now;
        shuffleCards();
      }
    };

    // Set up accelerometer with slower update interval
    Accelerometer.setUpdateInterval(200); // Slower updates to reduce sensitivity
    const subscription = Accelerometer.addListener(handleShake);

    return () => {
      subscription?.remove();
    };
  }, []);

  // ===== RENDER CARD =====
  const renderCard = (card: CardData) => {
    return (
      <View
        key={card.id}
        style={[
          styles.card,
          {
            left: card.x,
            top: card.y,
            transform: [{ rotate: `${card.rotation}deg` }],
            zIndex: card.zIndex,
            elevation: card.zIndex,
          },
        ]}
      >
        <View
          onTouchStart={(event: any) => {
            const touches = event.nativeEvent.touches;
            if (touches.length === 1) {
              // Single finger - start drag
              handleDragStart(card.id, event);
            } else if (touches.length === 2) {
              // Two fingers - start pinch gesture
              const currentDistance = getDistance(touches[0], touches[1]);
              lastPinchDistance.current = currentDistance;
            }
          }}
          onTouchMove={(event: any) => {
            const touches = event.nativeEvent.touches;
            if (touches.length === 1) {
              // Single finger - continue drag
              handleDragMove(card.id, event);
            } else if (touches.length === 2) {
              // Two fingers - handle pinch gesture
              const currentDistance = getDistance(touches[0], touches[1]);
              if (lastPinchDistance.current > 0) {
                const distanceDiff =
                  currentDistance - lastPinchDistance.current;
                if (distanceDiff > 10) {
                  handleCardLongPress(card.id);
                  lastPinchDistance.current = 0;
                }
              }
              lastPinchDistance.current = currentDistance;
            }
          }}
          onTouchEnd={(event: any) => {
            const touches = event.nativeEvent.touches;
            if (touches.length === 1) {
              // Single finger - end drag
              handleDragEnd(card.id);
            }
            lastPinchDistance.current = 0;
          }}
        >
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={() => handleCardPress(card.id)}
            onLongPress={() => handleCardLongPress(card.id)}
            activeOpacity={1}
          >
            <Image
              source={
                card.isFlipped && card.flower
                  ? (card.flower.imageName &&
                      flowerImages[card.flower.imageName]) ||
                    flowerImages["default.jpg"]
                  : cardBackImages[card.cardBackIndex]
              }
              style={styles.cardImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ===== LOADING STATE =====
  if (flowersLoading) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading flowers...</Text>
        </View>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* Back gesture area */}
      <TouchableOpacity
        style={styles.backGestureArea}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      />
      {/* Search Navigation Bar */}
      <TouchableOpacity
        style={styles.searchNavBar}
        onPress={() => navigation.navigate("FlowersList")}
        activeOpacity={0.8}
      >
        <Text style={styles.searchNavText}>SEARCH FLOWER ESSENCES</Text>
        <Text style={styles.searchNavArrow}>›</Text>
      </TouchableOpacity>
      {/* Cards Container - Full Screen */}
      <View style={styles.cardsContainer}>{cards.map(renderCard)}</View>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backGestureArea: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 9999,
  },
  searchNavBar: {
    position: "absolute",
    top: 0,
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
  searchNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  searchNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e2515",
  },
  loadingText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardsContainer: {
    flex: 1,
    position: "relative",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    marginTop: 90, // Account for search nav bar (40) + back gesture area (50)
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
