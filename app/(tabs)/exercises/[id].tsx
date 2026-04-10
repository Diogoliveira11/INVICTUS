import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, BookOpen, Trash2, Trophy } from "lucide-react-native";
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

// Map de GIFs - Garante que as chaves no DB coincidem com estas strings
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
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();

  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Summary");

  // Carregar dados do exercício
  useEffect(() => {
    async function loadExercise() {
      try {
        const result = await db.getFirstAsync<ExerciseDetails>(
          "SELECT id, name, muscle_group, image, gif, instructions FROM exercises WHERE id = ?",
          [id as string],
        );

        if (result) {
          setExercise(result);
        }
      } catch (e) {
        console.error("Erro ao carregar detalhes:", e);
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [id, db]);

  const handleDelete = async () => {
    Alert.alert(
      "Eliminar Exercício",
      "Tens a certeza que queres eliminar este exercício permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync("DELETE FROM exercises WHERE id = ?", [
                id as string,
              ]);
              router.back();
            } catch (error) {
              console.error("Erro ao eliminar:", error);
              Alert.alert("Erro", "Não foi possível eliminar o exercício.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Exercício não encontrado.</Text>
      </View>
    );
  }

  const gifSource = exercise.gif ? GIF_MAP[exercise.gif] : null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/workout")
          }
          className="p-2"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          className="text-white text-lg font-bold flex-1 text-center px-4 uppercase italic"
        >
          {exercise.name}
        </Text>
        <View className="w-10" />
      </View>

      {/* Tabs Selector */}
      <View className="flex-row border-b border-zinc-900">
        {["Summary", "History", "How to"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center ${
              activeTab === tab ? "border-b-2 border-[#E31C25]" : ""
            }`}
          >
            <Text
              className={`font-bold uppercase text-xs tracking-widest ${activeTab === tab ? "text-[#E31C25]" : "text-zinc-500"}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* CONTEÚDO: SUMMARY */}
        {activeTab === "Summary" && (
          <View className="p-5">
            <View className="w-full h-80 bg-white rounded-[40px] overflow-hidden mb-6 items-center justify-center border-4 border-zinc-900">
              {gifSource ? (
                <Image
                  source={gifSource}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <View className="items-center">
                  <ActivityIndicator color="#E31C25" />
                  <Text className="text-zinc-400 mt-2">
                    A carregar animação...
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-zinc-900/50 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-500 uppercase font-black text-[10px] tracking-widest mb-1">
                Músculo Principal
              </Text>
              <Text className="text-white text-2xl font-black italic uppercase">
                {exercise.muscle_group}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center mt-10 mb-10 py-5 bg-red-500/10 rounded-3xl border border-red-500/20"
            >
              <Trash2 color="#ef4444" size={20} />
              <Text className="text-red-500 font-bold ml-2 uppercase tracking-tighter">
                Eliminar Exercício Personalizado
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CONTEÚDO: HISTORY (Recordes Pessoais) */}
        {activeTab === "History" && (
          <View className="p-6 items-center justify-center pt-20">
            <Trophy size={48} color="#f59e0b" />
            <Text className="text-white font-bold text-lg mt-4">
              Personal Records
            </Text>
            <Text className="text-zinc-500 text-center mt-2">
              Ainda não tens histórico para este exercício. Completa um treino
              para veres a tua evolução!
            </Text>
          </View>
        )}

        {/* CONTEÚDO: HOW TO (Instruções) */}
        {activeTab === "How to" && (
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <BookOpen size={20} color="#E31C25" />
              <Text className="text-white font-bold ml-2 uppercase italic text-lg">
                Instruções
              </Text>
            </View>
            <Text className="text-zinc-400 leading-6 text-base">
              {exercise.instructions ||
                "Não existem instruções detalhadas para este exercício ainda."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
