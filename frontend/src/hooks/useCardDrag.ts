import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { GestureResponderEvent } from "react-native";
import {
  beginDocumentDrag,
  endDocumentDrag,
  getPrimaryPointer,
  isSinglePointer,
  type PointerCoords,
} from "../utils/pointerEvents";

type CardPosition = { id: string; x: number; y: number; isDragging?: boolean };

export function useCardDrag<T extends CardPosition>({
  setCards,
  onBringToFront,
}: {
  setCards: Dispatch<SetStateAction<T[]>>;
  onBringToFront: (cardId: string) => void;
}) {
  const draggedCardRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const DRAG_THRESHOLD_PX = 4;

  const updateCardPosition = useCallback(
    (cardId: string, pointer: PointerCoords) => {
      if (!movedRef.current) {
        const dx = pointer.pageX - dragStartRef.current.x;
        const dy = pointer.pageY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      }

      const newX = pointer.pageX - dragOffsetRef.current.x;
      const newY = pointer.pageY - dragOffsetRef.current.y;
      movedRef.current = true;
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? { ...card, x: newX, y: newY, isDragging: true }
            : card,
        ),
      );
    },
    [setCards],
  );

  const finishDrag = useCallback(
    (cardId: string) => {
      if (draggedCardRef.current !== cardId) return;
      draggedCardRef.current = null;
      endDocumentDrag();
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isDragging: false } : card,
        ),
      );
    },
    [setCards],
  );

  const startDrag = useCallback(
    (cardId: string, event: GestureResponderEvent) => {
      if (!isSinglePointer(event)) return false;

      const pointer = getPrimaryPointer(event);
      if (!pointer) return false;

      let started = false;
      setCards((prev) => {
        const card = prev.find((c) => c.id === cardId);
        if (!card) return prev;

        started = true;
        draggedCardRef.current = cardId;
        movedRef.current = false;
        dragOffsetRef.current = {
          x: pointer.pageX - card.x,
          y: pointer.pageY - card.y,
        };
        dragStartRef.current = {
          x: pointer.pageX,
          y: pointer.pageY,
        };
        return prev;
      });

      if (!started) return false;

      beginDocumentDrag(
        (coords) => updateCardPosition(cardId, coords),
        () => finishDrag(cardId),
      );
      onBringToFront(cardId);
      return true;
    },
    [finishDrag, onBringToFront, setCards, updateCardPosition],
  );

  const moveDrag = useCallback(
    (cardId: string, event: GestureResponderEvent) => {
      if (draggedCardRef.current !== cardId || !isSinglePointer(event)) return;
      const pointer = getPrimaryPointer(event);
      if (pointer) updateCardPosition(cardId, pointer);
    },
    [updateCardPosition],
  );

  const endDrag = useCallback(
    (cardId: string) => {
      finishDrag(cardId);
    },
    [finishDrag],
  );

  const didDrag = useCallback(() => movedRef.current, []);

  const resetDragTracking = useCallback(() => {
    movedRef.current = false;
  }, []);

  useEffect(() => () => endDocumentDrag(), []);

  return {
    startDrag,
    moveDrag,
    endDrag,
    didDrag,
    resetDragTracking,
  };
}
