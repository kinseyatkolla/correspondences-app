// ============================================================================
// IMPORTS
// ============================================================================
// TypeScript service refresh
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Vibration,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Accelerometer } from "expo-sensors";
import { useTarot, CardData } from "../contexts/TarotContext";
import { drawCardBackgrounds, drawCardsUI } from "../styles/drawCardsUI";
import {
  getTarotImages,
  getTarotCardBackImages,
  resolveTarotFaceFromMap,
} from "../utils/tarotImageHelper";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 240;
const CARD_HEIGHT = 360;
const INITIAL_CARD_COUNT = 24; // Only render what's visible initially
const MAX_CARD_COUNT = 78; // Total cards we can have (full tarot deck)
const CARDS_TO_ADD_THRESHOLD = 5; // Add more cards when this many or fewer face-down cards remain

const DRAW_REF_SYMBOLS_IMAGE = require("../../assets/images/tarot/correspondences/symbols.png");
const DRAW_REF_KEYWORDS_IMAGE = require("../../assets/images/tarot/correspondences/keywords.png");

function centerReferenceCardPosition() {
  return {
    x: (SCREEN_WIDTH - CARD_WIDTH) / 2,
    y: (SCREEN_HEIGHT - CARD_HEIGHT) / 2,
  };
}

/** Half the cards get an extra 180° so asymmetric back art (e.g. wear) varies; then slight tilt ±30°. */
function randomFaceDownRotation(): number {
  const flipBack = Math.random() < 0.5 ? 180 : 0;
  const tilt = (Math.random() - 0.5) * 60;
  return flipBack + tilt;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotDrawScreen({ navigation, route }: any) {
  const {
    tarotCards: allTarotCards,
    loading: tarotLoading,
    selectedDeck,
    drawRefSymbolsEnabled,
    drawRefKeywordsEnabled,
    drawRefSymbolsResetNonce,
    drawRefKeywordsResetNonce,
    drawState: cards,
    setDrawState: setCards,
    saveDrawState,
    loadDrawState,
  } = useTarot();
  const tarotImages = getTarotImages(selectedDeck);
  const cardBackImages = useMemo(
    () => getTarotCardBackImages(selectedDeck),
    [selectedDeck],
  );
  const [maxZIndex, setMaxZIndex] = useState(0);
  const lastTapRef = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const lastFlipTime = useRef<number>(0);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  // Track which tarot cards have been assigned to prevent duplicates
  const [usedTarotCardIds, setUsedTarotCardIds] = useState<Set<string>>(
    new Set(),
  );
  // Shuffle key to force immediate re-render on shuffle
  const [shuffleKey, setShuffleKey] = useState(0);

  const [refSymbolsPos, setRefSymbolsPos] = useState(() =>
    centerReferenceCardPosition(),
  );
  const [refKeywordsPos, setRefKeywordsPos] = useState(() =>
    centerReferenceCardPosition(),
  );
  const [refTop, setRefTop] = useState<"symbols" | "keywords">("symbols");
  const [draggedRef, setDraggedRef] = useState<null | "symbols" | "keywords">(
    null,
  );
  const refDragOffsetRef = useRef({ x: 0, y: 0 });
  const refSymbolsPosRef = useRef(refSymbolsPos);
  const refKeywordsPosRef = useRef(refKeywordsPos);
  refSymbolsPosRef.current = refSymbolsPos;
  refKeywordsPosRef.current = refKeywordsPos;

  useEffect(() => {
    setRefSymbolsPos(centerReferenceCardPosition());
  }, [drawRefSymbolsResetNonce]);

  useEffect(() => {
    setRefKeywordsPos(centerReferenceCardPosition());
  }, [drawRefKeywordsResetNonce]);

  // ===== LIFECYCLE =====
  useFocusEffect(
    useCallback(() => {
      // Only load saved state once when the screen first comes into focus
      if (!hasLoadedInitialState) {
        loadDrawState().then((savedState) => {
          if (savedState && savedState.length > 0) {
            const backs = getTarotCardBackImages(selectedDeck);
            const normalized = savedState.map((c) => ({
              ...c,
              cardBackIndex:
                typeof c.cardBackIndex === "number"
                  ? c.cardBackIndex % backs.length
                  : Math.floor(Math.random() * backs.length),
            }));
            setCards(normalized);
            // Find the highest z-index from saved state
            const maxZ = Math.max(...savedState.map((card) => card.zIndex));
            setMaxZIndex(maxZ);
            // Restore used tarot cards tracking from saved state
            const usedIds = new Set<string>();
            savedState.forEach((card) => {
              if (card.tarotCard?._id) {
                usedIds.add(card.tarotCard._id);
              }
            });
            setUsedTarotCardIds(usedIds);
          } else {
            // Initialize new cards if no saved state
            initializeCards();
          }
          setHasLoadedInitialState(true);
        });
      }

      // Set up accelerometer listener when screen comes into focus
      let lastShake = 0;
      const SHAKE_THRESHOLD = 2.5;
      const SHAKE_TIMEOUT = 3000;

      const handleShake = (event: any) => {
        const { x, y, z } = event;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        if (acceleration > SHAKE_THRESHOLD && now - lastShake > SHAKE_TIMEOUT) {
          lastShake = now;
          shuffleCards();
        }
      };

      // Set up accelerometer with slower update interval for tarot only
      Accelerometer.setUpdateInterval(200);
      const subscription = Accelerometer.addListener(handleShake);

      // Cleanup function - runs when screen loses focus
      return () => {
        subscription?.remove();
        // Note: Don't reset global accelerometer interval as it may interfere with other screens
      };
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
    const newCards: CardData[] = [];
    const margin = 50;
    const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
    const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

    for (let i = 0; i < INITIAL_CARD_COUNT; i++) {
      newCards.push({
        id: `tarot-card-${i}`,
        tarotCard: null,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: randomFaceDownRotation(),
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

    // Reset the used tarot cards tracking when shuffling
    setUsedTarotCardIds(new Set());

    // Increment shuffle key first to force immediate re-render
    setShuffleKey((prev) => prev + 1);

    // Always reset to INITIAL_CARD_COUNT when shuffling
    const newCards: CardData[] = [];
    for (let i = 0; i < INITIAL_CARD_COUNT; i++) {
      newCards.push({
        id: `tarot-card-${i}`,
        tarotCard: null,
        x: margin + Math.random() * availableWidth,
        y: margin + Math.random() * availableHeight,
        rotation: randomFaceDownRotation(),
        zIndex: i,
        isFlipped: false,
        isDragging: false,
        cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
      });
    }
    setCards(newCards);
    setMaxZIndex(INITIAL_CARD_COUNT - 1);
  };

  const addMoreCardsIfNeeded = (currentCards: CardData[]): CardData[] => {
    // Count how many face-down cards remain
    const faceDownCount = currentCards.filter((card) => !card.isFlipped).length;

    // If we're getting close to running out of face-down cards and haven't hit the limit
    // Check if we need to add more cards (trigger when face-down count is at or below threshold)
    if (
      faceDownCount <= CARDS_TO_ADD_THRESHOLD &&
      currentCards.length < MAX_CARD_COUNT
    ) {
      console.log(
        `[addMoreCards] Adding: ${faceDownCount} face-down, ${currentCards.length} total`,
      );
      const margin = 50;
      const availableWidth = SCREEN_WIDTH - CARD_WIDTH - margin * 2;
      const availableHeight = SCREEN_HEIGHT - CARD_HEIGHT - margin * 2;

      // Calculate how many cards to add (don't exceed MAX_CARD_COUNT)
      // Add enough cards to bring us well above the threshold
      const cardsToAdd = Math.min(
        Math.max(8, CARDS_TO_ADD_THRESHOLD + 5), // Add at least 8 cards to avoid frequent additions
        MAX_CARD_COUNT - currentCards.length,
      );

      console.log(
        `[addMoreCards] Will add ${cardsToAdd} cards (max: ${MAX_CARD_COUNT}, current: ${currentCards.length})`,
      );

      // Find the highest card index to continue numbering
      const maxIndex = Math.max(
        ...currentCards.map((card) => {
          const match = card.id.match(/tarot-card-(\d+)/);
          return match ? parseInt(match[1], 10) : -1;
        }),
        -1,
      );

      // Find the minimum z-index of existing cards
      const minZ = Math.min(...currentCards.map((card) => card.zIndex), 0);
      // Use 0 as base z-index for new cards (they'll render, even if they overlap)
      // The important thing is they're added to the array and will be visible
      const baseZ = 0;

      console.log(
        `[addMoreCards] Max index: ${maxIndex}, Min z-index: ${minZ}, Base z-index: ${baseZ}`,
      );

      const newCards: CardData[] = [];
      for (let i = 0; i < cardsToAdd; i++) {
        const cardIndex = maxIndex + 1 + i;
        newCards.push({
          id: `tarot-card-${cardIndex}`,
          tarotCard: null,
          x: margin + Math.random() * availableWidth,
          y: margin + Math.random() * availableHeight,
          rotation: randomFaceDownRotation(),
          zIndex: baseZ + i, // Start from 0 and increment
          isFlipped: false,
          isDragging: false,
          cardBackIndex: Math.floor(Math.random() * cardBackImages.length),
        });
      }

      console.log(
        `[addMoreCards] Created ${
          newCards.length
        } new cards with IDs: ${newCards.map((c) => c.id).join(", ")}`,
      );

      // Add new cards to existing cards
      const updatedCards = [...currentCards, ...newCards];
      console.log(
        `[addMoreCards] Added ${cardsToAdd} cards. New total: ${updatedCards.length} (was ${currentCards.length})`,
      );

      return updatedCards;
    }

    return currentCards;
  };

  const bringToFront = (cardId: string) => {
    // Find the current maximum z-index from all cards
    const currentMaxZ = Math.max(...cards.map((card) => card.zIndex), 0);
    const newMaxZ = currentMaxZ + 1;

    const updatedCards = cards.map((card: CardData) => ({
      ...card,
      zIndex: card.id === cardId ? newMaxZ : card.zIndex,
    }));
    setCards(updatedCards);
    setMaxZIndex(newMaxZ);
  };

  const flipCard = (cardId: string) => {
    const now = Date.now();
    const FLIP_DEBOUNCE = 500; // Prevent rapid flipping

    if (now - lastFlipTime.current < FLIP_DEBOUNCE) {
      return;
    }

    // Don't flip if no tarot cards are available
    if (allTarotCards.length === 0) {
      return;
    }

    lastFlipTime.current = now;
    const updatedCards = cards.map((card: CardData) => {
      if (card.id === cardId) {
        const newIsFlipped = !card.isFlipped;

        // Assign a random tarot card when flipping to show the front
        let assignedTarotCard = card.tarotCard;
        if (newIsFlipped && !card.tarotCard && allTarotCards.length > 0) {
          // Get available cards that haven't been used yet
          // Use the current state value for filtering
          const availableCards = allTarotCards.filter(
            (tarotCard) => !usedTarotCardIds.has(tarotCard._id || ""),
          );

          // If all cards have been used, we can't assign a new one
          if (availableCards.length === 0) {
            // All cards have been used, don't flip this card
            return card;
          }

          // Pick a random tarot card from the available (unused) collection
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          assignedTarotCard = availableCards[randomIndex];

          // Mark this tarot card as used using functional update to ensure we have latest state
          if (assignedTarotCard?._id) {
            const tarotCardId = assignedTarotCard._id;
            setUsedTarotCardIds((prev) => {
              const newSet = new Set(prev);
              newSet.add(tarotCardId);
              return newSet;
            });
          }
        }

        return {
          ...card,
          tarotCard: assignedTarotCard,
          isFlipped: newIsFlipped,
          rotation: newIsFlipped ? 0 : randomFaceDownRotation(),
        };
      }
      return card;
    });

    // Check if we flipped a card face up (not face down)
    const flippedCard = updatedCards.find((card) => card.id === cardId);
    const previousCard = cards.find((c) => c.id === cardId);
    const wasFlippedFaceUp = flippedCard?.isFlipped && !previousCard?.isFlipped;

    // Add more cards if needed (only when flipping face up)
    const finalCards = wasFlippedFaceUp
      ? addMoreCardsIfNeeded(updatedCards)
      : updatedCards;

    console.log(
      `[flipCard] Setting cards: ${finalCards.length} total (was ${cards.length})`,
    );
    setCards(finalCards);
  };

  const handleCardPress = (cardId: string) => {
    bringToFront(cardId);
  };

  const handleCardFlip = (cardId: string) => {
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
      // Don't set isDragging immediately - wait for actual movement
    }
  };

  const handleDragMove = (cardId: string, event: any) => {
    if (draggedCard === cardId) {
      const touch = event.nativeEvent.touches[0];
      const newX = touch.pageX - dragOffset.x;
      const newY = touch.pageY - dragOffset.y;

      const updatedCards = cards.map((c: CardData) =>
        c.id === cardId ? { ...c, x: newX, y: newY, isDragging: true } : c,
      );
      setCards(updatedCards);
    }
  };

  const handleDragEnd = (cardId: string) => {
    if (draggedCard === cardId) {
      setDraggedCard(null);
      const updatedCards = cards.map((c: CardData) =>
        c.id === cardId ? { ...c, isDragging: false } : c,
      );
      setCards(updatedCards);
    }
  };

  // Calculate distance between two touch points
  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const refBaseZ = maxZIndex + 160;
  const refSymbolsZ = refBaseZ + (refTop === "symbols" ? 2 : 0);
  const refKeywordsZ = refBaseZ + (refTop === "keywords" ? 2 : 0);

  const handleRefDragStart = (kind: "symbols" | "keywords", event: any) => {
    const touches = event.nativeEvent.touches;
    if (touches.length !== 1) return;
    const touch = touches[0];
    setRefTop(kind);
    setDraggedRef(kind);
    const pos =
      kind === "symbols" ? refSymbolsPosRef.current : refKeywordsPosRef.current;
    refDragOffsetRef.current = {
      x: touch.pageX - pos.x,
      y: touch.pageY - pos.y,
    };
  };

  const handleRefDragMove = (kind: "symbols" | "keywords", event: any) => {
    if (draggedRef !== kind) return;
    const touches = event.nativeEvent.touches;
    if (touches.length !== 1) return;
    const t = touches[0];
    const nx = t.pageX - refDragOffsetRef.current.x;
    const ny = t.pageY - refDragOffsetRef.current.y;
    if (kind === "symbols") {
      setRefSymbolsPos({ x: nx, y: ny });
    } else {
      setRefKeywordsPos({ x: nx, y: ny });
    }
  };

  const handleRefDragEnd = (kind: "symbols" | "keywords") => {
    if (draggedRef === kind) {
      setDraggedRef(null);
    }
  };

  const renderDrawReferenceCard = (
    kind: "symbols" | "keywords",
    pos: { x: number; y: number },
    zStyle: number,
    source: typeof DRAW_REF_SYMBOLS_IMAGE,
  ) => (
    <View
      key={`draw-ref-${kind}`}
      style={[
        drawCardsUI.card,
        {
          left: pos.x,
          top: pos.y,
          transform: [{ rotate: "0deg" }],
          zIndex: zStyle,
          elevation: zStyle,
        },
      ]}
    >
      <View
        onTouchStart={(e: any) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 1) {
            handleRefDragStart(kind, e);
          }
        }}
        onTouchMove={(e: any) => {
          const touches = e.nativeEvent.touches;
          if (touches.length === 1) {
            handleRefDragMove(kind, e);
          }
        }}
        onTouchEnd={() => handleRefDragEnd(kind)}
      >
        {/* Plain View: avoids nested Pressability with parent touch handlers (trackedTouchCount). */}
        <View style={drawCardsUI.cardTouchable}>
          <Image
            source={source}
            style={drawCardsUI.cardImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );

  // ===== RENDER CARD =====
  const renderCard = (card: CardData) => {
    return (
      <View
        key={card.id}
        style={[
          drawCardsUI.card,
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
                  handleCardFlip(card.id);
                  lastPinchDistance.current = 0;
                }
              }
              lastPinchDistance.current = currentDistance;
            }
          }}
          onTouchEnd={() => {
            // Always end drag on finger-up; touches.length is often 0 here, not 1.
            handleDragEnd(card.id);
            lastPinchDistance.current = 0;
          }}
        >
          <TouchableOpacity
            style={drawCardsUI.cardTouchable}
            onPress={() => {
              if (!card.isDragging) {
                handleCardPress(card.id);
              }
            }}
            onLongPress={() => {
              if (!card.isDragging) {
                handleCardFlip(card.id);
              }
            }}
            activeOpacity={1}
          >
            <Image
              key={`${card.id}-${shuffleKey}`}
              source={
                card.isFlipped && card.tarotCard
                  ? resolveTarotFaceFromMap(
                      tarotImages,
                      card.tarotCard.imageName,
                    )
                  : cardBackImages[
                      (card.cardBackIndex ?? 0) % cardBackImages.length
                    ]
              }
              style={drawCardsUI.cardImage}
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
      <View
        style={[
          drawCardsUI.container,
          { backgroundColor: drawCardBackgrounds.tarot },
        ]}
      >
        <StatusBar hidden={true} />
        <View
          style={[
            drawCardsUI.loadingContainer,
            { backgroundColor: drawCardBackgrounds.tarot },
          ]}
        >
          <Text style={drawCardsUI.loadingText}>
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
    <View
      style={[
        drawCardsUI.container,
        { backgroundColor: drawCardBackgrounds.tarot },
      ]}
    >
      <StatusBar hidden={true} />
      {/* Back gesture area */}
      <TouchableOpacity
        style={drawCardsUI.backGestureArea}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      />
      {/* Cards Container - Full Screen */}
      <View style={drawCardsUI.cardsContainer}>
        {cards.map(renderCard)}
        {drawRefKeywordsEnabled &&
          renderDrawReferenceCard(
            "keywords",
            refKeywordsPos,
            refKeywordsZ,
            DRAW_REF_KEYWORDS_IMAGE,
          )}
        {drawRefSymbolsEnabled &&
          renderDrawReferenceCard(
            "symbols",
            refSymbolsPos,
            refSymbolsZ,
            DRAW_REF_SYMBOLS_IMAGE,
          )}
      </View>
      <TouchableOpacity
        style={drawCardsUI.searchNavBar}
        onPress={() => navigation.navigate("TarotList")}
        activeOpacity={0.8}
      >
        <Text style={drawCardsUI.searchNavText}>SEARCH</Text>
        <Text style={drawCardsUI.searchNavArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}
