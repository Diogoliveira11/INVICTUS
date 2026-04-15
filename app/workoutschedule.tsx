import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getUserByEmail,
  printDatabaseStats,
  updateUserWeeklyGoal,
} from "../src/database";

const DAYS = [
  { id: "Mon", label: "Monday" },
  { id: "Tue", label: "Tuesday" },
  { id: "Wed", label: "Wednesday" },
  { id: "Thu", label: "Thursday" },
  { id: "Fri", label: "Friday" },
  { id: "Sat", label: "Saturday" },
  { id: "Sun", label: "Sunday" },
];

export default function WorkOutSchedule() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const isNextDisabled = selectedDays.length === 0;

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");

      if (!userEmail) {
        console.error("❌ [Schedule] Erro: userEmail não encontrado!");
        Alert.alert("Error", "Session expired. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }

      // Atualiza a meta
      await updateUserWeeklyGoal(db, userEmail, selectedDays.length);

      // Mostra os dados do utilizador atual
      const user = await getUserByEmail(db, userEmail);
      console.log("🚀 [FINAL] Dados guardados:", user);

      // MOSTRA O TOTAL DE UTILIZADORES NO TERMINAL
      await printDatabaseStats(db);

      await AsyncStorage.setItem("hasOnboarded", "true");
      await AsyncStorage.setItem("profileComplete", "true");
      router.replace("/(tabs)/home");
    } catch (e: any) {
      console.error("❌ [Schedule] Erro:", e.message);
      Alert.alert("Error", "Failed to save your schedule.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-6 py-8 justify-between">
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            {"What's your workout plan?"}
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            Select the days you want to train during the week
          </Text>
        </View>

        <ScrollView className="my-6" showsVerticalScrollIndicator={false}>
          <View>
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.7}
                  onPress={() => toggleDay(day.id)}
                  className="flex-row justify-between items-center py-5 border-b border-[#2D2F33]"
                >
                  <Text
                    className={`text-lg ${isSelected ? "text-white font-bold" : "text-gray-500"}`}
                  >
                    {day.label}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-[#E31C25] bg-[#E31C25]/20" : "border-gray-600 bg-transparent"}`}
                  >
                    {isSelected && (
                      <View className="w-2.5 h-2.5 rounded-full bg-[#E31C25]" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.push("/height")}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isNextDisabled}
            className={`${isNextDisabled ? "bg-gray-700" : "bg-[#E31C25]"} flex-row items-center py-4 px-8 rounded-full`}
            onPress={handleNext}
          >
            <Text
              className={`text-lg font-bold mr-2 ${isNextDisabled ? "text-gray-400" : "text-white"}`}
            >
              Finish
            </Text>
            <ChevronRight color={isNextDisabled ? "#999" : "white"} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
