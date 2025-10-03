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
  PanResponder,
  Animated,
  Vibration,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Accelerometer } from "expo-sensors";
import { apiService, FlowerEssence } from "../services/api";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface CardPosition {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

interface CardData {
  id: string;
  flower: FlowerEssence;
  position: CardPosition;
  isFlipped: boolean;
  isDragging: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 240; // 3x bigger
const CARD_HEIGHT = 360; // 3x bigger
const CARD_COUNT = 50; // Show all flowers

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

// Card back image
const cardBackImage = require("../../assets/images/tarot/RWSa-X-RL.png");

// ============================================================================
// COMPONENT
// ============================================================================
export default function FlowerDrawScreen({ navigation, route }: any) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [allFlowers, setAllFlowers] = useState<FlowerEssence[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const lastFlipTime = useRef<number>(0);

  // ===== LIFECYCLE =====
  useFocusEffect(
    useCallback(() => {
      const flowers = route.params?.flowers || [];
      if (flowers.length > 0) {
        setAllFlowers(flowers);
        initializeCards(flowers);
      } else {
        // Load flowers directly since this is now the default screen
        loadFlowersAndInitializeCards();
      }
    }, [route.params?.flowers])
  );

  // ===== API FUNCTIONS =====
  const loadFlowersAndInitializeCards = async () => {
    try {
      const response = await apiService.getFlowerEssences("", 1, 200);
      setAllFlowers(response.data);
      initializeCards(response.data);
    } catch (error) {
      console.error("Error loading flowers:", error);
      Alert.alert("Error", "Failed to load flowers");
    }
  };

  // ===== CARD MANAGEMENT =====
  const initializeCards = (flowers: FlowerEssence[]) => {
    const newCards: CardData[] = [];
    const shuffledFlowers = [...flowers].sort(() => Math.random() - 0.5);

    // Scatter cards across the available screen space
    const margin = 50; // Keep some margin from screen edges
    const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

    for (let i = 0; i < CARD_COUNT; i++) {
      const flower = shuffledFlowers[i % shuffledFlowers.length];
      newCards.push({
        id: `card-${i}`,
        flower,
        position: {
          x: margin + Math.random() * availableWidth,
          y: margin + Math.random() * availableHeight,
          rotation: (Math.random() - 0.5) * 60, // Much more varied rotation (-30 to +30 degrees)
          zIndex: i,
        },
        isFlipped: false,
        isDragging: false,
      });
    }

    setCards(newCards);
    setMaxZIndex(CARD_COUNT - 1);
  };

  const shuffleCards = () => {
    Vibration.vibrate(100);
    // Scatter cards across the available screen space
    const margin = 50;
    const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

    setCards((prevCards) =>
      prevCards.map((card) => ({
        ...card,
        position: {
          ...card.position,
          x: margin + Math.random() * availableWidth,
          y: margin + Math.random() * availableHeight,
          rotation: (Math.random() - 0.5) * 60, // Much more varied rotation
        },
        isFlipped: false,
      }))
    );
  };

  const bringToFront = (cardId: string) => {
    setCards((prevCards) =>
      prevCards.map((card) => ({
        ...card,
        position: {
          ...card.position,
          zIndex: card.id === cardId ? maxZIndex + 1 : card.position.zIndex,
        },
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
          return {
            ...card,
            isFlipped: newIsFlipped,
            position: {
              ...card.position,
              rotation: newIsFlipped ? 0 : (Math.random() - 0.5) * 60, // Straighten when flipped, random when face down
            },
          };
        }
        return card;
      })
    );
  };

  const handleCardPress = (cardId: string, event: any) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Regular single/double tap logic
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap - bring to front
      bringToFront(cardId);
    } else {
      // Single tap - bring to front
      bringToFront(cardId);
    }

    lastTapRef.current = now;
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

  // ===== PAN RESPONDER =====
  const createPanResponder = (cardId: string) => {
    const pan = new Animated.ValueXY();
    const scale = new Animated.Value(1);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          // Handle pinch gesture - don't start pan responder
          handlePinchGesture(cardId, evt);
          return false;
        }
        // Only handle single finger touches for dragging
        return touches && touches.length === 1;
      },
      onStartShouldSetPanResponderCapture: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          // Handle pinch gesture - don't capture for pan
          handlePinchGesture(cardId, evt);
          return false;
        }
        return touches && touches.length === 1;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          // Handle pinch gesture during movement
          handlePinchGesture(cardId, evt);
          return false;
        }
        // Only handle single finger movement for dragging
        return (
          touches &&
          touches.length === 1 &&
          (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1)
        );
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          // Handle pinch gesture during movement
          handlePinchGesture(cardId, evt);
          return false;
        }
        // Only capture single finger movement for dragging
        return (
          touches &&
          touches.length === 1 &&
          (Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1)
        );
      },
      onPanResponderTerminationRequest: () => false, // Don't allow other components to steal the responder
      onShouldBlockNativeResponder: () => true, // Block native responder
      onPanResponderGrant: () => {
        bringToFront(cardId);
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === cardId ? { ...card, isDragging: true } : card
          )
        );
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: false,
        }).start();
        // Set offset to current position to prevent jumping
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === cardId ? { ...card, isDragging: false } : card
          )
        );
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
        }).start();

        // Add momentum based on velocity
        const momentumX = gestureState.vx * 50;
        const momentumY = gestureState.vy * 50;

        // Apply momentum to current position
        Animated.timing(pan, {
          toValue: {
            x: (pan.x as any)._value + momentumX,
            y: (pan.y as any)._value + momentumY,
          },
          duration: 300,
          useNativeDriver: false,
        }).start();

        // Don't extract offset - let cards stay where they are flung
      },
    });

    return { pan, scale, panResponder };
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
    const { pan, scale, panResponder } = createPanResponder(card.id);

    return (
      <Animated.View
        key={card.id}
        style={[
          styles.card,
          {
            left: card.position.x,
            top: card.position.y,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { rotate: `${card.position.rotation}deg` },
              { scale },
            ],
            zIndex: card.position.zIndex,
            elevation: card.position.zIndex,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={(event) => handleCardPress(card.id, event)}
          activeOpacity={0.8}
          delayPressIn={0}
          delayPressOut={0}
        >
          <Image
            source={
              card.isFlipped
                ? (card.flower.imageName &&
                    flowerImages[card.flower.imageName]) ||
                  flowerImages["default.jpg"]
                : cardBackImage
            }
            style={styles.cardImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
