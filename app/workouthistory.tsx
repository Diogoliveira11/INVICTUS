import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Clock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Definição do tipo baseada na sua tabela 'workouts'
type WorkoutEntry = {
  id: number;
  title: string;
  date: string;
  duration: string;
  total_volume: number;
};

export default function WorkoutHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [history, setHistory] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const rows = await db.getAllAsync<WorkoutEntry>(
        `SELECT id, title, date, duration, total_volume 
         FROM workouts 
         WHERE user_id = (SELECT id FROM users WHERE email = ?)
         ORDER BY date DESC`,
        [email],
      );

      setHistory(rows);
    } catch (e) {
      console.error("Erro ao carregar histórico de treinos:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const workoutDate = new Date(dateStr);
    const today = new Date();

    const workoutDay = new Date(
      workoutDate.getFullYear(),
      workoutDate.getMonth(),
      workoutDate.getDate(),
    );
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const diffTime = todayDay.getTime() - workoutDay.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "TODAY";
    } else if (diffDays === 1) {
      return "YESTERDAY";
    } else {
      return workoutDate
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/profile")}
          className="p-2"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black flex-1 text-center px-4 uppercase">
          Workout History
        </Text>
        {/* Spacer para centrar o título */}
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#E31C25" size="large" />
        </View>
      ) : (
        <ScrollView
          className="px-6 mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {history.length === 0 ? (
            <Text className="text-zinc-500 text-center mt-10 font-bold uppercase">
              Nenhum treino registado ainda.
            </Text>
          ) : (
            history.map((item) => (
              <View
                key={item.id}
                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[30px] mb-4"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="text-[#E31C25] font-bold uppercase text-xs tracking-widest mb-1">
                      {formatDate(item.date)}
                    </Text>
                    <Text className="text-white text-xl font-black">
                      {item.title}
                    </Text>
                  </View>
                  <View className="bg-[#E31C25]/10 px-3 py-1 rounded-full">
                    <Text className="text-[#E31C25] font-bold text-xs">
                      {item.total_volume} kg total
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-6">
                  <View className="flex-row items-center gap-2">
                    <Clock color="#71717a" size={16} />
                    <Text className="text-zinc-400 font-medium">
                      {item.duration}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
