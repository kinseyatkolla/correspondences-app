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

interface BibliographyScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function BibliographyScreen({
  visible,
  onClose,
}: BibliographyScreenProps) {
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
          <Text style={styles.modalTitle}>📖 Bibliography</Text>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.fullScreenModalScroll}>
          <View style={overlayStyles.section}>
            <Text style={overlayStyles.sectionTitle}>Primary Sources</Text>
            <Text style={styles.bibliographyItem}>
              Cunningham, Scott.{" "}
              <Text style={styles.bibliographyTitle}>
                Cunningham's Encyclopedia of Magical Herbs
              </Text>
              . Llewellyn Publications, 1985.
            </Text>
            <Text style={styles.bibliographyItem}>
              Kynes, Sandra.{" "}
              <Text style={styles.bibliographyTitle}>
                The Complete Book of Correspondences
              </Text>
              . Llewellyn Publications, 2003.
            </Text>
            <Text style={styles.bibliographyItem}>
              Greer, Mary K.{" "}
              <Text style={styles.bibliographyTitle}>Tarot for Your Self</Text>.
              New Page Books, 2002.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={overlayStyles.sectionTitle}>Historical Sources</Text>
            <Text style={styles.bibliographyItem}>
              Agrippa, Heinrich Cornelius.{" "}
              <Text style={styles.bibliographyTitle}>
                Three Books of Occult Philosophy
              </Text>
              . Translated by James Freake, 1651.
            </Text>
            <Text style={styles.bibliographyItem}>
              Barrett, Francis.{" "}
              <Text style={styles.bibliographyTitle}>The Magus</Text>. 1801.
            </Text>
          </View>

          <View style={overlayStyles.section}>
            <Text style={overlayStyles.sectionTitle}>Modern References</Text>
            <Text style={styles.bibliographyItem}>
              Conway, D.J.{" "}
              <Text style={styles.bibliographyTitle}>Crystal Enchantments</Text>
              . Llewellyn Publications, 1999.
            </Text>
            <Text style={styles.bibliographyItem}>
              Morrison, Dorothy.{" "}
              <Text style={styles.bibliographyTitle}>Everyday Magic</Text>.
              Llewellyn Publications, 1998.
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
  bibliographyItem: {
    fontSize: 14,
    color: "#e6e6fa",
    marginBottom: 15,
    lineHeight: 20,
  },
  bibliographyTitle: {
    fontWeight: "bold",
    color: "#b19cd9",
  },
});
