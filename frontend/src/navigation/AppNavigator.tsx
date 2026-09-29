import React, { useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { shadowStyle } from "../utils/platformUtils";
import GearIcon from "../../assets/gear-svgrepo-com.svg";
import { FlowersProvider } from "../contexts/FlowersContext";
import { TarotProvider } from "../contexts/TarotContext";
import { CalendarProvider } from "../contexts/CalendarContext";
import { YearProvider, useYear } from "../contexts/YearContext";
import { useAstrology } from "../contexts/AstrologyContext";
import AstrologySettingsDrawer from "../components/AstrologySettingsDrawer";
import TarotSettingsDrawer from "../components/TarotSettingsDrawer";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import MoonScreen from "../screens/MoonScreen";
import TithiInfoScreen from "../screens/TithiInfoScreen";
import TarotScreen from "../screens/TarotScreen";
import TarotDrawScreen from "../screens/TarotDrawScreen";
import TarotCardDetailScreen from "../screens/TarotCardDetailScreen";
import TarotReferencesScreen from "../screens/TarotReferencesScreen";
import FlowersScreen from "../screens/FlowersScreen";
import FlowerDrawScreen from "../screens/FlowerDrawScreen";
import AstrologyScreen from "../screens/AstrologyScreen";
import BirthChartCalculatorScreen from "../screens/BirthChartCalculatorScreen";
import PlanetaryHoursScreen from "../screens/PlanetaryHoursScreen";
import ElectionalScreen from "../screens/ElectionalScreen";
import CalendarScreen from "../screens/CalendarScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: "#000000",
  },
  headerShadowVisible: false,
  headerTintColor: "white" as const,
  headerTitleStyle: {
    fontWeight: "bold" as const,
    letterSpacing: 8,
  },
  headerTitle: "CORRESPONDENCES",
};

const tabHeaderStyle = {
  backgroundColor: "#000000",
  borderBottomWidth: 0,
  ...shadowStyle({ opacity: 0, elevation: 0 }),
};

// Flowers Stack Navigator
function FlowersStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="FlowerDraw"
        component={FlowerDrawScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="FlowersList"
        component={FlowersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Tarot Stack Navigator — TarotList is the browse/search screen; TarotDraw is the default tab landing.
function TarotStack() {
  return (
    <Stack.Navigator
      initialRouteName="TarotDraw"
      screenOptions={stackScreenOptions}
    >
      <Stack.Screen
        name="TarotList"
        component={TarotScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TarotCardDetail"
        component={TarotCardDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TarotReferences"
        component={TarotReferencesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TarotDraw"
        component={TarotDrawScreen}
        options={{
          headerShown: false,
          presentation: "modal",
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Astrology Stack Navigator
function AstrologyStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="AstrologyMain"
        component={AstrologyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BirthChartCalculator"
        component={BirthChartCalculatorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanetaryHours"
        component={PlanetaryHoursScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Electional"
        component={ElectionalScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Moon Stack Navigator
function MoonStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="MoonMain"
        component={MoonScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TithiInfo"
        component={TithiInfoScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Calendar Stack Navigator
function CalendarStack() {
  const { year } = useYear();
  return (
    <CalendarProvider year={year}>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        <Stack.Screen
          name="CalendarMain"
          component={CalendarScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </CalendarProvider>
  );
}

type SettingsDrawerType = "astrology" | "tarot" | null;
const OPEN_ASTROLOGY_SETTINGS_KEY = "openAstrologySettingsDrawer";
const OPEN_ASTROLOGY_SETTINGS_SECTION_KEY = "openAstrologySettingsSection";
const OPEN_ASTROLOGY_SETTINGS_RETURN_TAB_KEY = "openAstrologySettingsReturnTab";

function AppNavigatorContent() {
  const [settingsDrawerType, setSettingsDrawerType] =
    useState<SettingsDrawerType>(null);
  const [astrologySettingsFocusSection, setAstrologySettingsFocusSection] =
    useState<"location" | "natal">("location");
  const [astrologySettingsReturnTab, setAstrologySettingsReturnTab] = useState<
    string | null
  >(null);
  const navigationRef = useRef<any>(null);
  const { currentChart, refreshChart } = useAstrology();

  const handleSaveLocation = async (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => {
    try {
      await AsyncStorage.setItem("savedLocation", JSON.stringify(location));
      await refreshChart();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleClearLocation = async () => {
    try {
      await AsyncStorage.removeItem("savedLocation");
      await refreshChart();
    } catch (error) {
      console.error("Error clearing saved location:", error);
    }
  };

  const openSettingsDrawer = (navigation: any) => {
    const state = navigation.getState();
    const currentTab = state?.routes?.[state?.index]?.name ?? null;
    if (currentTab === "Tarot") setSettingsDrawerType("tarot");
    else if (["Moon", "Book", "Astrology"].includes(currentTab ?? ""))
      setSettingsDrawerType("astrology");
  };

  const closeAstrologySettingsDrawer = async () => {
    setSettingsDrawerType(null);
    if (astrologySettingsReturnTab) {
      const tabToReturn = astrologySettingsReturnTab;
      setAstrologySettingsReturnTab(null);
      try {
        await AsyncStorage.removeItem(OPEN_ASTROLOGY_SETTINGS_RETURN_TAB_KEY);
      } catch (error) {
        console.error("Error clearing settings return tab key:", error);
      }
      setTimeout(() => {
        navigationRef.current?.navigate?.(tabToReturn);
      }, 0);
    }
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          initialRouteName="Moon"
          screenListeners={{
            state: async (e) => {
              try {
                const state: any = e.data.state;
                const currentTab =
                  state?.routes?.[state?.index || 0]?.name || null;
                if (currentTab !== "Astrology") return;

                const shouldOpen = await AsyncStorage.getItem(
                  OPEN_ASTROLOGY_SETTINGS_KEY
                );
                if (shouldOpen !== "1") return;

                const requestedSection =
                  (await AsyncStorage.getItem(OPEN_ASTROLOGY_SETTINGS_SECTION_KEY)) ||
                  "location";
                const requestedReturnTab = await AsyncStorage.getItem(
                  OPEN_ASTROLOGY_SETTINGS_RETURN_TAB_KEY
                );
                setAstrologySettingsFocusSection(
                  requestedSection === "natal" ? "natal" : "location"
                );
                setAstrologySettingsReturnTab(requestedReturnTab || null);
                setSettingsDrawerType("astrology");
                await AsyncStorage.removeItem(OPEN_ASTROLOGY_SETTINGS_KEY);
                await AsyncStorage.removeItem(OPEN_ASTROLOGY_SETTINGS_SECTION_KEY);
              } catch (error) {
                console.error("Error auto-opening astrology settings:", error);
              }
            },
          }}
          screenOptions={({ navigation, route }) => ({
            tabBarActiveTintColor: "#e6e6fa",
            tabBarInactiveTintColor: "#8a8a8a",
            tabBarStyle: {
              backgroundColor: "#000000",
              borderTopWidth: 0,
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            headerStyle: tabHeaderStyle,
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "bold",
              letterSpacing: 8,
            },
            headerTitle: () => (
              <Text style={headerStyles.headerTitle}>CORRESPONDENCES</Text>
            ),
            headerRight:
              route.name === "Flowers"
                ? () => null
                : () => (
                    <TouchableOpacity
                      onPress={() => openSettingsDrawer(navigation)}
                      activeOpacity={0.7}
                      style={headerStyles.headerRightButton}
                    >
                      <GearIcon
                        width={20}
                        height={20}
                        fill="#e6e6fa"
                        color="#e6e6fa"
                      />
                    </TouchableOpacity>
                  ),
          })}
        >
          <Tab.Screen
            name="Flowers"
            component={FlowersStack}
            options={{
              tabBarLabel: "",
              tabBarIcon: ({ focused, size }) => (
                <Text style={{ fontSize: size, opacity: focused ? 1 : 0.35 }}>
                  🌸
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Tarot"
            component={TarotStack}
            options={{
              tabBarLabel: "",
              tabBarIcon: ({ focused, size }) => (
                <Text style={{ fontSize: size, opacity: focused ? 1 : 0.35 }}>
                  🃏
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Moon"
            component={MoonStack}
            options={{
              tabBarLabel: "",
              tabBarIcon: ({ focused, size }) => (
                <Text style={{ fontSize: size, opacity: focused ? 1 : 0.35 }}>
                  🌙
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Book"
            component={CalendarStack}
            options={{
              tabBarLabel: "",
              tabBarIcon: ({ focused, size }) => (
                <Text style={{ fontSize: size, opacity: focused ? 1 : 0.35 }}>
                  📖
                </Text>
              ),
            }}
          />
          <Tab.Screen
            name="Astrology"
            component={AstrologyStack}
            options={{
              tabBarLabel: "",
              tabBarIcon: ({ focused, size }) => (
                <Text style={{ fontSize: size, opacity: focused ? 1 : 0.35 }}>
                  ⭐
                </Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <AstrologySettingsDrawer
        visible={settingsDrawerType === "astrology"}
        onClose={closeAstrologySettingsDrawer}
        onSave={handleSaveLocation}
        onClearLocation={handleClearLocation}
        currentLocation={currentChart?.location || null}
        focusSection={astrologySettingsFocusSection}
      />
      <TarotSettingsDrawer
        visible={settingsDrawerType === "tarot"}
        onClose={() => setSettingsDrawerType(null)}
      />
    </>
  );
}

export default function AppNavigator() {
  return (
    <YearProvider>
      <FlowersProvider>
        <TarotProvider>
          <AppNavigatorContent />
        </TarotProvider>
      </FlowersProvider>
    </YearProvider>
  );
}

const headerStyles = StyleSheet.create({
  headerTitle: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 8,
    fontSize: 17,
  },
  headerRightButton: {
    paddingRight: 15,
    paddingVertical: 5,
  },
});
