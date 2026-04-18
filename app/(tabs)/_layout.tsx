import * as NavigationBar from "expo-navigation-bar";
import { Tabs, useRouter } from "expo-router";
import { ChevronUp, Dumbbell, Home, Trash2 } from "lucide-react-native";
import React, { useEffect } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { useWorkout } from "./context/workoutcontext"; // Confirma se o caminho permanece este

export default function TabsLayout() {
  const router = useRouter();
  const {
    isActive,
    isMinimized,
    timer,
    restTimer,
    lastExercise,
    setIsMinimized,
    stopWorkout,
  } = useWorkout();

  useEffect(() => {
    async function hideSystemBars() {
      if (Platform.OS === "android") {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          await NavigationBar.setBehaviorAsync("overlay-swipe");
        } catch (error) {
          console.log("Erro ao esconder botões do sistema:", error);
        }
      }
    }
    hideSystemBars();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#121212",
            borderTopWidth: 1,
            borderTopColor: "#18181b",
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
                  focused
                    ? "border-[2px] border-[#E31C25]"
                    : "border border-zinc-500"
                }`}
              >
                <Image
                  source={{
                    uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ),
          }}
        />
        {/* Telas Ocultas */}
        <Tabs.Screen name="exercises/index" options={{ href: null }} />
        <Tabs.Screen name="exercises/[id]" options={{ href: null }} />
        <Tabs.Screen name="createexercise" options={{ href: null }} />
        <Tabs.Screen
          name="workout/explore_exercises"
          options={{ href: null }}
        />
        <Tabs.Screen name="workout/new_routine" options={{ href: null }} />
        <Tabs.Screen name="workout/log_workout" options={{ href: null }} />
        <Tabs.Screen name="workout/save_workout" options={{ href: null }} />
        <Tabs.Screen name="workout/workout_summary" options={{ href: null }} />
      </Tabs>

      {/* MINI TRACKER - Só aparece se estiver ATIVO e MINIMIZADO */}
      {isActive && isMinimized && (
        <View
          style={{ bottom: Platform.OS === "ios" ? 95 : 80 }}
          className="absolute left-4 right-4 bg-[#1c1c1e] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl"
        >
          {/* Ponto 3: Barra de Rest Timer Visual (opcional no Mini Tracker) */}
          {restTimer !== null && (
            <View className="bg-[#E31C25] h-1 w-full absolute top-0" />
          )}

          <View className="h-16 flex-row items-center px-4">
            <TouchableOpacity
              onPress={() => {
                setIsMinimized(false); // Barra desaparece ao entrar
                router.push("/workout/log_workout");
              }}
              className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
            >
              <ChevronUp color="white" size={24} />
            </TouchableOpacity>

            <View className="flex-1 ml-4">
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-2 ${restTimer !== null ? "bg-orange-500" : "bg-green-500"}`}
                />
                <Text className="text-white font-bold text-sm">
                  {restTimer !== null
                    ? `Descanso: ${restTimer}s`
                    : `Treino ${timer}`}
                </Text>
              </View>
              <Text className="text-zinc-500 text-xs" numberOfLines={1}>
                {lastExercise || "Em andamento"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => stopWorkout(true)} // Ponto 4: Chama com confirmação
              className="w-10 h-10 items-center justify-center bg-red-500/10 rounded-full"
            >
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
