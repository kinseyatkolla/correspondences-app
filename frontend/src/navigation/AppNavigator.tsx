import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text } from "react-native";

// Import screens
import MoonScreen from "../screens/MoonScreen";
import TarotScreen from "../screens/TarotScreen";
import FlowersScreen from "../screens/FlowersScreen";
import FlowerDrawScreen from "../screens/FlowerDrawScreen";
import BookScreen from "../screens/BookScreen";
import AstrologyScreen from "../screens/AstrologyScreen";

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
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Moon"
        screenOptions={{
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
          headerTitle: "CORRESPONDENCES",
        }}
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
          component={TarotScreen}
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
          component={MoonScreen}
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
          component={BookScreen}
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
          component={AstrologyScreen}
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
  );
}
