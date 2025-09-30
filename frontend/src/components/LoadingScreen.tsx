import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({
  onLoadingComplete,
}: LoadingScreenProps) {
  const [loadingText, setLoadingText] = useState("Loading...");

  useEffect(() => {
    // Simulate loading process
    const loadingSteps = [
      "Initializing...",
      "Connecting to server...",
      "Loading your data...",
      "Almost ready...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingText(loadingSteps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        // Simulate a minimum loading time
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{loadingText}</Text>
        <Text style={styles.appName}>Correspondences</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "white",
    marginTop: 20,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
