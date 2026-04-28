import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Clock, Dumbbell, Trophy } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
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
import { useUnits } from "../(tabs)/context/units_context";

interface Workout {
  id: number;
  title: string;
  date: string;
  duration: string;
  notes: string;
  total_volume: number;
}

interface WorkoutExercise {
  exercise_name: string;
  muscle_group: string;
  weight: number;
  reps: number;
  set_type: string;
  index_order: number;
  is_personal_record: number;
  distance: number | null;
  time: string | null;
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
  const [isVolumeModalVisible, setIsVolumeModalVisible] = useState(false);
  const [volumeByExercise, setVolumeByExercise] = useState<
    { name: string; volume: number }[]
  >([]);

  const { weightUnit } = useUnits();
  const weightUnitLower = weightUnit.toLowerCase();

  const [userName, setUserName] = useState("Invictus User");
  const [weeklyGoal, setWeeklyGoal] = useState(0);

  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );

  const loadUserData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{
        username: string;
        weekly_goal: number;
      }>("SELECT username, weekly_goal FROM users WHERE email = ?", [email]);

      if (userRow) {
        setUserName(userRow.username);
        setWeeklyGoal(userRow.weekly_goal || 0);
      }
    } catch (e) {
      console.error("Erro perfil:", e);
    }
  }, [db]);

  const secondsToTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const loadStats = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      if (!userRow) return;

      const now = new Date();
      const firstDay = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      firstDay.setHours(0, 0, 0, 0);
      const firstDayISO = firstDay.toISOString();

      const historyRows = await db.getAllAsync<Workout>(
        "SELECT * FROM workouts WHERE date >= ? AND user_id = ? ORDER BY date DESC",
        [firstDayISO, userRow.id],
      );

      // --- DEBUG: ver os treinos carregados ---
      console.log(
        "[loadStats] workouts esta semana:",
        JSON.stringify(historyRows, null, 2),
      );

      setWeeklyHistory(historyRows || []);
      setWorkoutsCount(historyRows.length);

      const totalV = historyRows.reduce(
        (acc, curr) => acc + (curr.total_volume || 0),
        0,
      );
      setTotalVolume(totalV);

      let totalSeconds = 0;
      historyRows.forEach((item) => {
        if (item.duration) {
          const parts = item.duration.split(":").map(Number);
          if (parts.length === 3)
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
        }
      });

      setTotalHours(Math.floor(totalSeconds / 3600));
      setTotalMinutes(Math.floor((totalSeconds % 3600) / 60));
    } catch (e) {
      console.error("Erro stats:", e);
    }
  }, [db]);

  const loadVolumeByExercise = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      if (!userRow) return;

      const query = `
      SELECT 
        e.name as name, 
        SUM(CAST(ws.weight AS REAL) * CAST(ws.reps AS INTEGER)) as volume
      FROM workout_sets ws
      JOIN exercises e ON ws.exercise_id = e.id
      JOIN workouts w ON ws.workout_exercise_id = w.id
      WHERE w.user_id = ? 
      AND w.date >= date('now', '-7 days')
      GROUP BY e.id
      ORDER BY volume DESC
    `;

      const result = await db.getAllAsync<any>(query, [userRow.id]);
      setVolumeByExercise(result);
    } catch (e) {
      console.error("Erro ao carregar volume por exercício:", e);
    }
  }, [db]);

  const loadWorkoutDetails = async (workout: Workout) => {
    try {
      // --- DEBUG: ver o workout selecionado ---
      console.log(
        "[loadWorkoutDetails] workout selecionado:",
        JSON.stringify(workout, null, 2),
      );

      // --- CORREÇÃO: query correta com parâmetro passado separadamente ---
      const details = await db.getAllAsync<WorkoutExercise>(
        `SELECT 
          e.name as exercise_name,
          e.muscle_group,
          ws.weight, 
          ws.reps,
          ws.distance,
          ws.time,
          ws.set_type, 
          ws.index_order,
          ws.is_personal_record
        FROM workout_sets ws
        JOIN exercises e ON ws.exercise_id = e.id
        WHERE ws.workout_exercise_id = ?
        ORDER BY e.name ASC, ws.index_order ASC`,
        [workout.id], // <-- CORREÇÃO: era `...`[workout.id] (índice de string)
      );

      // --- DEBUG: ver os sets carregados ---
      console.log(
        "[loadWorkoutDetails] sets encontrados:",
        JSON.stringify(details, null, 2),
      );

      setSelectedWorkout(workout);
      setWorkoutExercises(details || []);
      setIsHistoryVisible(false);
      setTimeout(() => setIsDetailsVisible(true), 300);
    } catch (e) {
      console.error("[loadWorkoutDetails] erro:", e);
      Alert.alert("Erro", "Não foi possível carregar os detalhes.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      loadStats();
      loadVolumeByExercise();
    }, [loadUserData, loadStats, loadVolumeByExercise]),
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
                {userName}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between px-5">
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
                <Text className="text-zinc-600">/{weeklyGoal}</Text>
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
            onPress={() => setIsVolumeModalVisible(true)}
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
                Weight Lifted
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL 1: HISTÓRICO */}
      <Modal visible={isHistoryVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/90 justify-end">
          <View className="h-[85%] bg-[#080808] rounded-t-[50px] border-t border-zinc-800">
            <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mt-4" />
            <View className="flex-row items-center px-8 py-8">
              <TouchableOpacity
                onPress={() => setIsHistoryVisible(false)}
                className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-black italic uppercase ml-5 tracking-tighter">
                History
              </Text>
            </View>
            <ScrollView
              className="px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              {weeklyHistory.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  onPress={() => loadWorkoutDetails(workout)}
                  className="bg-zinc-900/40 p-6 rounded-[30px] mb-4 border border-zinc-900 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-[#E31C25] text-[9px] font-black uppercase tracking-widest mb-1">
                      {new Date(workout.date).toLocaleDateString("pt-PT", {
                        weekday: "long",
                      })}
                    </Text>
                    <Text className="text-white text-lg font-black italic uppercase">
                      {workout.title || "Treino"}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Clock size={12} color="#52525b" />
                      <Text className="text-zinc-500 text-[10px] font-black ml-1 uppercase italic">
                        {workout.duration} •{" "}
                        {workout.total_volume > 0
                          ? `${workout.total_volume}${weightUnitLower}`
                          : "Cardio"}
                      </Text>
                    </View>
                  </View>
                  <ChevronLeft
                    size={20}
                    color="#E31C25"
                    style={{ transform: [{ rotate: "180deg" }] }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DETALHES COMPLETOS */}
      <Modal visible={isDetailsVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/95 justify-end">
          <View className="h-[92%] bg-[#050505] rounded-t-[50px] border-t border-[#E31C25]/40">
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mt-4" />
            <View className="px-8 pt-8 pb-6">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => {
                    setIsDetailsVisible(false);
                    setTimeout(() => setIsHistoryVisible(true), 300);
                  }}
                  className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <View className="items-end">
                  <Text className="text-white text-2xl font-black italic uppercase tracking-tighter">
                    {selectedWorkout?.title || "Treino"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#E31C25" />
                    <Text className="text-[#E31C25] text-xs font-black uppercase italic ml-1">
                      {selectedWorkout?.duration || "00:00:00"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row mt-8 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-900 justify-around">
                <View className="items-center">
                  <Text className="text-zinc-500 text-[8px] font-black uppercase">
                    Volume Total
                  </Text>
                  <Text className="text-white font-black italic">
                    {workoutExercises.some(
                      (e) => e.muscle_group?.toLowerCase() === "cardio",
                    )
                      ? "Cardio"
                      : `${selectedWorkout?.total_volume}${weightUnitLower}`}
                  </Text>
                </View>
                <View className="w-[1px] h-full bg-zinc-800" />
                <View className="items-center">
                  <Text className="text-zinc-500 text-[8px] font-black uppercase">
                    Data
                  </Text>
                  <Text className="text-white font-black italic">
                    {selectedWorkout
                      ? new Date(selectedWorkout.date).toLocaleDateString(
                          "pt-PT",
                        )
                      : "--"}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              className="px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {Object.values(
                workoutExercises.reduce(
                  (acc, obj) => {
                    const key = obj.exercise_name;
                    if (!acc[key]) acc[key] = { name: key, sets: [] };
                    acc[key].sets.push(obj);
                    return acc;
                  },
                  {} as Record<
                    string,
                    { name: string; sets: WorkoutExercise[] }
                  >,
                ),
              ).map((group, idx) => (
                <View
                  key={idx}
                  className="mb-6 bg-zinc-900/20 rounded-[40px] p-6 border border-zinc-900"
                >
                  <Text className="text-white text-lg font-black italic uppercase mb-4 tracking-tighter color-[#E31C25]">
                    {group.name}
                  </Text>
                  <View className="flex-row mb-3 px-2">
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-8">
                      Set
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase flex-1 text-center">
                      Type
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-20 text-center">
                      {group.sets[0]?.muscle_group?.toLowerCase() === "cardio"
                        ? "Dist."
                        : "Weight"}
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-24 text-right">
                      {group.sets[0]?.muscle_group?.toLowerCase() === "cardio"
                        ? "Time"
                        : "Reps"}
                    </Text>
                  </View>
                  {group.sets.map((set, sIdx) => {
                    let typeLabel = "NORMAL";
                    let typeColor = "bg-zinc-800";
                    let textColor = "text-zinc-500";
                    switch (set.set_type) {
                      case "W":
                        typeLabel = "WARMUP";
                        typeColor = "bg-amber-500/10";
                        textColor = "text-amber-500";
                        break;
                      case "D":
                        typeLabel = "DROP SET";
                        typeColor = "bg-purple-500/10";
                        textColor = "text-purple-500";
                        break;
                      case "F":
                        typeLabel = "FAILURE";
                        typeColor = "bg-red-500/10";
                        textColor = "text-red-500";
                        break;
                      default:
                        typeLabel = "NORMAL";
                        typeColor = "bg-zinc-800";
                        textColor = "text-zinc-400";
                    }
                    return (
                      <View
                        key={sIdx}
                        className="flex-row items-center py-3 border-b border-zinc-800/30 px-2"
                      >
                        <Text className="text-zinc-500 font-black italic w-8">
                          {sIdx + 1}
                        </Text>
                        <View className="flex-1 items-center">
                          <View
                            className={`px-2 py-0.5 rounded-md ${typeColor}`}
                          >
                            <Text
                              className={`text-[8px] font-black ${textColor}`}
                            >
                              {typeLabel}
                            </Text>
                          </View>
                        </View>
                        <View className="w-20 flex-row items-center justify-center">
                          <Text
                            className="text-white font-black italic text-center"
                            numberOfLines={1}
                          >
                            {set.muscle_group?.toLowerCase() === "cardio"
                              ? `${parseFloat(String(set.distance ?? set.weight ?? 0).replace(",", "."))}km`
                              : `${set.weight}${weightUnitLower}`}
                          </Text>
                          {set.is_personal_record === 1 && (
                            <Trophy
                              size={10}
                              color="#FFD700"
                              style={{ marginLeft: 2 }}
                            />
                          )}
                        </View>
                        <Text
                          className="text-zinc-200 font-black italic w-24 text-right"
                          numberOfLines={1}
                        >
                          {set.muscle_group?.toLowerCase() === "cardio"
                            ? (set.time ?? "00:00:00")
                            : set.reps}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
              {selectedWorkout?.notes && (
                <View className="mt-4 p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-[35px]">
                  <Text className="text-zinc-500 text-[10px] font-black uppercase mb-2">
                    Notas do Treino
                  </Text>
                  <Text className="text-zinc-300 italic text-sm">{`"${selectedWorkout.notes}"`}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ANÁLISE DE VOLUME */}
      <Modal visible={isVolumeModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/90 justify-end">
          <View className="h-[75%] bg-[#080808] rounded-t-[50px] border-t border-zinc-800">
            <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mt-4" />

            <View className="flex-row items-center px-8 py-8">
              <TouchableOpacity
                onPress={() => setIsVolumeModalVisible(false)}
                className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
              >
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-black italic uppercase ml-5 tracking-tighter">
                Weekly Exercise Volume
              </Text>
            </View>

            <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
              {volumeByExercise.length > 0 ? (
                volumeByExercise.map((item, index) => (
                  <View
                    key={index}
                    className="mb-4 bg-zinc-900/30 p-5 rounded-[30px] border border-zinc-900 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-4">
                      <Text className="text-zinc-500 text-[8px] font-black uppercase mb-1 italic">
                        Rank #{index + 1}
                      </Text>
                      <Text
                        className="text-white font-bold uppercase italic text-sm"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#E31C25] font-black italic text-lg">
                        {Number(item.volume).toLocaleString()}{" "}
                        <Text className="text-[10px] text-zinc-600">
                          {weightUnit}
                        </Text>
                      </Text>
                      <View className="h-1 bg-zinc-900 w-24 rounded-full mt-2 overflow-hidden">
                        <View
                          style={{
                            width: `${totalVolume > 0 ? (item.volume / totalVolume) * 100 : 0}%`,
                          }}
                          className="h-full bg-[#E31C25]"
                        />
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center mt-20">
                  <Dumbbell size={40} color="#18181b" />
                  <Text className="text-zinc-700 italic font-bold uppercase mt-4">
                    No data this week
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
