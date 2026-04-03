import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, ChevronLeft, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SaveWorkoutScreen() {
  const router = useRouter();
  const { duration, volume, sets, title } = useLocalSearchParams();
  const [description, setDescription] = useState("");

  const today = new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Save</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/workout/workout_summary",
              params: { volume },
            })
          }
          className="bg-[#E31C25] px-6 py-1.5 rounded-full"
        >
          <Text className="text-white font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-6 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-2xl font-bold">
            {title || "Treino"}
          </Text>
          <TouchableOpacity className="bg-zinc-800 p-1 rounded-full">
            <X size={16} color="zinc-400" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between mb-8">
          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase">
              Duration
            </Text>
            <Text className="text-[#E31C25] text-lg font-bold">
              {duration || "0min"}
            </Text>
          </View>
          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase">
              Volume
            </Text>
            <Text className="text-white text-lg font-bold">
              {volume || "0"} kg
            </Text>
          </View>
          <View>
            <Text className="text-zinc-500 text-xs font-bold uppercase">
              Series
            </Text>
            <Text className="text-white text-lg font-bold">{sets || "0"}</Text>
          </View>
        </View>

        <View className="border-t border-zinc-900 pt-4 mb-6">
          <Text className="text-zinc-500 text-xs font-bold uppercase mb-1">
            When
          </Text>
          <Text className="text-[#E31C25] font-medium">{today}</Text>
        </View>

        {/* Foto Box */}
        <TouchableOpacity className="w-24 h-24 bg-zinc-900 rounded-xl border border-dashed border-zinc-700 items-center justify-center mb-8">
          <Camera size={30} color="#71717a" />
        </TouchableOpacity>

        <View className="border-t border-zinc-900 pt-4">
          <Text className="text-zinc-500 text-xs font-bold uppercase mb-2">
            Description
          </Text>
          <TextInput
            placeholder="Como correu o treinamento? Coloque algumas notas aqui..."
            placeholderTextColor="#3f3f46"
            multiline
            value={description}
            onChangeText={setDescription}
            className="text-white text-base"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/workout")}
          className="mt-20 items-center"
        >
          <Text className="text-red-500 font-bold">Discard Training</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
