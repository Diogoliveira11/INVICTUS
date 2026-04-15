import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
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

interface WorkoutExercise {
  exercise_name: string;
  total_sets: number;
  max_reps: number;
  max_weight: number;
}

export default function ProgressResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { height: screenHeight } = useWindowDimensions();

  const [workoutsCount, setWorkoutsCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState<Workout[]>([]);

  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );

  // 1. GUARDIÃO DE PERFIL (Proteção extra)
  useFocusEffect(
    useCallback(() => {
      const checkProfile = async () => {
        const complete = await AsyncStorage.getItem("profileComplete");
        const email = await AsyncStorage.getItem("userEmail");

        if (!email) {
          router.replace("/auth/login");
        } else if (complete !== "true") {
          router.replace("/gender");
        }
      };
      checkProfile();
    }, []),
  );

  const durationToSeconds = (duration: string) => {
    if (!duration || typeof duration !== "string") return 0;
    const parts = duration.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  // 2. CARREGAR ESTATÍSTICAS
  const loadStats = useCallback(async () => {
    try {
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
      console.error("Erro ao carregar estatísticas:", e);
    }
  }, [db]);

  const loadWorkoutDetails = async (workout: Workout) => {
    try {
      const details = await db.getAllAsync<WorkoutExercise>(
        `SELECT 
            e.name as exercise_name, 
            COUNT(ws.id) as total_sets, 
            MAX(ws.weight) as max_weight, 
            MAX(ws.reps) as max_reps 
          FROM workout_sets ws
          JOIN exercises e ON ws.exercise_id = e.id
          WHERE ws.workout_id = ?
          GROUP BY ws.exercise_id`,
        [workout.id],
      );

      setSelectedWorkout(workout);
      setWorkoutExercises(details || []);
      setIsHistoryVisible(false);
      setTimeout(() => setIsDetailsVisible(true), 300);
    } catch (e) {
      console.error("Erro ao carregar detalhes:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text className="text-white text-3xl font-black uppercase italic">
              Progress Result
            </Text>
            <Text className="text-[#E31C25] text-2xl font-black italic mt-1 uppercase">
              Full Stats
            </Text>
            <View className="mt-4 bg-zinc-900/90 px-10 py-3 rounded-2xl border border-zinc-800">
              <Text className="text-zinc-200 text-lg font-black italic uppercase">
                Diogo Oliveira
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between px-5 mt-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsHistoryVisible(true)}
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-900"
          >
            <Text className="text-zinc-500 text-[10px] font-black mb-4 uppercase tracking-widest">
              Workouts
            </Text>
            <View className="w-20 h-20 rounded-full border-[4px] border-[#E31C25] items-center justify-center">
              <Text className="text-white text-2xl font-black italic">
                {workoutsCount}
                <Text className="text-zinc-600 text-2xl">/15</Text>
              </Text>
            </View>
            <View className="flex-row mt-5 gap-3">
              <View className="items-center">
                <Text className="text-zinc-300 font-black text-xl italic">
                  {totalHours}
                </Text>
                <Text className="text-zinc-600 text-[8px] uppercase">h</Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-300 font-black text-xl italic">
                  {totalMinutes}
                </Text>
                <Text className="text-zinc-600 text-[8px] uppercase">min</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-900"
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
      </ScrollView>

      {/* MODAL 1: HISTÓRICO */}
      <Modal
        visible={isHistoryVisible}
        animationType="slide"
        transparent
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
            <View className="flex-row items-center px-8 py-8">
              <TouchableOpacity
                onPress={() => setIsHistoryVisible(false)}
                className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center"
              >
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-black italic uppercase ml-4">
                Workout History
              </Text>
            </View>
            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
              {weeklyHistory.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  onPress={() => loadWorkoutDetails(workout)}
                  className="bg-[#121212] p-6 rounded-[35px] mb-4 border border-zinc-900"
                >
                  <Text className="text-[#E31C25] text-[10px] font-black uppercase mb-2">
                    {new Date(workout.date).toDateString() ===
                    new Date().toDateString()
                      ? "HOJE"
                      : "ESTA SEMANA"}
                  </Text>
                  <Text className="text-white text-xl font-black italic uppercase mb-4">
                    {workout.name || "Treino Invictus"}
                  </Text>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#52525b" />
                    <Text className="text-zinc-400 text-xs font-black ml-2 italic">
                      {workout.duration}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DETALHES */}
      <Modal
        visible={isDetailsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              height: "88%",
              backgroundColor: "#000",
              borderTopLeftRadius: 45,
              borderTopRightRadius: 45,
              borderTopWidth: 1,
              borderColor: "#27272a",
            }}
          >
            <View className="flex-row items-center px-8 py-8 justify-between">
              <TouchableOpacity
                onPress={() => setIsDetailsVisible(false)}
                className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center"
              >
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-black italic uppercase">
                {selectedWorkout?.name || "Detalhes"}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
              {workoutExercises.map((ex, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between py-6 border-b border-zinc-900/40"
                >
                  <View className="flex-1">
                    <Text className="text-white text-base font-black italic uppercase">
                      {ex.exercise_name}
                    </Text>
                    <Text className="text-zinc-500 text-[10px] font-bold uppercase mt-1">
                      {ex.total_sets} Sets • Max {ex.max_reps} Reps
                    </Text>
                  </View>
                  <View className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
                    <Text className="text-[#E31C25] font-black italic">
                      {ex.max_weight} kg
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
