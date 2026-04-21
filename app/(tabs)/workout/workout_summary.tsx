import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite"; // 1. Importar o contexto
import { Clock, Trophy, Weight, Zap } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const db = useSQLiteContext(); // 2. Usar a instância central da BD
  const [data, setData] = useState<any>(null);

  // Buscar o último treino gravado usando o contexto global
  const fetchSummary = async () => {
    try {
      // Pegar o último treino inserido
      const lastWorkout = await db.getFirstAsync<any>(
        "SELECT * FROM workouts ORDER BY id DESC LIMIT 1",
      );

      if (lastWorkout) {
        // Contar quantas séries foram feitas nesse treino específico
        const setsResult = await db.getFirstAsync<any>(
          "SELECT COUNT(*) as count FROM workout_sets WHERE workout_id = ?",
          [lastWorkout.id],
        );

        setData({ ...lastWorkout, setsCount: setsResult?.count || 0 });
      }
    } catch (e) {
      console.error("Erro ao carregar resumo:", e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [db]); // Adicionado db como dependência

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <ScrollView className="flex-1 px-6 pt-10">
        {/* Cabeçalho de Sucesso */}
        <View className="items-center mb-10">
          <View className="bg-amber-500/20 p-6 rounded-full mb-4 border border-amber-500/20">
            <Trophy size={60} color="#f59e0b" />
          </View>
          <Text className="text-white text-3xl font-black mb-1">Good job!</Text>
          <Text className="text-zinc-500 text-base">
            Training session completed successfully
          </Text>
        </View>

        {/* Grelha de Stats */}
        <View className="flex-row flex-wrap justify-between mb-8">
          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] mb-4 border border-zinc-800 items-center">
            <Clock size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.duration || "00:00"}
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Time
            </Text>
          </View>

          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] mb-4 border border-zinc-800 items-center">
            <Weight size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.total_volume || "0"} kg
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Volume
            </Text>
          </View>

          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] border border-zinc-800 items-center">
            <Zap size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.setsCount || "0"}
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Series
            </Text>
          </View>
        </View>

        {/* Card de Mensagem Motivacional */}
        <View className="bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 items-center">
          <Text className="text-zinc-400 text-center italic">
            Consistency is what turns the ordinary into the extraordinary.
          </Text>
        </View>
      </ScrollView>

      {/* Botão Concluído */}
      <View className="px-6 mb-10">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout")}
          className="bg-[#E31C25] w-full py-5 rounded-2xl items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg uppercase tracking-widest">
            Completed
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
