import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  // Estado para armazenar os dias selecionados
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Lógica: Se o array estiver vazio, o botão fica desativado
  const isNextDisabled = selectedDays.length === 0;

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-6 py-8 justify-between">
        {/* Header */}
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            {"What's your workout plan?"}
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            Select the days you want to train during the week
          </Text>
        </View>

        {/* Days List */}
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
                    className={`text-lg ${
                      isSelected ? "text-white font-bold" : "text-gray-500"
                    }`}
                  >
                    {day.label}
                  </Text>

                  {/* Círculo de Seleção */}
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      isSelected
                        ? "border-[#E31C25] bg-[#E31C25]/20"
                        : "border-gray-600 bg-transparent"
                    }`}
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

        {/* Footer Navigation */}
        <View className="flex-row justify-between items-center mb-2">
          {/* Botão Back */}
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          {/* Botão Next (Validado) */}
          <TouchableOpacity
            disabled={isNextDisabled}
            activeOpacity={0.8}
            onPress={() => router.replace("/(tabs)")} // O replace impede o user de voltar ao onboarding
            className={`flex-row items-center py-4 px-8 rounded-full ${
              isNextDisabled ? "bg-zinc-800 opacity-50" : "bg-[#E31C25]"
            }`}
          >
            <Text
              className={`text-lg font-bold mr-2 ${isNextDisabled ? "text-gray-500" : "text-white"}`}
            >
              Next
            </Text>
            <ChevronRight color={isNextDisabled ? "#666" : "white"} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
