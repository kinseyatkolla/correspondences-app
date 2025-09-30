import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingScreen from "./src/components/LoadingScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { AstrologyProvider } from "./src/contexts/AstrologyContext";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <SafeAreaProvider>
      <AstrologyProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </AstrologyProvider>
    </SafeAreaProvider>
  );
}
