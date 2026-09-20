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
import type { ImageSourcePropType } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTarot, CardData } from "../contexts/TarotContext";
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
  beginDocumentDrag,
  createPointerHandlers,
  createWebTapHandler,
  endDocumentDrag,
  getPrimaryPointer,
  getTouchCount,
  isSinglePointer,
  type WebTapHandler,
} from "../utils/pointerEvents";
import { setupShakeListener } from "../utils/shakeListener";
import {
  getTarotImages,
  getTarotCardBackImages,
  resolveTarotFaceFromMap,
  resolveTarotGuidebookFromImageName,
} from "../utils/tarotImageHelper";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================
const INITIAL_CARD_COUNT = 24; // Only render what's visible initially
const MAX_CARD_COUNT = 78; // Total cards we can have (full tarot deck)
const CARDS_TO_ADD_THRESHOLD = 5; // Add more cards when this many or fewer face-down cards remain

const DRAW_REF_SYMBOLS_IMAGE = require("../../assets/images/tarot/correspondences/symbols.webp");
const DRAW_REF_KEYWORDS_IMAGE = require("../../assets/images/tarot/correspondences/keywords.webp");

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
  const { width: layoutWidth, height: layoutHeight } = useLayoutSize();

  const centerReferenceCardPosition = useCallback(
    () => ({
      x: (layoutWidth - DRAW_CARD_WIDTH) / 2,
      y: (layoutHeight - DRAW_CARD_HEIGHT) / 2,
    }),
    [layoutWidth, layoutHeight],
  );

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
  const maxZIndexRef = useRef(0);
  const lastTapRef = useRef<number>(0);
  const lastPinchDistance = useRef<number>(0);
  const lastFlipTime = useRef<number>(0);
  const webTapHandlersRef = useRef(new Map<string, WebTapHandler>());
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false);
  // Track which tarot cards have been assigned to prevent duplicates
  const [usedTarotCardIds, setUsedTarotCardIds] = useState<Set<string>>(
    new Set(),
  );
  // Shuffle key to force immediate re-render on shuffle
  const [shuffleKey, setShuffleKey] = useState(0);
  const [guidebookSource, setGuidebookSource] =
    useState<ImageSourcePropType | null>(null);

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
  }, [drawRefSymbolsResetNonce, centerReferenceCardPosition]);

  useEffect(() => {
    setRefKeywordsPos(centerReferenceCardPosition());
  }, [drawRefKeywordsResetNonce, centerReferenceCardPosition]);

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
            maxZIndexRef.current = maxZ;
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
    const newCards: CardData[] = [];
    const margin = 50;
    const availableWidth = layoutWidth - DRAW_CARD_WIDTH - margin * 2;
    const availableHeight = layoutHeight - DRAW_CARD_HEIGHT - margin * 2;

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
    maxZIndexRef.current = INITIAL_CARD_COUNT - 1;
    setMaxZIndex(INITIAL_CARD_COUNT - 1);
  };

  const shuffleCards = () => {
    safeVibrate(100);

    const margin = 50;
    const availableWidth = layoutWidth - DRAW_CARD_WIDTH - margin * 2;
    const availableHeight = layoutHeight - DRAW_CARD_HEIGHT - margin * 2;

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
    maxZIndexRef.current = INITIAL_CARD_COUNT - 1;
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
      const availableWidth = layoutWidth - DRAW_CARD_WIDTH - margin * 2;
      const availableHeight = layoutHeight - DRAW_CARD_HEIGHT - margin * 2;

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

  const bringToFront = useCallback(
    (cardId: string) => {
      const next = maxZIndexRef.current + 1;
      maxZIndexRef.current = next;
      setMaxZIndex(next);
      setCards((prev) =>
        prev.map((card) => ({
          ...card,
          zIndex: card.id === cardId ? next : card.zIndex,
        })),
      );
    },
    [setCards],
  );

  const { startDrag, moveDrag, endDrag, didDrag, resetDragTracking } =
    useCardDrag<CardData>({
      setCards,
      onBringToFront: bringToFront,
    });

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

  const handleCardLongPress = (card: CardData) => {
    if (card.isDragging) return;

    // Face up: show guidebook page for this card (tap overlay to dismiss).
    if (card.isFlipped && card.tarotCard?._id) {
      const guide = resolveTarotGuidebookFromImageName(card.tarotCard.imageName);
      if (guide) {
        bringToFront(card.id);
        setGuidebookSource(guide);
        return;
      }
      navigation.navigate("TarotCardDetail", { cardId: card.tarotCard._id });
      return;
    }

    // Face down: flip via pinch-style flow; long-press still flips.
    handleCardFlip(card.id);
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
    if (!isSinglePointer(event)) return;
    const pointer = getPrimaryPointer(event);
    if (!pointer) return;

    setRefTop(kind);
    setDraggedRef(kind);
    const pos =
      kind === "symbols" ? refSymbolsPosRef.current : refKeywordsPosRef.current;
    refDragOffsetRef.current = {
      x: pointer.pageX - pos.x,
      y: pointer.pageY - pos.y,
    };

    beginDocumentDrag(
      (coords) => {
        const nx = coords.pageX - refDragOffsetRef.current.x;
        const ny = coords.pageY - refDragOffsetRef.current.y;
        if (kind === "symbols") {
          setRefSymbolsPos({ x: nx, y: ny });
        } else {
          setRefKeywordsPos({ x: nx, y: ny });
        }
      },
      () => {
        setDraggedRef(null);
        endDocumentDrag();
      },
    );
  };

  const handleRefDragMove = (kind: "symbols" | "keywords", event: any) => {
    if (draggedRef !== kind || !isSinglePointer(event)) return;
    const pointer = getPrimaryPointer(event);
    if (!pointer) return;

    const nx = pointer.pageX - refDragOffsetRef.current.x;
    const ny = pointer.pageY - refDragOffsetRef.current.y;
    if (kind === "symbols") {
      setRefSymbolsPos({ x: nx, y: ny });
    } else {
      setRefKeywordsPos({ x: nx, y: ny });
    }
  };

  const handleRefDragEnd = (kind: "symbols" | "keywords") => {
    if (draggedRef === kind) {
      setDraggedRef(null);
      endDocumentDrag();
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
          ...cardStackStyle(zStyle),
        },
      ]}
    >
      <View
        style={drawCardsUI.cardInner}
        {...createPointerHandlers({
          onStart: (e) => handleRefDragStart(kind, e),
          onMove: (e) => handleRefDragMove(kind, e),
          onEnd: () => handleRefDragEnd(kind),
        })}
      >
        {isWeb ? (
          <Image
            source={source}
            style={drawCardsUI.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={drawCardsUI.cardTouchable}>
            <Image
              source={source}
              style={drawCardsUI.cardImage}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </View>
  );

  const getWebTapHandler = (cardId: string) => {
    let handler = webTapHandlersRef.current.get(cardId);
    if (!handler) {
      handler = createWebTapHandler();
      webTapHandlersRef.current.set(cardId, handler);
    }
    return handler;
  };

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
                    handleCardFlip(card.id);
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
                  () => handleCardLongPress(card),
                );
                resetDragTracking();
              }
            },
          })}
        >
          {isWeb ? (
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
          ) : (
            <TouchableOpacity
              style={drawCardsUI.cardTouchable}
              onPress={() => {
                if (!didDrag()) {
                  handleCardPress(card.id);
                }
                resetDragTracking();
              }}
              onLongPress={() => {
                handleCardLongPress(card);
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
          )}
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
      <OnboardingOverlay screenKey="TAROT" />
      <TouchableOpacity
        style={drawCardsUI.shuffleButton}
        onPress={shuffleCards}
        activeOpacity={0.8}
      >
        <Text style={drawCardsUI.shuffleButtonText}>SHUFFLE</Text>
      </TouchableOpacity>
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

      <Modal
        visible={guidebookSource !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGuidebookSource(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.88)",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 24,
              paddingHorizontal: 12,
            }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {guidebookSource !== null ? (
              <Pressable onPress={() => setGuidebookSource(null)}>
                <Image
                  source={guidebookSource}
                  style={{
                    width: layoutWidth - 24,
                    height: layoutHeight * 0.82,
                  }}
                  resizeMode="contain"
                />
              </Pressable>
            ) : null}
          </ScrollView>
          <Pressable
            onPress={() => setGuidebookSource(null)}
            style={{ paddingBottom: 28, paddingTop: 8 }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.65)",
                fontSize: 14,
              }}
            >
              Tap image or here to close
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
