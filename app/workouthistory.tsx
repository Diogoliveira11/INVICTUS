import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  ChevronLeft,
  Clock,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "./(tabs)/context/units_context";

type WorkoutEntry = {
  id: number;
  title: string;
  date: string;
  duration: string;
  total_volume: number;
  notes: string;
  photo: string | null;
};

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

interface ExerciseHistory {
  workout_title: string;
  date: string;
  sets: WorkoutExercise[];
}

export default function WorkoutHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { weightUnit } = useUnits();
  const weightUnitLower = weightUnit.toLowerCase();

  const [history, setHistory] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutEntry | null>(
    null,
  );
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );

  // Exercise detail modal state
  const [isExerciseDetailVisible, setIsExerciseDetailVisible] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);
  const [loadingExerciseHistory, setLoadingExerciseHistory] = useState(false);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const rows = await db.getAllAsync<WorkoutEntry>(
        `SELECT id, title, date, duration, total_volume, notes, photo
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

  const loadWorkoutDetails = async (workout: WorkoutEntry) => {
    try {
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
        JOIN workout_exercises we ON ws.workout_exercise_id = we.id
        JOIN exercises e ON ws.exercise_id = e.id
        WHERE we.workout_id = ?
        ORDER BY we.index_order ASC, ws.index_order ASC`,
        [workout.id],
      );

      setSelectedWorkout(workout);
      setWorkoutExercises(details || []);
      setIsDetailsVisible(true);
    } catch (e) {
      console.error("[loadWorkoutDetails] erro:", e);
      Alert.alert("Erro", "Não foi possível carregar os detalhes.");
    }
  };

  const loadExerciseHistory = async (exerciseName: string) => {
    setLoadingExerciseHistory(true);
    setSelectedExerciseName(exerciseName);
    setIsExerciseDetailVisible(true);

    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      // Fetch all sets for this exercise across all workouts
      const rows = await db.getAllAsync<
        WorkoutExercise & { workout_title: string; workout_date: string }
      >(
        `SELECT 
          w.title as workout_title,
          w.date as workout_date,
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
        JOIN workout_exercises we ON ws.workout_exercise_id = we.id
        JOIN exercises e ON ws.exercise_id = e.id
        JOIN workouts w ON we.workout_id = w.id
        WHERE e.name = ?
          AND w.user_id = (SELECT id FROM users WHERE email = ?)
        ORDER BY w.date DESC, ws.index_order ASC`,
        [exerciseName, email],
      );

      // Group by workout
      const grouped: Record<string, ExerciseHistory> = {};
      rows.forEach((row) => {
        const key = `${row.workout_date}_${row.workout_title}`;
        if (!grouped[key]) {
          grouped[key] = {
            workout_title: row.workout_title,
            date: row.workout_date,
            sets: [],
          };
        }
        grouped[key].sets.push(row);
      });

      setExerciseHistory(Object.values(grouped));
    } catch (e) {
      console.error("[loadExerciseHistory] erro:", e);
      Alert.alert(
        "Erro",
        "Não foi possível carregar o histórico do exercício.",
      );
    } finally {
      setLoadingExerciseHistory(false);
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

    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "YESTERDAY";
    return workoutDate
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const getSetTypeStyle = (set_type: string) => {
    switch (set_type) {
      case "W":
        return {
          label: "WARMUP",
          bg: "bg-amber-500/10",
          text: "text-amber-500",
        };
      case "D":
        return {
          label: "DROP SET",
          bg: "bg-purple-500/10",
          text: "text-purple-500",
        };
      case "F":
        return { label: "FAILURE", bg: "bg-red-500/10", text: "text-red-500" };
      default:
        return { label: "NORMAL", bg: "bg-zinc-800", text: "text-zinc-400" };
    }
  };

  const isCardio = (muscle_group: string) =>
    muscle_group?.toLowerCase() === "cardio";

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
              <TouchableOpacity
                key={item.id}
                onPress={() => loadWorkoutDetails(item)}
                activeOpacity={0.7}
                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[30px] mb-4 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="text-[#E31C25] font-bold uppercase text-xs tracking-widest mb-1">
                    {formatDate(item.date)}
                  </Text>
                  <Text className="text-white text-xl font-black">
                    {item.title}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-3">
                    <Clock color="#71717a" size={14} />
                    <Text className="text-zinc-400 font-medium text-sm">
                      {item.duration} • {item.total_volume}
                      {weightUnitLower}
                    </Text>
                  </View>
                </View>
                <ChevronLeft
                  size={20}
                  color="#E31C25"
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL: DETALHES DO TREINO */}
      <Modal visible={isDetailsVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/95 justify-end">
          <View className="h-[92%] bg-[#050505] rounded-t-[50px] border-t border-[#E31C25]/40">
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mt-4" />
            <View className="px-8 pt-8 pb-6">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setIsDetailsVisible(false)}
                  className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
                >
                  <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <View className="items-end">
                  <Text className="text-white text-2xl font-black tracking-tighter">
                    {selectedWorkout?.title || "Workout"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#E31C25" />
                    <Text className="text-[#E31C25] text-xs font-black uppercase ml-1">
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
                  <Text className="text-white font-black">
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
                    Date
                  </Text>
                  <Text className="text-white font-black">
                    {selectedWorkout
                      ? new Date(selectedWorkout.date).toLocaleDateString(
                          "en-US",
                        )
                      : "--"}
                  </Text>
                </View>
              </View>

              {selectedWorkout?.photo && (
                <View className="mt-4 rounded-3xl overflow-hidden border border-zinc-800">
                  <Image
                    source={{ uri: selectedWorkout.photo }}
                    style={{ width: "100%", height: 200 }}
                    resizeMode="cover"
                  />
                </View>
              )}
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
                <TouchableOpacity
                  key={idx}
                  onPress={() => loadExerciseHistory(group.name)}
                  activeOpacity={0.75}
                  className="mb-6 bg-zinc-900/20 rounded-[40px] p-6 border border-zinc-900"
                >
                  {/* Exercise header with history button */}
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[#E31C25] text-lg font-black uppercase tracking-tighter flex-1 mr-2">
                      {group.name}
                    </Text>
                    <View className="flex-row items-center gap-1 bg-[#E31C25]/10 border border-[#E31C25]/20 px-3 py-1.5 rounded-xl">
                      <TrendingUp size={10} color="#E31C25" />
                      <Text className="text-[#E31C25] text-[9px] font-black uppercase ml-1">
                        Histórico
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row mb-3 px-2">
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-8">
                      Set
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase flex-1 text-center">
                      Type
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-20 text-center">
                      {isCardio(group.sets[0]?.muscle_group)
                        ? "Dist."
                        : "Weight"}
                    </Text>
                    <Text className="text-zinc-600 text-[8px] font-black uppercase w-24 text-right">
                      {isCardio(group.sets[0]?.muscle_group) ? "Time" : "Reps"}
                    </Text>
                  </View>

                  {group.sets.map((set, sIdx) => {
                    const { label, bg, text } = getSetTypeStyle(set.set_type);
                    return (
                      <View
                        key={sIdx}
                        className="flex-row items-center py-3 border-b border-zinc-800/30 px-2"
                      >
                        <Text className="text-zinc-500 font-black w-8">
                          {sIdx + 1}
                        </Text>
                        <View className="flex-1 items-center">
                          <View className={`px-2 py-0.5 rounded-md ${bg}`}>
                            <Text className={`text-[8px] font-black ${text}`}>
                              {label}
                            </Text>
                          </View>
                        </View>
                        <View className="w-20 flex-row items-center justify-center">
                          <Text
                            className="text-white font-black text-center"
                            numberOfLines={1}
                          >
                            {isCardio(set.muscle_group)
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
                          className="text-zinc-200 font-black w-24 text-right"
                          numberOfLines={1}
                        >
                          {isCardio(set.muscle_group)
                            ? (set.time ?? "00:00:00")
                            : set.reps}
                        </Text>
                      </View>
                    );
                  })}
                </TouchableOpacity>
              ))}

              {selectedWorkout?.notes && (
                <View className="mt-4 p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-[35px]">
                  <Text className="text-zinc-500 text-[10px] font-black uppercase mb-2">
                    Workout Notes
                  </Text>
                  <Text className="text-zinc-300 text-sm">{`"${selectedWorkout.notes}"`}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: HISTÓRICO DO EXERCÍCIO */}
      <Modal
        visible={isExerciseDetailVisible}
        animationType="slide"
        transparent
      >
        <View className="flex-1 bg-black/95 justify-end">
          <View className="h-[85%] bg-[#050505] rounded-t-[50px] border-t border-[#E31C25]/40">
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mt-4" />

            {/* Header */}
            <View className="px-8 pt-8 pb-6">
              <View className="flex-row items-center justify-between mb-2">
                <TouchableOpacity
                  onPress={() => setIsExerciseDetailVisible(false)}
                  className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
                <View className="flex-1 ml-4">
                  <Text className="text-[#E31C25] text-[9px] font-black uppercase tracking-widest mb-1">
                    Histórico do Exercício
                  </Text>
                  <Text
                    className="text-white text-xl font-black tracking-tighter"
                    numberOfLines={2}
                  >
                    {selectedExerciseName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Content */}
            {loadingExerciseHistory ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#E31C25" size="large" />
              </View>
            ) : (
              <ScrollView
                className="px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
              >
                {exerciseHistory.length === 0 ? (
                  <View className="items-center mt-10">
                    <TrendingUp size={40} color="#27272a" />
                    <Text className="text-zinc-600 font-black uppercase text-sm mt-4 text-center">
                      Sem histórico para este exercício
                    </Text>
                  </View>
                ) : (
                  exerciseHistory.map((entry, eIdx) => (
                    <View
                      key={eIdx}
                      className="mb-5 bg-zinc-900/20 rounded-[32px] p-5 border border-zinc-900"
                    >
                      {/* Workout info */}
                      <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                          <Text className="text-[#E31C25] text-[9px] font-black uppercase tracking-widest mb-0.5">
                            {formatDate(entry.date)}
                          </Text>
                          <Text className="text-white font-black text-base">
                            {entry.workout_title}
                          </Text>
                        </View>
                        {/* Best set badge */}
                        {(() => {
                          const best = entry.sets.reduce((prev, curr) =>
                            (curr.weight ?? 0) > (prev.weight ?? 0)
                              ? curr
                              : prev,
                          );
                          if (!isCardio(best.muscle_group) && best.weight) {
                            return (
                              <View className="bg-zinc-800/60 rounded-2xl px-3 py-2 items-center border border-zinc-700/40">
                                <Text className="text-zinc-500 text-[7px] font-black uppercase">
                                  Melhor Set
                                </Text>
                                <Text className="text-white text-xs font-black">
                                  {best.weight}
                                  {weightUnitLower} × {best.reps}
                                </Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
                      </View>

                      {/* Sets table header */}
                      <View className="flex-row mb-2 px-2">
                        <Text className="text-zinc-600 text-[8px] font-black uppercase w-8">
                          Set
                        </Text>
                        <Text className="text-zinc-600 text-[8px] font-black uppercase flex-1 text-center">
                          Type
                        </Text>
                        <Text className="text-zinc-600 text-[8px] font-black uppercase w-20 text-center">
                          {isCardio(entry.sets[0]?.muscle_group)
                            ? "Dist."
                            : "Weight"}
                        </Text>
                        <Text className="text-zinc-600 text-[8px] font-black uppercase w-20 text-right">
                          {isCardio(entry.sets[0]?.muscle_group)
                            ? "Time"
                            : "Reps"}
                        </Text>
                      </View>

                      {/* Sets rows */}
                      {entry.sets.map((set, sIdx) => {
                        const { label, bg, text } = getSetTypeStyle(
                          set.set_type,
                        );
                        return (
                          <View
                            key={sIdx}
                            className="flex-row items-center py-2.5 border-b border-zinc-800/30 px-2"
                          >
                            <Text className="text-zinc-500 font-black w-8 text-sm">
                              {sIdx + 1}
                            </Text>
                            <View className="flex-1 items-center">
                              <View className={`px-2 py-0.5 rounded-md ${bg}`}>
                                <Text
                                  className={`text-[8px] font-black ${text}`}
                                >
                                  {label}
                                </Text>
                              </View>
                            </View>
                            <View className="w-20 flex-row items-center justify-center">
                              <Text
                                className="text-white font-black text-center text-sm"
                                numberOfLines={1}
                              >
                                {isCardio(set.muscle_group)
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
                              className="text-zinc-200 font-black w-20 text-right text-sm"
                              numberOfLines={1}
                            >
                              {isCardio(set.muscle_group)
                                ? (set.time ?? "00:00:00")
                                : set.reps}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
