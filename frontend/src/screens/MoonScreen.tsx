import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌙</Text>
      <Text style={styles.title}>Moon</Text>
      <Text style={styles.description}>Tithi</Text>
      <Text style={styles.description}>nakshatra</Text>
      <Text style={styles.description}>Moon phase</Text>
      <Text style={styles.description}>moon sign</Text>
      <Text style={styles.description}>moon month calendar?</Text>
      <Text style={styles.description}>Moon in literature</Text>
      <Text style={styles.description}>moon in pop culture</Text>
      <Text style={styles.description}>moon in myth</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
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
