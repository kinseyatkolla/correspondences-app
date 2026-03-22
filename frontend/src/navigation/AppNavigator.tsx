import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import GearIcon from "../../assets/gear-svgrepo-com.svg";
import { FlowersProvider } from "../contexts/FlowersContext";
import { TarotProvider } from "../contexts/TarotContext";
import { CalendarProvider } from "../contexts/CalendarContext";
import { YearProvider, useYear } from "../contexts/YearContext";
import { useAstrology } from "../contexts/AstrologyContext";
import AstrologySettingsDrawer from "../components/AstrologySettingsDrawer";
import FlowerSettingsDrawer from "../components/FlowerSettingsDrawer";
import TarotSettingsDrawer from "../components/TarotSettingsDrawer";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import MoonScreen from "../screens/MoonScreen";
import TithiInfoScreen from "../screens/TithiInfoScreen";
import TarotScreen from "../screens/TarotScreen";
import TarotDrawScreen from "../screens/TarotDrawScreen";
import FlowersScreen from "../screens/FlowersScreen";
import FlowerDrawScreen from "../screens/FlowerDrawScreen";
import AstrologyScreen from "../screens/AstrologyScreen";
import BirthChartCalculatorScreen from "../screens/BirthChartCalculatorScreen";
import PlanetaryHoursScreen from "../screens/PlanetaryHoursScreen";
import CalendarScreen from "../screens/CalendarScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Flowers Stack Navigator
function FlowersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000000",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
          letterSpacing: 8,
        },
        headerTitle: "CORRESPONDENCES",
      }}
    >
      <Stack.Screen
        name="FlowerDraw"
        component={FlowerDrawScreen}
        options={{
          headerShown: false,
          presentation: "modal",
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

// Tarot Stack Navigator
function TarotStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000000",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
          letterSpacing: 8,
        },
        headerTitle: "CORRESPONDENCES",
      }}
    >
      <Stack.Screen
        name="TarotDraw"
        component={TarotDrawScreen}
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="TarotList"
        component={TarotScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Astrology Stack Navigator
function AstrologyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000000",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
          letterSpacing: 8,
        },
        headerTitle: "CORRESPONDENCES",
      }}
    >
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
    </Stack.Navigator>
  );
}

// Moon Stack Navigator
function MoonStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000000",
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
          letterSpacing: 8,
        },
        headerTitle: "CORRESPONDENCES",
      }}
    >
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
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#000000",
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: "bold",
            letterSpacing: 8,
          },
          headerTitle: "CORRESPONDENCES",
        }}
      >
        <Stack.Screen
          name="CalendarMain"
          component={CalendarScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </CalendarProvider>
  );
}

type SettingsDrawerType = "astrology" | "flower" | "tarot" | null;

function AppNavigatorContent() {
  const [settingsDrawerType, setSettingsDrawerType] =
    useState<SettingsDrawerType>(null);
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

  const openSettingsDrawer = (navigation: any) => {
    const state = navigation.getState();
    const currentTab = state?.routes?.[state?.index]?.name ?? null;
    if (currentTab === "Flowers") setSettingsDrawerType("flower");
    else if (currentTab === "Tarot") setSettingsDrawerType("tarot");
    else if (["Moon", "Book", "Astrology"].includes(currentTab ?? ""))
      setSettingsDrawerType("astrology");
  };

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Moon"
          screenOptions={({ navigation }) => ({
            tabBarActiveTintColor: "#e6e6fa",
            tabBarInactiveTintColor: "#8a8a8a",
            tabBarStyle: {
              backgroundColor: "#000000",
              borderTopWidth: 0,
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            headerStyle: {
              backgroundColor: "#000000",
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "bold",
              letterSpacing: 8,
            },
            headerTitle: () => (
              <Text style={headerStyles.headerTitle}>CORRESPONDENCES</Text>
            ),
            headerRight: () => (
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
        onClose={() => setSettingsDrawerType(null)}
        onSave={handleSaveLocation}
        currentLocation={currentChart?.location || null}
      />
      <FlowerSettingsDrawer
        visible={settingsDrawerType === "flower"}
        onClose={() => setSettingsDrawerType(null)}
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
