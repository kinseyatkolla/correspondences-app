// ============================================================================
// Tarot settings drawer — placeholder for Tarot screen settings.
// ============================================================================
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from "react-native";

interface TarotSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function TarotSettingsDrawer({
  visible,
  onClose,
}: TarotSettingsDrawerProps) {
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
      <TouchableOpacity
        style={styles.drawerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.drawerContainer,
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
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.drawerContent}>
              <Text style={styles.placeholderText}>
                Settings for this section will appear here.
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "90%",
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
  placeholderText: {
    fontSize: 14,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
});
