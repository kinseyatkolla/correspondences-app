import type { GestureResponderEvent } from "react-native";
import { isWeb } from "./platformUtils";

export type PointerCoords = { pageX: number; pageY: number };

let documentDragCleanup: (() => void) | null = null;

/** Track mouse drag at the document level (required for reliable web dragging). */
export function beginDocumentDrag(
  onMove: (coords: PointerCoords) => void,
  onEnd: () => void,
): void {
  if (!isWeb || typeof document === "undefined") return;

  endDocumentDrag();

  const handleMove = (event: MouseEvent) => {
    event.preventDefault();
    onMove({ pageX: event.pageX, pageY: event.pageY });
  };

  const handleUp = () => {
    endDocumentDrag();
    onEnd();
  };

  document.addEventListener("mousemove", handleMove);
  document.addEventListener("mouseup", handleUp);
  documentDragCleanup = () => {
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleUp);
  };
}

export function endDocumentDrag(): void {
  documentDragCleanup?.();
  documentDragCleanup = null;
}

/** Read page coordinates from touch or mouse events (react-native-web). */
export function getPrimaryPointer(
  event: GestureResponderEvent,
): PointerCoords | null {
  const nativeEvent = event.nativeEvent as {
    touches?: Array<{ pageX: number; pageY: number }>;
    pageX?: number;
    pageY?: number;
    clientX?: number;
    clientY?: number;
  };

  if (nativeEvent.touches && nativeEvent.touches.length > 0) {
    const touch = nativeEvent.touches[0];
    return { pageX: touch.pageX, pageY: touch.pageY };
  }

  if (
    typeof nativeEvent.pageX === "number" &&
    typeof nativeEvent.pageY === "number"
  ) {
    return { pageX: nativeEvent.pageX, pageY: nativeEvent.pageY };
  }

  if (
    typeof nativeEvent.clientX === "number" &&
    typeof nativeEvent.clientY === "number" &&
    typeof window !== "undefined"
  ) {
    return {
      pageX: nativeEvent.clientX + window.scrollX,
      pageY: nativeEvent.clientY + window.scrollY,
    };
  }

  return null;
}

export function getTouchCount(event: GestureResponderEvent): number {
  const nativeEvent = event.nativeEvent as { touches?: unknown[] };
  return nativeEvent.touches?.length ?? 0;
}

/** True for a single finger or a mouse button press. */
export function isSinglePointer(event: GestureResponderEvent): boolean {
  const touchCount = getTouchCount(event);
  if (touchCount === 1) return true;
  if (touchCount === 0 && getPrimaryPointer(event)) return true;
  return false;
}

export type DragPointerHandlers = {
  onTouchStart?: (event: GestureResponderEvent) => void;
  onTouchMove?: (event: GestureResponderEvent) => void;
  onTouchEnd?: (event: GestureResponderEvent) => void;
  onMouseDown?: (event: GestureResponderEvent) => void;
  onMouseMove?: (event: GestureResponderEvent) => void;
  onMouseUp?: (event: GestureResponderEvent) => void;
  onMouseLeave?: (event: GestureResponderEvent) => void;
  onPointerDown?: (event: GestureResponderEvent) => void;
  onPointerMove?: (event: GestureResponderEvent) => void;
  onPointerUp?: (event: GestureResponderEvent) => void;
  onPointerCancel?: (event: GestureResponderEvent) => void;
};

const WEB_DOUBLE_CLICK_MS = 500;

export type WebTapHandler = {
  handleTap: (
    didDrag: boolean,
    onClick: () => void,
    onDoubleClick: () => void,
  ) => void;
  cleanup: () => void;
};

/** Manual double-click detection — react-native-web does not support onDoubleClick. */
export function createWebTapHandler(
  windowMs = WEB_DOUBLE_CLICK_MS,
): WebTapHandler {
  let lastTapAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handleTap = (
    didDrag: boolean,
    onClick: () => void,
    onDoubleClick: () => void,
  ) => {
    if (didDrag) {
      cleanup();
      lastTapAt = 0;
      return;
    }

    const now = Date.now();
    if (lastTapAt > 0 && now - lastTapAt <= windowMs) {
      cleanup();
      lastTapAt = 0;
      onDoubleClick();
      return;
    }

    lastTapAt = now;
    onClick();
    cleanup();
    timer = setTimeout(() => {
      timer = null;
      lastTapAt = 0;
    }, windowMs);
  };

  return { handleTap, cleanup };
}

/** Attach the same handlers to touch and mouse events for web + native. */
export function createPointerHandlers(handlers: {
  onStart?: (event: GestureResponderEvent) => void;
  onMove?: (event: GestureResponderEvent) => void;
  onEnd?: (event: GestureResponderEvent) => void;
}): DragPointerHandlers {
  const onStart = (event: GestureResponderEvent) => {
    event.preventDefault?.();
    handlers.onStart?.(event);
  };

  if (isWeb) {
    return {
      onPointerDown: onStart,
      onPointerMove: handlers.onMove,
      onPointerUp: handlers.onEnd,
      onPointerCancel: handlers.onEnd,
    };
  }

  return {
    onTouchStart: onStart,
    onTouchMove: handlers.onMove,
    onTouchEnd: handlers.onEnd,
    onMouseDown: onStart,
    onMouseMove: handlers.onMove,
    onMouseUp: handlers.onEnd,
  };
}
