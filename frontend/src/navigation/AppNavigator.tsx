import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { FlowersProvider } from "../contexts/FlowersContext";
import { TarotProvider } from "../contexts/TarotContext";

// Import screens
import MoonScreen from "../screens/MoonScreen";
import TithiInfoScreen from "../screens/TithiInfoScreen";
import TarotScreen from "../screens/TarotScreen";
import TarotDrawScreen from "../screens/TarotDrawScreen";
import FlowersScreen from "../screens/FlowersScreen";
import FlowerDrawScreen from "../screens/FlowerDrawScreen";
import BookScreen from "../screens/BookScreen";
import BookEntriesScreen from "../screens/BookEntriesScreen";
import GlossaryScreen from "../screens/GlossaryScreen";
import BibliographyScreen from "../screens/BibliographyScreen";
import LibraryScreen from "../screens/LibraryScreen";
import AdminScreen from "../screens/AdminScreen";
import AstrologyScreen from "../screens/AstrologyScreen";
import BirthChartCalculatorScreen from "../screens/BirthChartCalculatorScreen";
import PlanetaryHoursScreen from "../screens/PlanetaryHoursScreen";

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
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="FlowersList"
        component={FlowersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
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
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="TarotList"
        component={TarotScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
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
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
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
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Book Stack Navigator
function BookStack() {
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
        name="BookMain"
        component={BookScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookEntries"
        component={BookEntriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Glossary"
        component={GlossaryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Bibliography"
        component={BibliographyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <FlowersProvider>
      <TarotProvider>
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
                <TouchableOpacity
                  onPress={() => {
                    const state = navigation.getState();
                    const currentRoute = state.routes[state.index];
                    (navigation as any).navigate(currentRoute.name, {
                      screen: "Admin",
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={headerStyles.headerTitle}>CORRESPONDENCES</Text>
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
              component={BookStack}
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
      </TarotProvider>
    </FlowersProvider>
  );
}

const headerStyles = StyleSheet.create({
  headerTitle: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 8,
    fontSize: 17,
  },
});
