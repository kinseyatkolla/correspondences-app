import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TarotScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🃏</Text>
      <Text style={styles.title}>Tarot</Text>
      <Text style={styles.description}>Pull cards - choose a spread</Text>
      <Text style={styles.description}>
        Study the cards - understand the meanings
      </Text>
      <Text style={styles.description}>AI chat - ask questions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d1b69",
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
