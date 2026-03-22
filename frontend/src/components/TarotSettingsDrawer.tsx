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
      <View style={sharedUI.drawerOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close settings"
        />
        <Animated.View
          style={[
            sharedUI.drawerContainer,
            { maxHeight: "90%" },
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
          <View style={sharedUI.drawerHeader}>
            <Text style={sharedUI.drawerTitle}>Tarot Settings</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={sharedUI.drawerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={sharedUI.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={sharedUI.drawerSection}>
              <Text style={sharedUI.sectionTitle}>Choose Your Deck</Text>
              <Text style={[sharedUI.drawerSectionText, { marginBottom: 16 }]}>
                Select which tarot deck to use for readings and the card
                reference.
              </Text>
              {TAROT_DECKS.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={[
                    sharedUI.drawerMutedPanel,
                    styles.deckOptionRow,
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
  deckOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
