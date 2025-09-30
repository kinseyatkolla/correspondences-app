import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BookScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📖</Text>
      <Text style={styles.title}>Book of Shadows</Text>
      <Text style={styles.description}>
        This is the full database of correspondences
      </Text>
      <Text style={styles.description}>Glossary</Text>
      <Text style={styles.description}>Bibliography</Text>
      <Text style={styles.description}>Library</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111111",
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#e6e6fa",
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    lineHeight: 24,
  },
});
