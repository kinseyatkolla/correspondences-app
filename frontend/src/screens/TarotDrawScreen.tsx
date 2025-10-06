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
import { TarotCard } from "../services/api";
import { useTarot } from "../contexts/TarotContext";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CardData {
  id: string;
  tarotCard: TarotCard | null; // null means not assigned yet
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  isFlipped: boolean;
  isDragging: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 240; // 3x bigger
const CARD_HEIGHT = 360; // 3x bigger
const INITIAL_CARD_COUNT = 25; // Only render what's visible initially
const MAX_CARD_COUNT = 50; // Total cards we can have

// Import all tarot card images
const tarotImages: { [key: string]: any } = {
  "RWSa-C-02.png": require("../../assets/images/tarot/RWSa-C-02.png"),
  "RWSa-C-03.png": require("../../assets/images/tarot/RWSa-C-03.png"),
  "RWSa-C-04.png": require("../../assets/images/tarot/RWSa-C-04.png"),
  "RWSa-C-05.png": require("../../assets/images/tarot/RWSa-C-05.png"),
  "RWSa-C-06.png": require("../../assets/images/tarot/RWSa-C-06.png"),
  "RWSa-C-07.png": require("../../assets/images/tarot/RWSa-C-07.png"),
  "RWSa-C-08.png": require("../../assets/images/tarot/RWSa-C-08.png"),
  "RWSa-C-09.png": require("../../assets/images/tarot/RWSa-C-09.png"),
  "RWSa-C-0A.png": require("../../assets/images/tarot/RWSa-C-0A.png"),
  "RWSa-C-10.png": require("../../assets/images/tarot/RWSa-C-10.png"),
  "RWSa-C-J1.png": require("../../assets/images/tarot/RWSa-C-J1.png"),
  "RWSa-C-J2.png": require("../../assets/images/tarot/RWSa-C-J2.png"),
  "RWSa-C-KI.png": require("../../assets/images/tarot/RWSa-C-KI.png"),
  "RWSa-C-QU.png": require("../../assets/images/tarot/RWSa-C-QU.png"),
  "RWSa-P-02.png": require("../../assets/images/tarot/RWSa-P-02.png"),
  "RWSa-P-03.png": require("../../assets/images/tarot/RWSa-P-03.png"),
  "RWSa-P-04.png": require("../../assets/images/tarot/RWSa-P-04.png"),
  "RWSa-P-05.png": require("../../assets/images/tarot/RWSa-P-05.png"),
  "RWSa-P-06.png": require("../../assets/images/tarot/RWSa-P-06.png"),
  "RWSa-P-07.png": require("../../assets/images/tarot/RWSa-P-07.png"),
  "RWSa-P-08.png": require("../../assets/images/tarot/RWSa-P-08.png"),
  "RWSa-P-09.png": require("../../assets/images/tarot/RWSa-P-09.png"),
  "RWSa-P-0A.png": require("../../assets/images/tarot/RWSa-P-0A.png"),
  "RWSa-P-10.png": require("../../assets/images/tarot/RWSa-P-10.png"),
  "RWSa-P-J1.png": require("../../assets/images/tarot/RWSa-P-J1.png"),
  "RWSa-P-J2.png": require("../../assets/images/tarot/RWSa-P-J2.png"),
  "RWSa-P-KI.png": require("../../assets/images/tarot/RWSa-P-KI.png"),
  "RWSa-P-QU.png": require("../../assets/images/tarot/RWSa-P-QU.png"),
  "RWSa-S-02.png": require("../../assets/images/tarot/RWSa-S-02.png"),
  "RWSa-S-03.png": require("../../assets/images/tarot/RWSa-S-03.png"),
  "RWSa-S-04.png": require("../../assets/images/tarot/RWSa-S-04.png"),
  "RWSa-S-05.png": require("../../assets/images/tarot/RWSa-S-05.png"),
  "RWSa-S-06.png": require("../../assets/images/tarot/RWSa-S-06.png"),
  "RWSa-S-07.png": require("../../assets/images/tarot/RWSa-S-07.png"),
  "RWSa-S-08.png": require("../../assets/images/tarot/RWSa-S-08.png"),
  "RWSa-S-09.png": require("../../assets/images/tarot/RWSa-S-09.png"),
  "RWSa-S-0A.png": require("../../assets/images/tarot/RWSa-S-0A.png"),
  "RWSa-S-10.png": require("../../assets/images/tarot/RWSa-S-10.png"),
  "RWSa-S-J1.png": require("../../assets/images/tarot/RWSa-S-J1.png"),
  "RWSa-S-J2.png": require("../../assets/images/tarot/RWSa-S-J2.png"),
  "RWSa-S-KI.png": require("../../assets/images/tarot/RWSa-S-KI.png"),
  "RWSa-S-QU.png": require("../../assets/images/tarot/RWSa-S-QU.png"),
  "RWSa-T-00.png": require("../../assets/images/tarot/RWSa-T-00.png"),
  "RWSa-T-01.png": require("../../assets/images/tarot/RWSa-T-01.png"),
  "RWSa-T-02.png": require("../../assets/images/tarot/RWSa-T-02.png"),
  "RWSa-T-03.png": require("../../assets/images/tarot/RWSa-T-03.png"),
  "RWSa-T-04.png": require("../../assets/images/tarot/RWSa-T-04.png"),
  "RWSa-T-05.png": require("../../assets/images/tarot/RWSa-T-05.png"),
  "RWSa-T-06.png": require("../../assets/images/tarot/RWSa-T-06.png"),
  "RWSa-T-07.png": require("../../assets/images/tarot/RWSa-T-07.png"),
  "RWSa-T-08.png": require("../../assets/images/tarot/RWSa-T-08.png"),
  "RWSa-T-09.png": require("../../assets/images/tarot/RWSa-T-09.png"),
  "RWSa-T-10.png": require("../../assets/images/tarot/RWSa-T-10.png"),
  "RWSa-T-11.png": require("../../assets/images/tarot/RWSa-T-11.png"),
  "RWSa-T-12.png": require("../../assets/images/tarot/RWSa-T-12.png"),
  "RWSa-T-13.png": require("../../assets/images/tarot/RWSa-T-13.png"),
  "RWSa-T-14.png": require("../../assets/images/tarot/RWSa-T-14.png"),
  "RWSa-T-15.png": require("../../assets/images/tarot/RWSa-T-15.png"),
  "RWSa-T-16.png": require("../../assets/images/tarot/RWSa-T-16.png"),
  "RWSa-T-17.png": require("../../assets/images/tarot/RWSa-T-17.png"),
  "RWSa-T-18.png": require("../../assets/images/tarot/RWSa-T-18.png"),
  "RWSa-T-19.png": require("../../assets/images/tarot/RWSa-T-19.png"),
  "RWSa-T-20.png": require("../../assets/images/tarot/RWSa-T-20.png"),
  "RWSa-T-21.png": require("../../assets/images/tarot/RWSa-T-21.png"),
  "RWSa-W-02.png": require("../../assets/images/tarot/RWSa-W-02.png"),
  "RWSa-W-03.png": require("../../assets/images/tarot/RWSa-W-03.png"),
  "RWSa-W-04.png": require("../../assets/images/tarot/RWSa-W-04.png"),
  "RWSa-W-05.png": require("../../assets/images/tarot/RWSa-W-05.png"),
  "RWSa-W-06.png": require("../../assets/images/tarot/RWSa-W-06.png"),
  "RWSa-W-07.png": require("../../assets/images/tarot/RWSa-W-07.png"),
  "RWSa-W-08.png": require("../../assets/images/tarot/RWSa-W-08.png"),
  "RWSa-W-09.png": require("../../assets/images/tarot/RWSa-W-09.png"),
  "RWSa-W-0A.png": require("../../assets/images/tarot/RWSa-W-0A.png"),
  "RWSa-W-10.png": require("../../assets/images/tarot/RWSa-W-10.png"),
  "RWSa-W-J1.png": require("../../assets/images/tarot/RWSa-W-J1.png"),
  "RWSa-W-J2.png": require("../../assets/images/tarot/RWSa-W-J2.png"),
  "RWSa-W-KI.png": require("../../assets/images/tarot/RWSa-W-KI.png"),
  "RWSa-W-QU.png": require("../../assets/images/tarot/RWSa-W-QU.png"),
};
// Map database imageName to actual file names
const imageNameToFile: { [key: string]: string } = {
  // Major Arcana
  "fool.jpg": "RWSa-T-00.png",
  "magician.jpg": "RWSa-T-01.png",
  "high-priestess.jpg": "RWSa-T-02.png",
  "empress.jpg": "RWSa-T-03.png",
  "emperor.jpg": "RWSa-T-04.png",
  "hierophant.jpg": "RWSa-T-05.png",
  "lovers.jpg": "RWSa-T-06.png",
  "chariot.jpg": "RWSa-T-07.png",
  "strength.jpg": "RWSa-T-08.png",
  "hermit.jpg": "RWSa-T-09.png",
  "wheel-of-fortune.jpg": "RWSa-T-10.png",
  "justice.jpg": "RWSa-T-11.png",
  "hanged-man.jpg": "RWSa-T-12.png",
  "death.jpg": "RWSa-T-13.png",
  "temperance.jpg": "RWSa-T-14.png",
  "devil.jpg": "RWSa-T-15.png",
  "tower.jpg": "RWSa-T-16.png",
  "star.jpg": "RWSa-T-17.png",
  "moon.jpg": "RWSa-T-18.png",
  "sun.jpg": "RWSa-T-19.png",
  "judgement.jpg": "RWSa-T-20.png",
  "world.jpg": "RWSa-T-21.png",

  // Cups (C)
  "ace-cups.jpg": "RWSa-C-02.png",
  "two-cups.jpg": "RWSa-C-03.png",
  "three-cups.jpg": "RWSa-C-04.png",
  "four-cups.jpg": "RWSa-C-05.png",
  "five-cups.jpg": "RWSa-C-06.png",
  "six-cups.jpg": "RWSa-C-07.png",
  "seven-cups.jpg": "RWSa-C-08.png",
  "eight-cups.jpg": "RWSa-C-09.png",
  "nine-cups.jpg": "RWSa-C-10.png",
  "ten-cups.jpg": "RWSa-C-0A.png",
  "page-cups.jpg": "RWSa-C-J1.png",
  "knight-cups.jpg": "RWSa-C-J2.png",
  "queen-cups.jpg": "RWSa-C-QU.png",
  "king-cups.jpg": "RWSa-C-KI.png",

  // Wands (W)
  "ace-of-wands.jpg": "RWSa-W-02.png",
  "two-of-wands.jpg": "RWSa-W-03.png",
  "three-of-wands.jpg": "RWSa-W-04.png",
  "four-of-wands.jpg": "RWSa-W-05.png",
  "five-of-wands.jpg": "RWSa-W-06.png",
  "six-of-wands.jpg": "RWSa-W-07.png",
  "seven-of-wands.jpg": "RWSa-W-08.png",
  "eight-of-wands.jpg": "RWSa-W-09.png",
  "nine-of-wands.jpg": "RWSa-W-10.png",
  "ten-of-wands.jpg": "RWSa-W-0A.png",
  "page-of-wands.jpg": "RWSa-W-J1.png",
  "knight-of-wands.jpg": "RWSa-W-J2.png",
  "queen-of-wands.jpg": "RWSa-W-QU.png",
  "king-of-wands.jpg": "RWSa-W-KI.png",

  // Swords (S)
  "ace-of-swords.jpg": "RWSa-S-02.png",
  "two-of-swords.jpg": "RWSa-S-03.png",
  "three-of-swords.jpg": "RWSa-S-04.png",
  "four-of-swords.jpg": "RWSa-S-05.png",
  "five-of-swords.jpg": "RWSa-S-06.png",
  "six-of-swords.jpg": "RWSa-S-07.png",
  "seven-of-swords.jpg": "RWSa-S-08.png",
  "eight-of-swords.jpg": "RWSa-S-09.png",
  "nine-of-swords.jpg": "RWSa-S-10.png",
  "ten-of-swords.jpg": "RWSa-S-0A.png",
  "page-of-swords.jpg": "RWSa-S-J1.png",
  "knight-of-swords.jpg": "RWSa-S-J2.png",
  "queen-of-swords.jpg": "RWSa-S-QU.png",
  "king-of-swords.jpg": "RWSa-S-KI.png",

  // Pentacles (P)
  "ace-of-pentacles.jpg": "RWSa-P-02.png",
  "two-of-pentacles.jpg": "RWSa-P-03.png",
  "three-of-pentacles.jpg": "RWSa-P-04.png",
  "four-of-pentacles.jpg": "RWSa-P-05.png",
  "five-of-pentacles.jpg": "RWSa-P-06.png",
  "six-of-pentacles.jpg": "RWSa-P-07.png",
  "seven-of-pentacles.jpg": "RWSa-P-08.png",
  "eight-of-pentacles.jpg": "RWSa-P-09.png",
  "nine-of-pentacles.jpg": "RWSa-P-10.png",
  "ten-of-pentacles.jpg": "RWSa-P-0A.png",
  "page-of-pentacles.jpg": "RWSa-P-J1.png",
  "knight-of-pentacles.jpg": "RWSa-P-J2.png",
  "queen-of-pentacles.jpg": "RWSa-P-QU.png",
  "king-of-pentacles.jpg": "RWSa-P-KI.png",
};

// Card back image
const cardBackImage = require("../../assets/images/tarot/RWSa-X-RL.png");

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotDrawScreen({ navigation, route }: any) {
  const { tarotCards: allTarotCards, loading: tarotLoading } = useTarot();

  // Debug logging
  console.log("TarotDrawScreen - allTarotCards length:", allTarotCards.length);
  console.log("TarotDrawScreen - tarotLoading:", tarotLoading);
  console.log("TarotDrawScreen - allTarotCards:", allTarotCards);
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
      initializeCards();
    }, [])
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
        tarotCard: null,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: (Math.random() - 0.5) * 60,
        zIndex: i,
        isFlipped: false,
        isDragging: false,
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

    // Don't flip if no tarot cards are available
    if (allTarotCards.length === 0) {
      console.log("Cannot flip card - no tarot cards available");
      return;
    }

    lastFlipTime.current = now;
    console.log("Flipping card:", cardId);
    console.log("Available tarot cards:", allTarotCards.length);
    setCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === cardId) {
          const newIsFlipped = !card.isFlipped;
          console.log("Card flip state changed to:", newIsFlipped);
          console.log("Current card tarotCard:", card.tarotCard);

          // Assign a random tarot card when flipping to show the front
          let assignedTarotCard = card.tarotCard;
          if (newIsFlipped && !card.tarotCard && allTarotCards.length > 0) {
            // Pick a random tarot card from the full collection
            const randomIndex = Math.floor(
              Math.random() * allTarotCards.length
            );
            assignedTarotCard = allTarotCards[randomIndex];
            console.log(
              "Assigned tarot card:",
              assignedTarotCard?.name,
              assignedTarotCard?.imageName
            );
          }

          return {
            ...card,
            tarotCard: assignedTarotCard,
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
    console.log("Long press detected on card:", cardId);
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
                  console.log("Pinch expansion detected on card:", card.id);
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
            onPress={() => !card.isDragging && handleCardPress(card.id)}
            onLongPress={() => !card.isDragging && handleCardLongPress(card.id)}
            activeOpacity={1}
          >
            <Image
              source={
                card.isFlipped && card.tarotCard
                  ? (() => {
                      console.log(
                        "Rendering tarot card image:",
                        card.tarotCard?.name,
                        card.tarotCard?.imageName
                      );
                      const mappedFileName = card.tarotCard.imageName
                        ? imageNameToFile[card.tarotCard.imageName]
                        : null;
                      console.log("Mapped file name:", mappedFileName);
                      return (
                        (mappedFileName && tarotImages[mappedFileName]) ||
                        tarotImages["RWSa-T-00.png"]
                      );
                    })()
                  : cardBackImage
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
  if (tarotLoading || allTarotCards.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {tarotLoading
              ? "Loading tarot cards..."
              : "No tarot cards available"}
          </Text>
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
      {/* Cards Container - Full Screen */}
      <View style={styles.cardsContainer}>{cards.map(renderCard)}</View>
      {/* Search Navigation Bar - Moved to bottom */}
      <TouchableOpacity
        style={styles.searchNavBar}
        onPress={() => navigation.navigate("TarotList")}
        activeOpacity={0.8}
      >
        <Text style={styles.searchNavText}>SEARCH TAROT CARDS</Text>
        <Text style={styles.searchNavArrow}>›</Text>
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
    marginTop: 50, // Account for back gesture area only (50)
    marginBottom: 40, // Account for search nav bar only (40)
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
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
