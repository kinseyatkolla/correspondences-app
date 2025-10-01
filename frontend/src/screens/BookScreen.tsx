import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function BookScreen() {
  const handleButtonPress = (section: string) => {
    console.log(`Pressed: ${section}`);
    // TODO: Navigate to specific section
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📖</Text>
        <Text style={styles.title}>Book of Shadows</Text>
        <Text style={styles.description}>
          This is the full database of correspondences
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.largeButton}
          onPress={() => handleButtonPress("Glossary")}
        >
          <Text style={styles.buttonEmoji}>📚</Text>
          <Text style={styles.buttonTitle}>Glossary</Text>
          <Text style={styles.buttonDescription}>Definitions and meanings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.largeButton}
          onPress={() => handleButtonPress("Bibliography")}
        >
          <Text style={styles.buttonEmoji}>📖</Text>
          <Text style={styles.buttonTitle}>Bibliography</Text>
          <Text style={styles.buttonDescription}>Sources and references</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.largeButton}
          onPress={() => handleButtonPress("Library")}
        >
          <Text style={styles.buttonEmoji}>🏛️</Text>
          <Text style={styles.buttonTitle}>Library</Text>
          <Text style={styles.buttonDescription}>Collection of knowledge</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.otherSections}>
        <Text style={styles.otherSectionsTitle}>Other Sections</Text>
        <Text style={styles.description}>Numbers</Text>
        <Text style={styles.description}>Colors</Text>
        <Text style={styles.description}>Plants</Text>
        <Text style={styles.description}>Planets</Text>
        <Text style={styles.description}>Metals</Text>
        <Text style={styles.description}>Aspects</Text>
        <Text style={styles.description}>Zodiac Signs</Text>
        <Text style={styles.description}>Houses</Text>
        <Text style={styles.description}>Decans</Text>
        <Text style={styles.description}>Moon Phases</Text>
        <Text style={styles.description}>Seasons</Text>
        <Text style={styles.description}>Weekdays</Text>
        <Text style={styles.description}>Equinox & Solstices</Text>
        <Text style={styles.description}>Tarot</Text>
        <Text style={styles.description}>Symbols</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#e6e6fa",
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  largeButton: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    alignItems: "center",
  },
  buttonEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 5,
  },
  buttonDescription: {
    fontSize: 14,
    color: "#8a8a8a",
    textAlign: "center",
  },
  otherSections: {
    alignItems: "center",
  },
  otherSectionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 15,
  },
});
