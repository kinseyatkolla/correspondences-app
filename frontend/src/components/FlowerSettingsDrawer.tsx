// ============================================================================
// Flowers settings drawer — placeholder for Flowers screen settings.
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
import { sharedUI } from "../styles/sharedUI";

interface FlowerSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function FlowerSettingsDrawer({
  visible,
  onClose,
}: FlowerSettingsDrawerProps) {
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
        style={sharedUI.drawerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
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
              <Text style={sharedUI.drawerTitle}>Flowers Settings</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={sharedUI.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={sharedUI.drawerContent}>
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
  placeholderText: {
    fontSize: 14,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
});
