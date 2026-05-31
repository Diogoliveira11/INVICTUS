import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Pentagon,
  PersonStanding,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── tipos ──────
interface MuscleVolume {
  muscle_group: string;
  total_volume: number;
}

interface DayWorkout {
  letter: string;
  dayNum: number;
  hasWorkout: boolean;
  isToday: boolean;
}

function getLast7Days(): DayWorkout[] {
  const days = [];
  const now = new Date();
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      letter: letters[d.getDay()],
      dayNum: d.getDate(),
      hasWorkout: false,
      isToday: i === 0,
    });
  }
  return days;
}

// ─── componente principal ──────
export default function StatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [days, setDays] = useState<DayWorkout[]>(getLast7Days());
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolume[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // ── carregar dados ────────────
  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!userRow) return;

      const workoutDates = await db.getAllAsync<{ date: string }>(
        `SELECT date FROM workouts
         WHERE user_id = ?
           AND date >= date('now', '-6 days')
         ORDER BY date ASC`,
        [userRow.id],
      );

      const workedDays = new Set(
        workoutDates.map((w) => new Date(w.date).getDate()),
      );

      setDays((prev) =>
        prev.map((d) => ({ ...d, hasWorkout: workedDays.has(d.dayNum) })),
      );

      const volRows = await db.getAllAsync<MuscleVolume>(
        `SELECT e.muscle_group,
                SUM(CAST(ws.weight AS REAL) * CAST(ws.reps AS INTEGER)) AS total_volume
         FROM workout_sets ws
         JOIN workout_exercises we ON ws.workout_exercise_id = we.id
         JOIN exercises e          ON ws.exercise_id = e.id
         JOIN workouts w           ON we.workout_id = w.id
         WHERE w.user_id = ?
           AND w.date >= date('now', '-6 days')
           AND e.muscle_group != 'CARDIO'
         GROUP BY e.muscle_group
         ORDER BY total_volume DESC`,
        [userRow.id],
      );
      setMuscleVolume(volRows);
    } catch (e) {
      console.error("[Statistics] loadData:", e);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Itens de estatística ─────
  const advancedItems = [
    {
      icon: <Pentagon size={22} color="#9ca3af" />,
      label: "Muscle distribution (Chart)",
      subtitle: "Compare your current and previous muscle distributions.",
      route: "/muscle_distribution_chart",
    },
    {
      icon: <PersonStanding size={22} color="#9ca3af" />,
      label: "Muscle distribution (Body)",
      subtitle: "Weekly heat map of muscles worked.",
      route: "/muscle_distribution_body",
    },
    {
      icon: <Dumbbell size={22} color="#9ca3af" />,
      label: "Main exercises",
      subtitle: "List of exercises you do most often.",
      route: "/main_exercises",
    },
    {
      icon: <BarChart2 size={22} color="#9ca3af" />,
      label: "Monthly Report",
      subtitle: "Recap of your monthly workouts and statistics.",
      route: "/monthly_report",
    },
  ];

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* ── HEADER ── */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide">
          Statistics
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── ULTIMOS 7 DIAS ── */}
        <View className="px-4 pt-5">
          <Text className="text-white text-[17px] font-bold mb-4">
            Last 7 days
          </Text>

          {/* SELECIONAR DIA */}
          <View className="flex-row justify-between mb-6">
            {days.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDay(d.dayNum)}
                className={`w-[42px] h-[62px] rounded-2xl items-center justify-center relative ${
                  selectedDay === d.dayNum ? "bg-[#E31C25]" : "bg-[#1a1a1a]"
                }`}
              >
                <Text
                  className={`text-xs font-bold mb-1 ${
                    selectedDay === d.dayNum ? "text-white" : "text-gray-500"
                  }`}
                >
                  {d.letter}
                </Text>
                <Text
                  className={`text-base font-bold ${
                    selectedDay === d.dayNum ? "text-white" : "text-gray-400"
                  }`}
                >
                  {d.dayNum}
                </Text>
                {/* ponto de hoje */}
                {d.isToday && selectedDay !== d.dayNum && (
                  <View className="w-[5px] h-[5px] rounded-full bg-[#E31C25] absolute bottom-1.5" />
                )}
                {/* ponto do treino */}
                {d.hasWorkout && selectedDay !== d.dayNum && (
                  <View className="w-[5px] h-[5px] rounded-full bg-red-400 absolute bottom-1.5" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {muscleVolume.length === 0 && (
            <Text className="text-gray-600 text-center text-xs mb-2">
              No workouts logged this week
            </Text>
          )}
        </View>

        {/* ── SEPARADOR ── */}
        <View className="h-2 bg-zinc-900/50 mt-4" />

        {/* ── ESTATÍSTICA AVANÇADA ── */}
        <View className="pt-1">
          <Text className="text-gray-500 text-[13px] px-5 py-3.5 font-medium">
            Advanced statistics
          </Text>

          {advancedItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
              className="flex-row items-center px-5 py-4 border-b border-zinc-900 bg-black"
            >
              {/* icon */}
              <View className="w-9 mr-3.5">{item.icon}</View>

              {/* text */}
              <View className="flex-1">
                <Text className="text-white text-[15px] font-semibold mb-0.5">
                  {item.label}
                </Text>
                <Text className="text-gray-500 text-[13px] leading-[18px]">
                  {item.subtitle}
                </Text>
              </View>

              <ChevronRight size={18} color="#4b5563" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
