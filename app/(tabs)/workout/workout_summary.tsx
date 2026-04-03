import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { volume } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-black justify-between">
      <StatusBar barStyle="light-content" />

      <View className="mt-20 items-center">
        <Text className="text-white text-3xl font-black mb-2">Good job!</Text>
        <Text className="text-zinc-400 text-base">
          This is your first workout
        </Text>
      </View>

      {/* Card Central */}
      <View className="mx-6 bg-[#121417] border border-zinc-800 rounded-[40px] p-10 items-center shadow-2xl">
        <Text className="text-zinc-400 text-lg font-medium mb-4">
          It raised a total of
        </Text>
        <Text className="text-white text-6xl font-black mb-4">
          {volume || "0"} kg
        </Text>
        <Text className="text-zinc-500 text-center text-base italic">
          Consistency is the key to success.
        </Text>
      </View>

      {/* Botão Feito */}
      <View className="px-6 mb-10">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/workout")}
          className="bg-[#E31C25] w-full py-4 rounded-2xl items-center"
        >
          <Text className="text-white font-black text-lg">Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
