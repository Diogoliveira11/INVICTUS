import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Trash2,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GIF_MAP: { [key: string]: any } = {
  "assets/exercises_gifs/barbell_decline_bench_press.gif": require("../../../assets/exercises_gifs/barbell_decline_bench_press.gif"),
};

type ExerciseDetails = {
  id: number;
  name: string;
  muscle_group: string;
  image: string | null;
  gif: string | null;
  instructions: string | null;
  is_custom: number;
};

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from: string }>(); // Captura o 'from'
  const db = useSQLiteContext();

  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    async function loadExercise() {
      try {
        const result = await db.getFirstAsync<ExerciseDetails>(
          "SELECT id, name, muscle_group, image, gif, instructions, is_custom FROM exercises WHERE id = ?",
          [id as string],
        );

        if (result) {
          setExercise(result);
          setActiveTab(result.is_custom === 1 ? "History" : "Summary");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExercise();
  }, [id, db]);

  // VOLTAR BASEADO NA ORIGEM
  const handleBack = () => {
    if (from === "workout") {
      // Caminho completo para o log de treino
      router.replace("/(tabs)/workout/log_workout" as any);
    } else if (from === "new_routine") {
      // CAMINHO CORRIGIDO: O ficheiro está dentro da pasta workout
      router.replace("/(tabs)/workout/new_routine" as any);
    } else {
      // Caso padrão: Explore Exercises
      router.replace("/(tabs)/workout/explore_exercises" as any);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Eliminar", "Tens a certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await db.runAsync("DELETE FROM exercises WHERE id = ?", [
              id as string,
            ]);
            router.replace("/workout/explore_exercises");
          } catch (error) {
            Alert.alert("Erro", "Não foi possível eliminar.");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );
  if (!exercise)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Não encontrado.</Text>
      </View>
    );

  const tabs =
    exercise.is_custom === 1
      ? ["History", "How to"]
      : ["Summary", "History", "How to"];
  const gifSource = exercise.gif ? GIF_MAP[exercise.gif] : null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase italic"
        >
          {exercise.name}
        </Text>
        {exercise.is_custom === 1 ? (
          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Trash2 color="#ef4444" size={22} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <View className="flex-row border-b border-zinc-900">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center ${activeTab === tab ? "border-b-2 border-[#E31C25]" : ""}`}
          >
            <Text
              className={`font-black uppercase text-[10px] tracking-widest ${activeTab === tab ? "text-[#E31C25]" : "text-zinc-600"}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === "Summary" && exercise.is_custom === 0 && (
          <View className="p-5">
            <View className="w-full h-80 bg-white rounded-[40px] overflow-hidden mb-6 items-center justify-center border-4 border-zinc-900">
              {gifSource ? (
                <Image
                  source={gifSource}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <ActivityIndicator color="#E31C25" />
              )}
            </View>
            <View className="bg-zinc-900/50 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-500 uppercase font-black text-[10px] mb-1">
                Músculo Principal
              </Text>
              <Text className="text-white text-2xl font-black italic uppercase">
                {exercise.muscle_group}
              </Text>
            </View>
          </View>
        )}

        {activeTab === "History" && (
          <View className="p-6">
            {exercise.is_custom === 1 && (
              <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-900 mb-8 flex-row items-center">
                <View className="w-12 h-12 bg-[#E31C25]/10 rounded-2xl items-center justify-center mr-4">
                  <Target color="#E31C25" size={24} />
                </View>
                <View>
                  <Text className="text-zinc-500 uppercase font-black text-[8px]">
                    Muscle Group
                  </Text>
                  <Text className="text-white text-lg font-black italic uppercase">
                    {exercise.muscle_group}
                  </Text>
                </View>
              </View>
            )}
            <View className="items-center justify-center pt-10">
              <Trophy size={48} color="#f59e0b" />
              <Text className="text-white font-black uppercase italic text-lg mt-4">
                Personal Records
              </Text>
              <Text className="text-zinc-500 text-center mt-2 px-6 font-medium">
                Sem histórico disponível.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "How to" && (
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <BookOpen size={20} color="#E31C25" />
              <Text className="text-white font-black ml-2 uppercase italic text-lg">
                Instruções
              </Text>
            </View>
            <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-400 leading-6 text-base italic">
                {exercise.instructions || "Sem instruções para este exercício."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
