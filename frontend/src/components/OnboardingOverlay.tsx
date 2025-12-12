import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ImageSourcePropType,
} from "react-native";
import {
  hasOnboardingBeenDismissed,
  dismissOnboarding,
  ONBOARDING_KEYS,
} from "../utils/onboardingUtils";

interface OnboardingOverlayProps {
  screenKey: keyof typeof ONBOARDING_KEYS;
  children?: React.ReactNode; // Optional custom content
}

// Get screen-specific placeholder content (supports multiple paragraphs and images)
//
// Example with images:
// FLOWERS: (
//   <>
//     <OnboardingParagraph>First paragraph here.</OnboardingParagraph>
//     <OnboardingImage source={require('../../assets/images/example.png')} />
//     <OnboardingParagraph>Second paragraph here.</OnboardingParagraph>
//   </>
// )
//
// You can also pass custom content via the children prop:
// <OnboardingOverlay screenKey="FLOWERS">
//   <OnboardingTitle>Custom Title</OnboardingTitle>
//   <OnboardingParagraph>Custom content...</OnboardingParagraph>
//   <OnboardingImage source={require('../../assets/images/custom.png')} />
// </OnboardingOverlay>
const getPlaceholderContent = (
  screenKey: keyof typeof ONBOARDING_KEYS
): React.ReactNode => {
  const placeholderContents: Record<
    keyof typeof ONBOARDING_KEYS,
    React.ReactNode
  > = {
    FLOWERS: (
      <>
        <Text style={styles.placeholderParagraph}>
          Shake your device to shuffle the cards.
        </Text>
        <Text style={styles.placeholderParagraph}>
          Copyright 2018 The Flower Essences Deck by Kinsey Watts
        </Text>
        <Text style={styles.placeholderParagraph}>
          Patterns of balance and Imbalance by Patricia Kaminski Copyright 1994
          Flower Essence Society, used by permission.
        </Text>
        {/* Example: <OnboardingImage source={require('../../assets/images/flower-example.png')} /> */}
      </>
    ),
    TAROT: (
      <>
        <Text style={styles.placeholderParagraph}>
          Shake your device to shuffle the cards.
        </Text>
        <Text style={styles.placeholderParagraph}>
          Art by Pamela Colman Smith from the Rider Waite Smith Tarot Deck.
        </Text>
      </>
    ),
    MOON: (
      <>
        <Text style={styles.placeholderParagraph}>
          Swipe left and right to move between days.
        </Text>
      </>
    ),
    BOOK: (
      <>
        <Text style={styles.placeholderParagraph}>
          Keep track of all the important astrological dates of the year.
        </Text>
        <Text style={styles.placeholderParagraph}>
          Click on LINES to see the planets in motion.
        </Text>
      </>
    ),
    ASTROLOGY: (
      <>
        <Text style={styles.placeholderParagraph}>
          Swipe left and right to move between days.
        </Text>
        <Text style={styles.placeholderParagraph}>
          Planetary hours are sort of hidden in the top right corner.
        </Text>
      </>
    ),
  };
  return (
    placeholderContents[screenKey] || (
      <Text style={styles.placeholderParagraph}></Text>
    )
  );
};

export default function OnboardingOverlay({
  screenKey,
  children,
}: OnboardingOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const dismissed = await hasOnboardingBeenDismissed(
      ONBOARDING_KEYS[screenKey]
    );
    setVisible(!dismissed);
  };

  const handleClose = async () => {
    await dismissOnboarding(ONBOARDING_KEYS[screenKey]);
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
          >
            {children ? (
              children
            ) : (
              <View style={styles.placeholderContainer}>
                {getPlaceholderContent(screenKey)}
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#111",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "relative",
  },
  closeButton: {
    alignSelf: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4a2c7a",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    marginTop: 10,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollContent: {
    maxHeight: "100%",
  },
  scrollContainer: {
    padding: 30,
    flexGrow: 1,
    justifyContent: "center",
  },
  placeholderContainer: {
    alignItems: "center",
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5f5f5",
    marginBottom: 20,
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 18,
    color: "#f5f5f5",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 28,
  },
  placeholderParagraph: {
    fontSize: 18,
    color: "#f5f5f5",
    marginBottom: 20,
    textAlign: "left",
    lineHeight: 28,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: "contain",
  },
});

// Export styles and helper components for use in custom content
export const onboardingStyles = styles;

// Helper component for rendering images in onboarding content
export const OnboardingImage = ({
  source,
  style,
}: {
  source: ImageSourcePropType;
  style?: any;
}) => (
  <Image
    source={source}
    style={[styles.placeholderImage, style]}
    resizeMode="contain"
  />
);

// Helper component for rendering paragraphs in onboarding content
export const OnboardingParagraph = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <Text style={[styles.placeholderParagraph, style]}>{children}</Text>;

// Helper component for rendering titles in onboarding content
export const OnboardingTitle = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <Text style={[styles.placeholderTitle, style]}>{children}</Text>;
