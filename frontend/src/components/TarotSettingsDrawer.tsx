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
  Switch,
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
  const {
    selectedDeck,
    setSelectedDeck,
    drawRefSymbolsEnabled,
    setDrawRefSymbolsEnabled,
    drawRefKeywordsEnabled,
    setDrawRefKeywordsEnabled,
    requestDrawRefSymbolsCenter,
    requestDrawRefKeywordsCenter,
  } = useTarot();
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

            <View style={styles.refSection}>
              <Text style={[sharedUI.sectionTitle, { marginBottom: 12 }]}>
                Reference Cards
              </Text>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>
                  Astrological & elemental symbols
                </Text>
                <Switch
                  value={drawRefSymbolsEnabled}
                  onValueChange={setDrawRefSymbolsEnabled}
                  trackColor={{ false: "#444", true: "#6b4c9a" }}
                  thumbColor={drawRefSymbolsEnabled ? "#e6e6fa" : "#8a8a8a"}
                />
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={requestDrawRefSymbolsCenter}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.resetBtnText}>RESET</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>
                  Numerical & elemental keywords
                </Text>
                <Switch
                  value={drawRefKeywordsEnabled}
                  onValueChange={setDrawRefKeywordsEnabled}
                  trackColor={{ false: "#444", true: "#6b4c9a" }}
                  thumbColor={drawRefKeywordsEnabled ? "#e6e6fa" : "#8a8a8a"}
                />
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={requestDrawRefKeywordsCenter}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.resetBtnText}>RESET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  refSection: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  refLabel: {
    flex: 1,
    fontSize: 15,
    color: "#e6e6fa",
    fontWeight: "500",
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(230,230,250,0.35)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  resetBtnText: {
    color: "#b19cd9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
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
