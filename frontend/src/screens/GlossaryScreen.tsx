// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { overlayStyles } from "../styles/overlayStyles";
import { sharedUI } from "../styles/sharedUI";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface GlossaryScreenProps {
  navigation: any;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function GlossaryScreen({ navigation }: GlossaryScreenProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={sharedUI.navBar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={sharedUI.navBarArrow}>‹</Text>
        <Text style={sharedUI.navBarText}>GLOSSARY</Text>
        <View style={{ width: 18 }} />
      </TouchableOpacity>
      <ScrollView style={styles.scrollView}>
        <View style={overlayStyles.section}>
          <Text style={styles.glossaryTerm}>Correspondence</Text>
          <Text style={styles.glossaryDefinition}>
            A symbolic relationship between different elements in magic, such as
            colors, herbs, crystals, and planets. These connections are used to
            enhance magical workings.
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
            A table showing the positions of celestial bodies at specific times.
            Used in astrology and magical timing.
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
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  scrollView: {
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
