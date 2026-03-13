import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E31C25",
        tabBarInactiveTintColor: "#71717a",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "#18181b",
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="home-variant"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dumbbell" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => {
            const size = 32;
            return (
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 2,
                  borderColor: focused ? "#E31C25" : "#3f3f46",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={size * 0.7}
                  color={focused ? "#E31C25" : "#71717a"}
                />
              </View>
            );
          },
        }}
      />
    </Tabs>
  );
}
