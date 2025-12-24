import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingScreen from "./src/components/LoadingScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { AstrologyProvider } from "./src/contexts/AstrologyContext";
import { YearProvider } from "./src/contexts/YearContext";
import { FlowersProvider } from "./src/contexts/FlowersContext";
import { TarotProvider } from "./src/contexts/TarotContext";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // Mount contexts during loading so LoadingScreen can access them
  const appContent = (
    <SafeAreaProvider>
      <AstrologyProvider>
        <YearProvider>
          <FlowersProvider>
            <TarotProvider>
              {isLoading ? (
                <LoadingScreen onLoadingComplete={handleLoadingComplete} />
              ) : (
                <AppNavigator />
              )}
              <StatusBar style="light" />
            </TarotProvider>
          </FlowersProvider>
        </YearProvider>
      </AstrologyProvider>
    </SafeAreaProvider>
  );

  return appContent;
}
