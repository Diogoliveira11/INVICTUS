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

  // Dias selecionados por padrão (exemplo)
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

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

        {/* Days List - Com ScrollView caso o ecrã seja pequeno */}
        <ScrollView className="my-6" showsVerticalScrollIndicator={false}>
          <View className="space-y-1">
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  activeOpacity={0.7}
                  onPress={() => toggleDay(day.id)}
                  className={`flex-row justify-between items-center py-5 border-b border-[#2D2F33]`}
                >
                  <Text
                    className={`text-lg ${
                      isSelected ? "text-white font-bold" : "text-gray-500"
                    }`}
                  >
                    {day.label}
                  </Text>

                  {/* Círculo de Seleção (Checkbox) */}
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
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            //onPress={() => router.push("/WeightSelection")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
