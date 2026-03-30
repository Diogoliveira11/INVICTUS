import { useLocalSearchParams, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { ArrowLeft, Info, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const GIF_MAP: { [key: string]: any } = {
  "assets/exercises_gifs/barbell_decline_bench_press_chest.gif": require("../../../assets/exercises_gifs/barbell_decline_bench_press_chest.gif"),
};

type ExerciseDetails = {
  id: number;
  name: string;
  muscle_group: string;
  image: string; // PNG da lista
  gif: string | null; // GIF dos detalhes
  instructions: string | null;
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Summary");
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercise() {
      try {
        const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
        const result = await db.getFirstAsync<ExerciseDetails>(
          "SELECT id, name, muscle_group, image, gif, instructions FROM exercises WHERE id = ?",
          [id as string],
        );
        if (result) setExercise(result);
      } catch (e) {
        console.error("Erro ao carregar detalhes:", e);
      } finally {
        setLoading(false);
      }
    }
    loadExercise();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync(
                "inicializedatabase.sqlite",
              );
              await db.runAsync("DELETE FROM exercises WHERE id = ?", [
                id as string,
              ]);
              router.push("/exercises");
            } catch (error) {
              console.error("Erro ao eliminar:", error);
              Alert.alert("Error", "Could not delete the exercise.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#E31C25" />
      </View>
    );
  }

  if (!exercise) return null;

  const gifSource = exercise.gif ? GIF_MAP[exercise.gif] : null;

  return (
    <SafeAreaView className="flex-1 bg-[#000000]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={() => router.push("/exercises")}
          className="p-2 -ml-2"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          className="text-white text-[17px] font-semibold flex-1 text-center px-2"
        >
          {exercise.name}
        </Text>

        <View className="w-10" />
      </View>

      {/* Tabs Selector - MUDADO PARA VERMELHO */}
      <View className="flex-row border-b border-zinc-800/50">
        {["Summary", "History", "How to"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 items-center ${activeTab === tab ? "border-b-2 border-[#E31C25]" : ""}`}
          >
            <Text
              className={`text-[15px] font-medium ${activeTab === tab ? "text-[#E31C25]" : "text-zinc-500"}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === "Summary" && (
          <View className="p-4">
            <View className="w-full h-72 bg-white rounded-2xl overflow-hidden mb-6 items-center justify-center">
              {gifSource ? (
                <Image
                  source={gifSource}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Text className="text-zinc-400">
                  GIF animation not available
                </Text>
              )}
            </View>

            <Text className="text-white text-2xl font-bold">
              {exercise.name}
            </Text>
            <Text className="text-zinc-400 text-base mb-6">
              Primary: {exercise.muscle_group}
            </Text>

            {/* Gráfico Placeholder - MUDADO PARA VERMELHO/ZINC */}
            <View className="flex-row justify-between items-end mb-2">
              <View>
                <Text className="text-white text-xl font-bold">143 kg</Text>
                <Text className="text-[#E31C25] text-xs">Feb 19</Text>
              </View>
              <Text className="text-zinc-500 text-xs font-medium">
                Last 3 months ∨
              </Text>
            </View>
            <View className="w-full h-32 border-b border-l border-zinc-800 mb-8 justify-center items-center">
              <Text className="text-zinc-800">Evolution Chart</Text>
            </View>

            {/* Personal Records */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-yellow-500 mr-2">🏆</Text>
                <Text className="text-white text-lg font-bold">
                  Personal Records
                </Text>
              </View>
              <Info color="#52525b" size={18} />
            </View>

            <View className="bg-zinc-900/30 rounded-xl mb-6">
              {[
                { label: "Heaviest Weight", value: "153kg" },
                { label: "Best 1RM", value: "196.15kg" },
                { label: "Best Set Volume", value: "153kg x 9" },
                { label: "Best Session Volume", value: "3672kg" },
              ].map((item, index) => (
                <View
                  key={index}
                  className={`flex-row justify-between py-4 px-2 ${index !== 3 ? "border-b border-zinc-800/50" : ""}`}
                >
                  <Text className="text-zinc-300 text-base">{item.label}</Text>
                  <Text className="text-white text-base font-bold">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleDelete}
              activeOpacity={0.7}
              className="flex-row items-center justify-center mt-4 mb-10 py-4 bg-zinc-900/50 rounded-2xl border border-red-900/20"
            >
              <Trash2 color="#ef4444" size={20} />
              <Text className="text-red-500 font-semibold ml-2 text-base">
                Delete Exercise
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "How to" && (
          <View className="p-4">
            <View className="flex-row items-center mb-6">
              <View className="w-1 bg-[#E31C25] h-6 rounded-full mr-3" />
              <Text className="text-white text-xl font-bold">
                Execution Guide
              </Text>
            </View>

            {exercise.instructions ? (
              <View className="bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800/50">
                {exercise.instructions
                  .split(/[.\n]/)
                  .filter((s) => s.trim().length > 0)
                  .map((step, index) => (
                    <View key={index} className="flex-row mb-5">
                      <View className="bg-zinc-800 w-7 h-7 rounded-full items-center justify-center mr-4 mt-0.5">
                        <Text className="text-[#E31C25] font-bold text-xs">
                          {index + 1}
                        </Text>
                      </View>
                      <Text className="text-zinc-300 text-[15px] flex-1 leading-6">
                        {step.trim()}.
                      </Text>
                    </View>
                  ))}
              </View>
            ) : (
              <View className="items-center py-20">
                <Info color="#27272a" size={48} />
                <Text className="text-zinc-500 mt-4 text-center">
                  No instructions available yet.
                </Text>
              </View>
            )}

            <View className="mt-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              <Text className="text-zinc-400 text-xs italic text-center">
                Tip: Keep your movements controlled and focus on the mind-muscle
                connection.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
