// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { FlowerEssence } from "../services/api";
import { useFlowers, FlowerCardData } from "../contexts/FlowersContext";
import OnboardingOverlay from "../components/OnboardingOverlay";
import {
  drawCardBackgrounds,
  drawCardsUI,
  cardStackStyle,
  DRAW_CARD_HEIGHT,
  DRAW_CARD_WIDTH,
} from "../styles/drawCardsUI";
import { useCardDrag } from "../hooks/useCardDrag";
import { useLayoutSize } from "../hooks/useLayoutSize";
import { isWeb, safeVibrate } from "../utils/platformUtils";
import {
  createPointerHandlers,
  createWebTapHandler,
  getTouchCount,
  isSinglePointer,
  type WebTapHandler,
} from "../utils/pointerEvents";
import { setupShakeListener } from "../utils/shakeListener";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================
const INITIAL_CARD_COUNT = 25; // Only render what's visible initially
const MAX_CARD_COUNT = 50; // Total cards we can have

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

// Card back images
const cardBackImages = [
  require("../../assets/images/flowers/flowersCardBack1.webp"),
  require("../../assets/images/flowers/flowersCardBack2.webp"),
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function FlowerDrawScreen({ navigation, route }: any) {
  const { width: layoutWidth, height: layoutHeight } = useLayoutSize();

  const {
    flowers: allFlowers,
    loading: flowersLoading,
    drawState: cards,
    setDrawState: setCards,
    saveDrawState,
    loadDrawState,
  } = useFlowers();
  const [maxZIndex, setMaxZIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const lastFlipTime = useRef<number>(0);
  const webTapHandlersRef = useRef(new Map<string, WebTapHandler>());
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);

  // ===== LIFECYCLE =====
  useFocusEffect(
    useCallback(() => {
      // Only load saved state once when the screen first comes into focus
      if (!hasLoadedInitialState) {
        loadDrawState().then((savedState) => {
          if (savedState && savedState.length > 0) {
            // Restore saved state
            setCards(savedState);
            // Find the highest z-index from saved state
            const maxZ = Math.max(...savedState.map((card) => card.zIndex));
            setMaxZIndex(maxZ);
          } else {
            // Initialize new cards if no saved state
            initializeCards();
          }
          setHasLoadedInitialState(true);
        });
      }

      return setupShakeListener(() => shuffleCards(), { updateIntervalMs: 200 });
    }, [hasLoadedInitialState]),
  );

  // Auto-save draw state whenever cards change
  useEffect(() => {
    if (cards.length > 0) {
      saveDrawState();
    }
  }, [cards, saveDrawState]);

  // ===== CARD MANAGEMENT =====
  const initializeCards = () => {
    const newCards: FlowerCardData[] = [];
    const margin = 50;
    const availableWidth = layoutWidth - DRAW_CARD_WIDTH - margin * 2;
    const availableHeight = layoutHeight - DRAW_CARD_HEIGHT - margin * 2;

    for (let i = 0; i < INITIAL_CARD_COUNT; i++) {
      newCards.push({
        id: `flower-card-${i}`,
        flower: null,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: (Math.random() - 0.5) * 60,
        zIndex: i,
        isFlipped: false,
        isDragging: false,
        cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
        reversed: false, // Will be set when card is flipped
      });
    }

    setCards(newCards);
    setMaxZIndex(INITIAL_CARD_COUNT - 1);
  };

  const shuffleCards = () => {
    safeVibrate(100);
    const margin = 50;
    const availableWidth = layoutWidth - DRAW_CARD_WIDTH - margin * 2;
    const availableHeight = layoutHeight - DRAW_CARD_HEIGHT - margin * 2;

    // If no cards exist, initialize them with random positions
    if (cards.length === 0) {
      const newCards: FlowerCardData[] = [];
      for (let i = 0; i < INITIAL_CARD_COUNT; i++) {
        newCards.push({
          id: `flower-card-${i}`,
          flower: null,
          x: margin + Math.random() * availableWidth,
          y: margin + Math.random() * availableHeight,
          rotation: (Math.random() - 0.5) * 60,
          zIndex: i,
          isFlipped: false,
          isDragging: false,
          cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
          reversed: false,
        });
      }
      setCards(newCards);
      setMaxZIndex(INITIAL_CARD_COUNT - 1);
      return;
    }

    // If cards exist, shuffle their positions
    const shuffledCards = cards.map((card: FlowerCardData) => ({
      ...card,
      x: margin + Math.random() * availableWidth,
      y: margin + Math.random() * availableHeight,
      rotation: (Math.random() - 0.5) * 60,
      isFlipped: false,
      cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
      reversed: false, // Reset reversal when shuffling
    }));
    setCards(shuffledCards);
  };

  const bringToFront = useCallback(
    (cardId: string) => {
      setMaxZIndex((prev) => {
        const next = prev + 1;
        setCards((current) =>
          current.map((card) => ({
            ...card,
            zIndex: card.id === cardId ? next : card.zIndex,
          })),
        );
        return next;
      });
    },
    [setCards],
  );

  const { startDrag, moveDrag, endDrag, didDrag, resetDragTracking } =
    useCardDrag<FlowerCardData>({
      setCards,
      onBringToFront: bringToFront,
    });

  const flipCard = (cardId: string) => {
    const now = Date.now();
    const FLIP_DEBOUNCE = 500; // Prevent rapid flipping

    if (now - lastFlipTime.current < FLIP_DEBOUNCE) {
      return;
    }

    lastFlipTime.current = now;
    const updatedCards = cards.map((card: FlowerCardData) => {
      if (card.id === cardId) {
        const newIsFlipped = !card.isFlipped;

        // Assign a random flower when flipping to show the front
        let assignedFlower = card.flower;
        let isReversed = card.reversed;
        if (newIsFlipped && !card.flower && allFlowers.length > 0) {
          // Pick a random flower from the full collection
          const randomIndex = Math.floor(Math.random() * allFlowers.length);
          assignedFlower = allFlowers[randomIndex];
          // Generate random reversal (50% chance)
          isReversed = Math.random() < 0.5;
        }

        return {
          ...card,
          flower: assignedFlower,
          isFlipped: newIsFlipped,
          reversed: isReversed,
          rotation: newIsFlipped ? 0 : (Math.random() - 0.5) * 60,
        };
      }
      return card;
    });
    setCards(updatedCards);
  };

  const handleCardPress = (cardId: string) => {
    bringToFront(cardId);
  };

  const handleFlipCard = (cardId: string) => {
    flipCard(cardId);
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getWebTapHandler = (cardId: string) => {
    let handler = webTapHandlersRef.current.get(cardId);
    if (!handler) {
      handler = createWebTapHandler();
      webTapHandlersRef.current.set(cardId, handler);
    }
    return handler;
  };

  // ===== RENDER CARD =====
  const renderCard = (card: FlowerCardData) => {
    return (
      <View
        key={card.id}
        style={[
          drawCardsUI.card,
          {
            left: card.x,
            top: card.y,
            transform: [
              { rotate: `${card.rotation}deg` },
              // Add 180-degree rotation if card is reversed and flipped
              ...(card.isFlipped && card.reversed
                ? [{ rotate: "180deg" }]
                : []),
            ],
            ...cardStackStyle(card.zIndex),
          },
        ]}
      >
        <View
          style={drawCardsUI.cardInner}
          {...createPointerHandlers({
            onStart: (event) => {
              const touchCount = getTouchCount(event);
              if (isSinglePointer(event)) {
                startDrag(card.id, event);
              } else if (touchCount === 2) {
                const touches = event.nativeEvent.touches!;
                const currentDistance = getDistance(touches[0], touches[1]);
                lastPinchDistance.current = currentDistance;
              }
            },
            onMove: (event) => {
              const touchCount = getTouchCount(event);
              if (isSinglePointer(event)) {
                moveDrag(card.id, event);
              } else if (touchCount === 2) {
                const touches = event.nativeEvent.touches!;
                const currentDistance = getDistance(touches[0], touches[1]);
                if (lastPinchDistance.current > 0) {
                  const distanceDiff =
                    currentDistance - lastPinchDistance.current;
                  if (distanceDiff > 10) {
                    handleFlipCard(card.id);
                    lastPinchDistance.current = 0;
                  }
                }
                lastPinchDistance.current = currentDistance;
              }
            },
            onEnd: () => {
              endDrag(card.id);
              lastPinchDistance.current = 0;
              if (isWeb) {
                getWebTapHandler(card.id).handleTap(
                  didDrag(),
                  () => handleCardPress(card.id),
                  () => handleFlipCard(card.id),
                );
                resetDragTracking();
              }
            },
          })}
        >
          {isWeb ? (
            <Image
              source={
                card.isFlipped && card.flower
                  ? (card.flower.imageName &&
                      flowerImages[card.flower.imageName]) ||
                    flowerImages["default.jpg"]
                  : cardBackImages[card.cardBackIndex]
              }
              style={drawCardsUI.cardImage}
              resizeMode="contain"
            />
          ) : (
            <TouchableOpacity
              style={drawCardsUI.cardTouchable}
              onPress={() => {
                if (!didDrag()) {
                  handleCardPress(card.id);
                }
                resetDragTracking();
              }}
              onLongPress={() => handleFlipCard(card.id)}
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
                style={drawCardsUI.cardImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ===== LOADING STATE =====
  if (flowersLoading) {
    return (
      <View
        style={[
          drawCardsUI.container,
          { backgroundColor: drawCardBackgrounds.flower },
        ]}
      >
        <StatusBar hidden={true} />
        <View
          style={[
            drawCardsUI.loadingContainer,
            { backgroundColor: drawCardBackgrounds.flower },
          ]}
        >
          <Text style={drawCardsUI.loadingText}>Loading flowers...</Text>
        </View>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View
      style={[
        drawCardsUI.container,
        { backgroundColor: drawCardBackgrounds.flower },
      ]}
    >
      <StatusBar hidden={true} />
      <OnboardingOverlay screenKey="FLOWERS" />
      <TouchableOpacity
        style={drawCardsUI.shuffleButton}
        onPress={shuffleCards}
        activeOpacity={0.8}
      >
        <Text style={drawCardsUI.shuffleButtonText}>SHUFFLE</Text>
      </TouchableOpacity>
      {/* Cards Container - Full Screen */}
      <View style={drawCardsUI.cardsContainer}>{cards.map(renderCard)}</View>
      {/* Search Navigation Bar - Moved to bottom */}
      {/* TODO: Uncomment when ready to implement search functionality */}
      {/* <TouchableOpacity
        style={drawCardsUI.searchNavBar}
        onPress={() => navigation.navigate("FlowersList")}
        activeOpacity={0.8}
      >
        <Text style={drawCardsUI.searchNavText}>SEARCH FLOWER ESSENCES</Text>
        <Text style={drawCardsUI.searchNavArrow}>›</Text>
      </TouchableOpacity> */}
    </View>
  );
}
