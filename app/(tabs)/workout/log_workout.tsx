import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronDown,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SetType, useWorkout } from "../context/workoutcontext";

export default function LogWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const db = useSQLiteContext();

  const {
    timer,
    exercises,
    setExercises,
    updateSet,
    toggleSetCompleted,
    setIsMinimized,
    setLastExercise,
    setIsActive,
  } = useWorkout();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<any[]>([]);
  const [weightUnit, setWeightUnit] = useState("kg");
  const [typeModal, setTypeModal] = useState<{
    visible: boolean;
    exId: string;
    setId: string;
  } | null>(null);

  // MUDANÇA: O estado agora guarda o ID da SÉRIE (setId) em vez do logId do exercício
  const [activeRestTimers, setActiveRestTimers] = useState<
    Record<string, number>
  >({});

  const stats = useMemo(() => {
    let totalSets = 0;
    let totalVolume = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalSets++;
          totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        }
      });
    });
    return { totalSets, totalVolume };
  }, [exercises]);

  // Intervalo para atualizar os tempos regressivos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRestTimers((prev) => {
        const next = { ...prev };
        let changed = false;

        Object.keys(next).forEach((key) => {
          if (next[key] > 1) {
            next[key] -= 1;
            changed = true;
          } else if (next[key] === 1) {
            // Vibra apenas uma vez quando falta 1 segundo para acabar
            Vibration.vibrate(500);
            delete next[key];
            changed = true;
          } else {
            delete next[key];
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSet = (exLogId: string, setId: string) => {
    const exercise = exercises.find((e) => e.logId === exLogId);
    if (!exercise) return;
    const set = exercise.sets.find((s) => s.id === setId);
    if (!set) return;

    if (!set.completed) {
      if (exercise.rest_time > 0) {
        // MUDANÇA: Usamos o setId como chave para o timer ser único por série
        setActiveRestTimers((prev) => ({
          ...prev,
          [setId]: exercise.rest_time,
        }));
      }
    } else {
      setActiveRestTimers((prev) => {
        const next = { ...prev };
        delete next[setId];
        return next;
      });
    }
    toggleSetCompleted(exLogId, setId);
  };

  const handleSetRestTime = (exLogId: string) => {
    Alert.prompt(
      "Rest Timer",
      "Segundos de descanso para este exercício:",
      (val: string | undefined) => {
        const seconds = parseInt(val || "0");
        setExercises((prev) =>
          prev.map((e) =>
            e.logId === exLogId ? { ...e, rest_time: seconds } : e,
          ),
        );
      },
      "plain-text",
      "60",
    );
  };

  // ... (initWorkout, loadUserSettings e confirmSelection mantêm-se iguais)
  const loadUserSettings = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (user) {
        const settings = await db.getFirstAsync<{ weight_unit: string }>(
          "SELECT weight_unit FROM user_settings WHERE user_id = ?",
          [user.id],
        );
        if (settings) setWeightUnit(settings.weight_unit);
      }
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  const initWorkout = useCallback(async () => {
    const routineId = Array.isArray(params.routineId)
      ? params.routineId[0]
      : params.routineId;
    if (!routineId || exercises.length > 0) return;
    try {
      const routineExs = await db.getAllAsync<any>(
        `SELECT e.* FROM exercises e JOIN routine_exercises re ON e.id = re.exercise_id WHERE re.routine_id = ? ORDER BY re.index_order ASC`,
        [routineId],
      );
      if (routineExs && routineExs.length > 0) {
        const prepared = await Promise.all(
          routineExs.map(async (ex) => {
            const prevRes = await db.getFirstAsync<any>(
              "SELECT weight, reps FROM workout_sets WHERE exercise_id = ? ORDER BY id DESC LIMIT 1",
              [ex.id],
            );
            return {
              logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
              id: ex.id,
              name: ex.name,
              notes: "",
              rest_time: 0,
              sets: [
                {
                  id: Math.random().toString(),
                  type: "1" as SetType,
                  weight: "",
                  reps: "",
                  completed: false,
                  previous: prevRes
                    ? `${prevRes.weight}${weightUnit} x ${prevRes.reps}`
                    : "-",
                },
              ],
            };
          }),
        );
        setExercises(prepared);
        setLastExercise(prepared[0]?.name || "Rotina");
        setIsActive(true);
      }
    } catch (error) {
      console.error(error);
    }
  }, [params.routineId, db, weightUnit]);

  useEffect(() => {
    loadUserSettings();
    db.getAllAsync<any>("SELECT * FROM exercises ORDER BY name ASC").then(
      setDbExercises,
    );
    initWorkout();
  }, [initWorkout, loadUserSettings]);

  const confirmSelection = async () => {
    if (tempSelected.length === 0) {
      setIsModalVisible(false);
      return;
    }
    try {
      const newExs = await Promise.all(
        tempSelected.map(async (ex) => {
          const prevRes = await db.getFirstAsync<any>(
            "SELECT weight, reps FROM workout_sets WHERE exercise_id = ? ORDER BY id DESC LIMIT 1",
            [ex.id],
          );
          return {
            logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
            id: ex.id,
            name: ex.name,
            notes: "",
            rest_time: 0,
            sets: [
              {
                id: Math.random().toString(),
                type: "1" as SetType,
                weight: "",
                reps: "",
                completed: false,
                previous: prevRes
                  ? `${prevRes.weight}${weightUnit} x ${prevRes.reps}`
                  : "-",
              },
            ],
          };
        }),
      );
      setExercises([...exercises, ...newExs]);
      setTempSelected([]);
      setIsModalVisible(false);
      setSearch("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* HEADER */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-black border-b border-zinc-900">
          <TouchableOpacity
            onPress={() => {
              setIsMinimized(true);
              router.back();
            }}
          >
            <ChevronDown size={30} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black uppercase italic tracking-tighter text-lg">
            Log Workout
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/workout/save_workout")}
            className="bg-[#E31C25] px-5 py-2 rounded-full"
          >
            <Text className="text-white font-black uppercase italic text-xs">
              Finish
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS CARDS */}
        <View className="flex-row justify-between px-2 py-4 bg-black">
          {[
            { label: "Duration", value: timer, color: "#E31C25" }, // <--- Usa o 'timer' sem filtros
            {
              label: "Volume",
              value: `${stats.totalVolume}${weightUnit}`,
              color: "white",
            },
            { label: "Sets", value: stats.totalSets, color: "white" },
          ].map((item) => (
            <View
              key={item.label}
              className="bg-zinc-900/80 w-[32%] rounded-xl py-4 items-center justify-center border border-zinc-800"
            >
              <Text className="text-zinc-500 text-[10px] uppercase font-black mb-1 italic tracking-widest">
                {item.label}
              </Text>
              <Text
                className="font-black text-lg italic tracking-tighter"
                style={{ color: item.color }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
        <ScrollView
          className="bg-black"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {exercises.map((ex) => (
            <View
              key={ex.logId}
              className="mt-4 bg-zinc-900/30 rounded-[25px] p-5 mx-2 border border-zinc-900"
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-[#E31C25] text-2xl font-black italic uppercase tracking-tighter flex-1">
                  {ex.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Options", ex.name, [
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () =>
                          setExercises(
                            exercises.filter((e) => e.logId !== ex.logId),
                          ),
                      },
                      { text: "Cancel" },
                    ])
                  }
                >
                  <MoreVertical size={24} color="#3f3f46" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Add notes..."
                placeholderTextColor="#3f3f46"
                value={ex.notes}
                onChangeText={(text) =>
                  setExercises(
                    exercises.map((e) =>
                      e.logId === ex.logId ? { ...e, notes: text } : e,
                    ),
                  )
                }
                className="text-zinc-400 text-sm mb-3 italic font-bold border-b border-zinc-800/50 pb-1"
              />

              <TouchableOpacity
                onPress={() => handleSetRestTime(ex.logId)}
                className="flex-row items-center mb-5 bg-[#E31C25]/10 self-start px-4 py-1.5 rounded-xl border border-[#E31C25]/20"
              >
                <Clock size={14} color="#E31C25" />
                <Text className="text-[#E31C25] text-[10px] font-black uppercase italic ml-2">
                  Rest Timer: {ex.rest_time > 0 ? `${ex.rest_time}s` : "OFF"}
                </Text>
              </TouchableOpacity>

              {/* TITULOS TABELA */}
              <View className="flex-row items-center px-1 mb-3">
                <Text className="text-zinc-700 text-[10px] font-black uppercase w-10 text-center italic">
                  Set
                </Text>
                <Text className="text-zinc-700 text-[10px] font-black uppercase flex-1 text-center italic">
                  Previous
                </Text>
                <Text className="text-zinc-700 text-[10px] font-black uppercase w-16 text-center italic">
                  {weightUnit.toUpperCase()}
                </Text>
                <Text className="text-zinc-700 text-[10px] font-black uppercase w-16 text-center italic">
                  Reps
                </Text>
                <View className="w-12" />
              </View>

              {ex.sets.map((set, idx) => (
                <View key={set.id} className="mb-2">
                  <View
                    className={`flex-row items-center h-14 px-2 rounded-2xl ${set.completed ? "bg-[#E31C25]/15 border border-[#E31C25]/30" : "bg-zinc-900/60 border border-zinc-800"}`}
                  >
                    <TouchableOpacity
                      className="w-10 h-10 items-center justify-center bg-zinc-800 rounded-xl"
                      onPress={() =>
                        setTypeModal({
                          visible: true,
                          exId: ex.logId,
                          setId: set.id,
                        })
                      }
                    >
                      <Text
                        className={`font-black text-lg italic ${set.type === "W" ? "text-amber-500" : set.type === "D" ? "text-purple-500" : set.type === "F" ? "text-[#E31C25]" : "text-white"}`}
                      >
                        {set.type === "1" ? idx + 1 : set.type}
                      </Text>
                    </TouchableOpacity>
                    <Text className="flex-1 text-zinc-500 text-center text-xs font-black italic">
                      {set.previous}
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "weight", v)
                        }
                        className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black text-base italic"
                        placeholder="0"
                      />
                      <TextInput
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "reps", v)
                        }
                        className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black text-base italic"
                        placeholder="0"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleToggleSet(ex.logId, set.id)}
                      className={`w-9 h-9 rounded-xl items-center justify-center ml-2 ${set.completed ? "bg-[#E31C25]" : "bg-zinc-800"}`}
                    >
                      <Check size={20} color="white" strokeWidth={5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setExercises((prev) =>
                          prev.map((e) =>
                            e.logId === ex.logId
                              ? {
                                  ...e,
                                  sets: e.sets.filter((s) => s.id !== set.id),
                                }
                              : e,
                          ),
                        )
                      }
                      className="ml-1.5"
                    >
                      <Trash2 size={16} color="#27272a" />
                    </TouchableOpacity>
                  </View>

                  {/* MUDANÇA: O timer agora verifica o setId específico */}
                  {set.completed &&
                    activeRestTimers[set.id] !== undefined &&
                    activeRestTimers[set.id] > 0 && (
                      <View className="flex-row items-center justify-center py-2 bg-amber-500/10 rounded-xl mt-1 border border-amber-500/20 mx-2">
                        <Clock size={12} color="#f59e0b" />
                        <Text className="text-amber-500 font-black text-[10px] ml-2 uppercase italic tracking-widest">
                          Resting: {activeRestTimers[set.id]}s
                        </Text>
                      </View>
                    )}
                </View>
              ))}

              <TouchableOpacity
                onPress={() =>
                  setExercises(
                    exercises.map((e) =>
                      e.logId === ex.logId
                        ? {
                            ...e,
                            sets: [
                              ...e.sets,
                              {
                                id: Math.random().toString(),
                                type: "1" as SetType,
                                weight: "",
                                reps: "",
                                completed: false,
                                previous: "-",
                              },
                            ],
                          }
                        : e,
                    ),
                  )
                }
                className="mt-3 py-4 bg-zinc-900/40 rounded-2xl items-center border border-dashed border-zinc-800"
              >
                <Text className="text-zinc-500 font-black text-[10px] uppercase italic tracking-widest">
                  + Add Set
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="mt-10 mb-24 bg-zinc-900 py-6 mx-3 rounded-[30px] items-center flex-row justify-center border border-zinc-800"
          >
            <Plus size={24} color="#E31C25" strokeWidth={4} />
            <Text className="text-white font-black text-xl ml-3 uppercase italic tracking-tighter">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {/* ... (Modals mantêm-se iguais) */}
        <Modal visible={!!typeModal} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-black/90 justify-end"
            onPress={() => setTypeModal(null)}
          >
            <View className="bg-[#0a0a0a] p-10 rounded-t-[40px] border-t border-zinc-800">
              <Text className="text-white text-center font-black uppercase italic mb-8 tracking-widest text-sm">
                Set Type
              </Text>
              <View className="flex-row justify-between mb-10">
                {[
                  { l: "Normal", v: "1", c: "text-white" },
                  { l: "Warmup", v: "W", c: "text-amber-500" },
                  { l: "Drop", v: "D", c: "text-purple-500" },
                  { l: "Fail", v: "F", c: "text-[#E31C25]" },
                ].map((i) => (
                  <TouchableOpacity
                    key={i.v}
                    onPress={() => {
                      if (typeModal)
                        updateSet(
                          typeModal.exId,
                          typeModal.setId,
                          "type",
                          i.v as SetType,
                        );
                      setTypeModal(null);
                    }}
                    className="bg-zinc-900 w-[22%] aspect-square rounded-[25px] items-center justify-center border border-zinc-800 shadow-md"
                  >
                    <Text
                      className={`${i.c} font-black text-3xl italic tracking-tighter`}
                    >
                      {i.v === "1" ? "1" : i.v}
                    </Text>
                    <Text
                      className={`${i.c} text-[9px] font-black uppercase mt-1 italic tracking-widest`}
                    >
                      {i.l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 px-6 pt-6">
              <View className="flex-row items-center justify-between mb-8">
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <X color="white" size={30} />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-black uppercase italic tracking-tighter">
                  Library
                </Text>
                <TouchableOpacity onPress={confirmSelection}>
                  <Text className="text-[#E31C25] text-xl font-black uppercase italic">
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center bg-zinc-900 rounded-2xl h-14 px-5 mb-6 border border-zinc-800">
                <Search color="#52525b" size={24} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search exercises..."
                  placeholderTextColor="#52525b"
                  className="flex-1 text-white font-black italic text-lg"
                />
              </View>
              <FlatList
                data={dbExercises.filter(
                  (ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase()) &&
                    !exercises.some((ae) => ae.id === ex.id),
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() =>
                      tempSelected.some((e) => e.id === item.id)
                        ? setTempSelected(
                            tempSelected.filter((e) => e.id !== item.id),
                          )
                        : setTempSelected([...tempSelected, item])
                    }
                    className="flex-row items-center py-5 border-b border-zinc-900"
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-lg font-black uppercase italic tracking-tighter ${tempSelected.some((e) => e.id === item.id) ? "text-[#E31C25]" : "text-white"}`}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-zinc-600 text-xs font-black mt-1 uppercase tracking-widest">
                        {item.muscle_group} • {item.equipment}
                      </Text>
                    </View>
                    {tempSelected.some((e) => e.id === item.id) ? (
                      <Check color="#E31C25" size={28} strokeWidth={4} />
                    ) : (
                      <Plus color="#27272a" size={28} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
