import { useLocalSearchParams, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { ArrowLeft, Trash2 } from "lucide-react-native";
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

// Caminho para subir de [id] -> exercises -> (tabs) e chegar à raiz
const GIF_MAP: { [key: string]: any } = {
  "assets/exercises_gifs/barbell_decline_bench_press_chest.gif": require("./../../../assets/exercises_gifs/barbell_decline_bench_press_chest.gif"),
};

type ExerciseDetails = {
  id: number;
  name: string;
  muscle_group: string;
  image: string;
  gif: string | null;
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
      "Are you sure you want to delete this exercise?",
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
              router.back();
            } catch (error) {
              console.error("Erro ao eliminar:", error);
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
      {/* Header Corrigido para voltar ao Explore ou Index */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/workout");
            }
          }}
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

      {/* Tabs */}
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

            {/* ... restante do seu UI de records e delete ... */}
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center mt-4 mb-10 py-4 bg-zinc-900/50 rounded-2xl border border-red-900/20"
            >
              <Trash2 color="#ef4444" size={20} />
              <Text className="text-red-500 font-semibold ml-2 text-base">
                Delete Exercise
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
