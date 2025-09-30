import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

// Import screens
import MoonScreen from "../screens/MoonScreen";
import TarotScreen from "../screens/TarotScreen";
import FlowersScreen from "../screens/FlowersScreen";
import BookScreen from "../screens/BookScreen";
import AstrologyScreen from "../screens/AstrologyScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#E5E5EA",
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
          },
        }}
      >
        <Tab.Screen
          name="Moon"
          component={MoonScreen}
          options={{
            tabBarLabel: "Moon",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🌙</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Tarot"
          component={TarotScreen}
          options={{
            tabBarLabel: "Tarot",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🃏</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Flowers"
          component={FlowersScreen}
          options={{
            tabBarLabel: "Flowers",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>🌸</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Book"
          component={BookScreen}
          options={{
            tabBarLabel: "Book",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>📖</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Astrology"
          component={AstrologyScreen}
          options={{
            tabBarLabel: "Astrology",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ color, fontSize: size }}>⭐</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
