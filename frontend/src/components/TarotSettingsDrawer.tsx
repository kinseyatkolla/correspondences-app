// ============================================================================
// Tarot settings drawer — deck selection and Tarot screen settings.
// ============================================================================
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { useTarot } from "../contexts/TarotContext";
import { TAROT_DECKS } from "../utils/tarotImageHelper";
import { sharedUI } from "../styles/sharedUI";

interface TarotSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function TarotSettingsDrawer({
  visible,
  onClose,
}: TarotSettingsDrawerProps) {
  const { selectedDeck, setSelectedDeck } = useTarot();
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      Animated.spring(drawerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (!visible && prevVisibleRef.current) {
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    prevVisibleRef.current = visible;
  }, [visible, drawerAnimation]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.drawerOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close settings"
        />
        <Animated.View
          style={[
            sharedUI.drawerContainer,
            {
              transform: [
                {
                  translateY: drawerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Tarot Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Your Deck</Text>
              <Text style={styles.sectionText}>
                Select which tarot deck to use for readings and the card
                reference.
              </Text>
              {TAROT_DECKS.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={[
                    styles.deckOption,
                    selectedDeck === deck.id && styles.deckOptionSelected,
                  ]}
                  onPress={() => setSelectedDeck(deck.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.deckOptionText,
                      selectedDeck === deck.id && styles.deckOptionTextSelected,
                    ]}
                  >
                    {deck.label}
                  </Text>
                  {selectedDeck === deck.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerTitle: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  drawerContent: { padding: 20 },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b19cd9",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
    marginBottom: 16,
  },
  deckOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  deckOptionSelected: {
    backgroundColor: "#4a2c7a",
    borderColor: "#6b4c9a",
  },
  deckOptionText: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "500",
  },
  deckOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  checkmark: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
});
