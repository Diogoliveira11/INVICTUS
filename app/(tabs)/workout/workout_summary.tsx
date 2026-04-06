import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
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
  const [data, setData] = useState<any>(null);

  // Buscar o último treino gravado para mostrar os dados reais
  const fetchSummary = async () => {
    try {
      const db = await SQLite.openDatabaseAsync("v2_database.sqlite");

      // Pegar o último treino
      const lastWorkout = await db.getFirstAsync<any>(
        "SELECT * FROM workouts ORDER BY id DESC LIMIT 1",
      );

      if (lastWorkout) {
        // Contar quantas séries foram feitas nesse treino
        const setsResult = await db.getFirstAsync<any>(
          "SELECT COUNT(*) as count FROM workout_sets WHERE workout_id = ?",
          [lastWorkout.id],
        );
        setData({ ...lastWorkout, setsCount: setsResult.count });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <ScrollView className="flex-1 px-6 pt-10">
        {/* Cabeçalho de Sucesso */}
        <View className="items-center mb-10">
          <View className="bg-amber-500/20 p-6 rounded-full mb-4 border border-amber-500/20">
            <Trophy size={60} color="#f59e0b" />
          </View>
          <Text className="text-white text-3xl font-black mb-1">
            Bom trabalho!
          </Text>
          <Text className="text-zinc-500 text-base">
            Treino finalizado com sucesso
          </Text>
        </View>

        {/* Grelha de Stats (Igual ao Hevy) */}
        <View className="flex-row flex-wrap justify-between mb-8">
          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] mb-4 border border-zinc-800 items-center">
            <Clock size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.duration || "00:00"}
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Tempo
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
              Séries
            </Text>
          </View>

          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] border border-zinc-800 items-center">
            <Trophy size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">1º</Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Lugar
            </Text>
          </View>
        </View>

        {/* Card de Mensagem Motivacional */}
        <View className="bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 items-center">
          <Text className="text-zinc-400 text-center italic">
            A consistência é o que transforma o comum em extraordinário.
          </Text>
        </View>
      </ScrollView>

      {/* Botão Done */}
      <View className="px-6 mb-10">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout")}
          className="bg-[#E31C25] w-full py-5 rounded-2xl items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg uppercase tracking-widest">
            Concluído
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
