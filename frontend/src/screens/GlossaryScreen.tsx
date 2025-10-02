import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

interface GlossaryScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlossaryScreen({
  visible,
  onClose,
}: GlossaryScreenProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenModal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={sharedUI.backButton} onPress={onClose}>
            <Text style={sharedUI.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>📚 Glossary</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.fullScreenModalScroll}>
          <View style={overlayStyles.section}>
            <Text style={styles.glossaryTerm}>Correspondence</Text>
            <Text style={styles.glossaryDefinition}>
              A symbolic relationship between different elements in magic, such
              as colors, herbs, crystals, and planets. These connections are
              used to enhance magical workings.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={styles.glossaryTerm}>Elemental</Text>
            <Text style={styles.glossaryDefinition}>
              Relating to the four classical elements: Earth, Air, Fire, and
              Water. Each element has specific correspondences and magical
              properties.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={styles.glossaryTerm}>Ephemeris</Text>
            <Text style={styles.glossaryDefinition}>
              A table showing the positions of celestial bodies at specific
              times. Used in astrology and magical timing.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={styles.glossaryTerm}>Natal Chart</Text>
            <Text style={styles.glossaryDefinition}>
              An astrological chart showing the positions of planets at the time
              and place of birth. Also called a birth chart.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={styles.glossaryTerm}>Physis</Text>
            <Text style={styles.glossaryDefinition}>
              A custom font containing astrological and magical symbols used
              throughout this application for enhanced visual representation.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 60, // Same width as back button to center the title
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#111",
  },
  fullScreenModalScroll: {
    flex: 1,
    padding: 20,
  },
  glossaryTerm: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 8,
  },
  glossaryDefinition: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
    marginBottom: 20,
  },
});
