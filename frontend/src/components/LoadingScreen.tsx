import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({
  onLoadingComplete,
}: LoadingScreenProps) {
  const [loadingText, setLoadingText] = useState("Initializing...");

  // Create animated values for each letter (15 letters total)
  const letterAnimations = useRef(
    Array.from({ length: 15 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    // Simulate loading process
    const loadingSteps = [
      "Initializing...",
      "Connecting to server...",
      "Loading your data...",
      "Almost ready...",
      "Preparing mystical energies...", // 😄
      "Aligning cosmic forces...",
      "Final preparations...",
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

  // Firefly glow animation
  useEffect(() => {
    const createFireflyAnimation = (index: number) => {
      const duration = 3000 + Math.random() * 4000; // 3-7 seconds (slower)
      const delay = Math.random() * 2000; // 0-2 second delay

      const animate = () => {
        Animated.sequence([
          Animated.timing(letterAnimations[index], {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(letterAnimations[index], {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Random delay before next animation (longer)
          setTimeout(animate, Math.random() * 4000);
        });
      };

      setTimeout(animate, delay);
    };

    // Start firefly animation for each letter
    letterAnimations.forEach((_, index) => {
      createFireflyAnimation(index);
    });
  }, []);

  // Define the triangular layout of letters
  const triangularLayout = ["C", "O R", "R E S", "P O N D", "E N C E S"];

  // Flatten the letters for animation mapping
  const allLetters = "CORRESPONDENCES".split("");

  return (
    <View style={styles.container}>
      {/* Loading text at top */}
      <Text style={styles.loadingText}>{loadingText}</Text>

      {/* Triangular CORRESPONDENCES centered */}
      <View style={styles.triangleContainer}>
        {triangularLayout.map((line, lineIndex) => (
          <View key={lineIndex} style={styles.triangleLine}>
            {line.split("").map((letter, letterIndex) => {
              // Calculate the global letter index
              let globalIndex = 0;
              for (let i = 0; i < lineIndex; i++) {
                globalIndex += triangularLayout[i].replace(/\s/g, "").length;
              }
              globalIndex += letterIndex;

              // Ensure we don't go out of bounds
              const safeIndex = Math.min(
                globalIndex,
                letterAnimations.length - 1
              );
              const animation = letterAnimations[safeIndex];

              return (
                <Animated.Text
                  key={`${lineIndex}-${letterIndex}`}
                  style={[
                    styles.letter,
                    {
                      opacity: animation,
                      textShadowColor: "#ffffff",
                      textShadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                >
                  {letter}
                </Animated.Text>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  triangleContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  triangleLine: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // Perfect equilateral triangle spacing
  },
  letter: {
    fontSize: 18, // Smaller font size to match header
    fontWeight: "bold",
    color: "#ffffff",
    marginHorizontal: 4, // Keep same spacing
    fontFamily: "monospace",
    letterSpacing: 8, // Match the header letterSpacing
  },
  loadingText: {
    fontSize: 16,
    color: "#cccccc",
    marginTop: 60, // Position at top
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
  },
});
