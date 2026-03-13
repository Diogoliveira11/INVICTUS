import { useRouter } from "expo-router";
import { Calendar, ChevronLeft, Clock } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const history = [
    { id: "1", type: "Full Body", date: "Hoje", time: "1h 22m", kcal: "450" },
    { id: "2", type: "Upper Body", date: "Ontem", time: "58m", kcal: "320" },
    { id: "3", type: "Leg Day", date: "11 Mar", time: "1h 10m", kcal: "510" },
  ];

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-zinc-900 p-2 rounded-full"
        >
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-black ml-4 uppercase tracking-tighter">
          Workout History
        </Text>
      </View>

      <ScrollView className="px-6 mt-4" showsVerticalScrollIndicator={false}>
        {history.map((item) => (
          <View
            key={item.id}
            className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[30px] mb-4"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-[#E31C25] font-bold uppercase text-xs tracking-widest mb-1">
                  {item.date}
                </Text>
                <Text className="text-white text-xl font-black">
                  {item.type}
                </Text>
              </View>
              <View className="bg-[#E31C25]/10 px-3 py-1 rounded-full">
                <Text className="text-[#E31C25] font-bold text-xs">
                  {item.kcal} kcal
                </Text>
              </View>
            </View>

            <View className="flex-row gap-6">
              <View className="flex-row items-center gap-2">
                <Clock color="#71717a" size={16} />
                <Text className="text-zinc-400 font-medium">{item.time}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Calendar color="#71717a" size={16} />
                <Text className="text-zinc-400 font-medium">Completed</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
