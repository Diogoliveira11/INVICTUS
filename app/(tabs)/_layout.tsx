import * as NavigationBar from "expo-navigation-bar";
import { Tabs } from "expo-router";
import { Dumbbell, Home } from "lucide-react-native";
import React, { useEffect } from "react";
import { Image, Platform, View } from "react-native";

export default function TabsLayout() {
  
  // BLOCO PARA ESCONDER OS BOTÕES DO TELEMÓVEL
  useEffect(() => {
    async function hideSystemBars() {
      if (Platform.OS === "android") {
        try {
          // Esconde os botões (retroceder, home, etc)
          await NavigationBar.setVisibilityAsync("hidden");
          // Faz com que eles não "empurrem" a app para cima quando aparecem
          await NavigationBar.setBehaviorAsync("overlay-swipe");
        } catch (error) {
          console.log("Erro ao esconder botões do sistema:", error);
        }
      }
    }

    hideSystemBars();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopWidth: 1,
          borderTopColor: "#18181b",
          // MANTIDO: As tuas alturas originais sem alterações
          height: Platform.OS === "ios" ? 88 : 70, 
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#E31C25",
        tabBarInactiveTintColor: "#71717A",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="w-14 h-14 items-center justify-center">
              <Dumbbell size={24} color={focused ? "#E31C25" : "#71717A"} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View 
              className={`w-8 h-8 rounded-full overflow-hidden ${
                focused ? "border-[2px] border-[#E31C25]" : "border border-zinc-500"
              }`}
            >
              <Image
                source={{ uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg" }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}