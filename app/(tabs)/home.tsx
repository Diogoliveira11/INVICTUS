import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Clock, Dumbbell } from "lucide-react-native";
import React, { useCallback, useState } from "react";

import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Workout {
  id: number;
  name: string;
  duration: string;
  date: string;
  total_volume: number;
}

export default function ProgressResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const [workoutsCount, setWorkoutsCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState<Workout[]>([]);

  // ESTADO DA ABA
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const durationToSeconds = (duration: string) => {
    if (!duration || typeof duration !== "string") return 0;
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const loadStats = useCallback(async () => {
    try {
      const db = await SQLite.openDatabaseAsync("v2_database.sqlite");
      const now = new Date();
      const firstDay = new Date(
        now.setDate(
          now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
        ),
      );
      firstDay.setHours(0, 0, 0, 0);
      const firstDayISO = firstDay.toISOString();

      const workoutRes = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM workouts WHERE date >= ?",
        [firstDayISO],
      );
      setWorkoutsCount(workoutRes?.count || 0);

      const volumeRes = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(total_volume) as total FROM workouts WHERE date >= ?",
        [firstDayISO],
      );
      setTotalVolume(volumeRes?.total || 0);

      const historyRows = await db.getAllAsync<Workout>(
        "SELECT * FROM workouts WHERE date >= ? ORDER BY id DESC",
        [firstDayISO],
      );
      setWeeklyHistory(historyRows || []);

      let totalSeconds = 0;
      historyRows.forEach((item) => {
        totalSeconds += durationToSeconds(item.duration);
      });
      setTotalHours(Math.floor(totalSeconds / 3600));
      setTotalMinutes(Math.floor((totalSeconds % 3600) / 60));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* --- ECRÃ PRINCIPAL --- */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Foto */}
        <View
          style={{
            height: screenHeight * 0.58,
            marginTop: insets.top + (Platform.OS === "ios" ? 0 : 10),
            marginHorizontal: 8,
          }}
          className="relative rounded-[45px] overflow-hidden"
        >
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
            }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/30" />
          <View className="absolute bottom-6 w-full items-center">
            <Text className="text-white text-3xl font-black uppercase tracking-tighter italic">
              Progress Result
            </Text>
            <Text className="text-[#E31C25] text-2xl font-black italic mt-1 uppercase">
              Full Stats
            </Text>
            <View className="mt-4 bg-zinc-900/90 px-10 py-3 rounded-2xl border border-zinc-800 shadow-2xl">
              <Text className="text-zinc-200 text-lg font-black italic uppercase">
                Diogo Oliveira
              </Text>
            </View>
          </View>
        </View>

        {/* Zona dos Botões */}
        <View className="flex-row justify-between px-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsHistoryVisible(true)} // ATIVA O MODAL
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-900 shadow-sm"
          >
            <Text className="text-zinc-500 text-[10px] font-black mb-4 uppercase tracking-widest">
              Workouts
            </Text>
            <View className="w-20 h-20 rounded-full border-[4px] border-[#E31C25] items-center justify-center relative">
              <View className="absolute w-20 h-20 rounded-full border-[4px] border-zinc-900 -z-10" />
              <Text className="text-white text-2xl font-black italic">
                {workoutsCount}
                <Text className="text-zinc-600 text-2xl">/7</Text>
              </Text>
            </View>
            <View className="flex-row mt-5 gap-3">
              <View className="items-center">
                <Text className="text-zinc-300 font-black text-xl italic">
                  {totalHours}
                </Text>
                <Text className="text-zinc-600 text-[8px] uppercase font-black">
                  h
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-300 font-black text-xl italic">
                  {totalMinutes}
                </Text>
                <Text className="text-zinc-600 text-[8px] uppercase font-black">
                  min
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-900 shadow-sm"
          >
            <Text className="text-zinc-500 text-[10px] font-black mb-4 uppercase tracking-widest">
              Total Volume
            </Text>
            <View className="h-20 justify-center">
              <Dumbbell size={40} color="#E31C25" />
            </View>
            <View className="mt-5 items-center">
              <Text className="text-zinc-200 text-xl font-black italic">
                {totalVolume >= 1000
                  ? `${(totalVolume / 1000).toFixed(1)}k`
                  : totalVolume}
              </Text>
              <Text className="text-zinc-500 text-[10px] font-black uppercase mt-1">
                Kg Lifted
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Frase Motivacional */}
        <View className="mt-12 px-8 mb-10">
          <Text className="text-zinc-600 text-center italic leading-5 text-xs font-bold uppercase tracking-tighter">
            Discipline is the bridge between goals and achievements
          </Text>
        </View>

        {/* AQUI NÃO HÁ MAIS NADA! A LISTA DEBAIXO FOI REMOVIDA DAQUI. */}
      </ScrollView>

      {/* --- MODAL (ABA) QUE SÓ APARECE AO CLICAR --- */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHistoryVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              height: "85%",
              backgroundColor: "#000",
              borderTopLeftRadius: 45,
              borderTopRightRadius: 45,
              borderTopWidth: 1,
              borderColor: "#27272a",
            }}
          >
            {/* Header da Aba */}
            <View className="flex-row items-center px-8 py-8">
              <TouchableOpacity
                onPress={() => setIsHistoryVisible(false)}
                className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center"
              >
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-black italic uppercase ml-4 tracking-tighter">
                Workout History
              </Text>
            </View>

            {/* LISTA DE TREINOS - EXCLUSIVA DESTA ABA */}
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {weeklyHistory.map((workout) => (
                <View
                  key={workout.id}
                  className="bg-[#121212] p-6 rounded-[35px] mb-4 border border-zinc-900 shadow-sm"
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[#E31C25] text-[10px] font-black tracking-widest uppercase">
                      {new Date(workout.date).toDateString() ===
                      new Date().toDateString()
                        ? "HOJE"
                        : "ESTA SEMANA"}
                    </Text>
                    <View className="bg-[#E31C25]/10 px-3 py-1 rounded-full border border-[#E31C25]/20">
                      <Text className="text-[#E31C25] text-[10px] font-black italic">
                        {Math.floor(workout.total_volume / 15 + 150)} KCAL
                      </Text>
                    </View>
                  </View>
                  <Text className="text-white text-xl font-black italic uppercase mb-4 tracking-tight">
                    {workout.name || "Treino Invictus"}
                  </Text>
                  <View className="flex-row items-center gap-6">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#52525b" />
                      <Text className="text-zinc-400 text-xs font-black ml-2 italic">
                        {workout.duration}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                      <Text className="text-zinc-500 text-[10px] font-black uppercase italic">
                        Completed
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
