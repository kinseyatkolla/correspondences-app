// ============================================================================
// IMPORTS
// ============================================================================
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { sharedUI } from "../styles/sharedUI";
import { drawCardBackgrounds } from "../styles/drawCardsUI";

// ============================================================================
// DATA
// ============================================================================
const references: string[] = [
  "Austin Coppock's lecture series, Tarot & Astrology",
  "36 Faces: The History, Astrology and Magic of the Decans by Austin Coppock, 2014",
  "The Fortune's Wheelhouse podcast hosted by T. Susan Chang and Mel Meleen, 2017 to 2021",
  "Radical Tarot: Queer the Cards, Liberate Your Practice, and Create the Future by Charlie Claire Burgess, 2023",
  "Tarot Correspondences: Ancient Secrets for Everyday Readers by T. Susan Chang, 2018",
  "Jessica Lanyadoo's tarot lecture series on Patreon",
  "Between the Worlds & Strange Magic podcasts",
  "36 Secrets: A Decanic Journey Through the Minor Arcana of the Tarot by T. Susan Chang, 2020",
  "Secrets of the Waite-Smith Tarot: The True Story of the World's Most Popular Tarot by Marcus Katz and Tali Goodwin, 2015",
  "Seventy-Eight Degrees of Wisdom: A Tarot Journey to Self-Awareness by Rachel Pollack, 2019",
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function TarotReferencesScreen({ navigation }: any) {
  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sharedUI.pageTitle}>References</Text>
        <Text style={sharedUI.pageSubtitle}>
          Sources behind the tarot correspondences
        </Text>

        <View style={styles.list}>
          {references.map((reference, index) => (
            <View key={index} style={styles.referenceRow}>
              <Text style={styles.referenceNumber}>{index + 1}.</Text>
              <Text style={styles.referenceText}>{reference}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.backNavBar}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.backNavArrow}>‹</Text>
        <Text style={styles.backNavText}>BACK TO SEARCH</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: drawCardBackgrounds.tarot,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 52,
  },
  list: {
    marginTop: 10,
  },
  referenceRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  referenceNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#b19cd9",
    width: 28,
    lineHeight: 24,
  },
  referenceText: {
    flex: 1,
    fontSize: 16,
    color: "#e6e6fa",
    lineHeight: 24,
  },
  backNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  backNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  backNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
});
