import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronDown,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Target,
  Trophy,
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

const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press.png": require("../../../assets/exercises_images/barbell_decline_bench_press.png"),
};

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
    isActive,
    stopWorkout,
  } = useWorkout();

  const [activeRoutineName, setActiveRoutineName] = useState("Treino Avulso");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<any[]>([]);
  const [weightUnit, setWeightUnit] = useState("kg");
  const [activeRestTimers, setActiveRestTimers] = useState<
    Record<string, number>
  >({});
  const [typeModal, setTypeModal] = useState<{
    visible: boolean;
    exId: string;
    setId: string;
  } | null>(null);

  const stats = useMemo(() => {
    let totalSets = 0,
      totalVolume = 0;
    exercises.forEach((ex) =>
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalSets++;
          totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        }
      }),
    );
    return { totalSets, totalVolume };
  }, [exercises]);

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
            Vibration.vibrate(500);
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const initWorkout = useCallback(async () => {
    const routineId = Array.isArray(params.routineId)
      ? params.routineId[0]
      : params.routineId;
    if (!routineId) {
      if (exercises.length > 0 && !isActive) stopWorkout(false);
      setActiveRoutineName("Treino Avulso");
      setIsActive(true);
      return;
    }
    if (exercises.length > 0) return;

    try {
      const routineRes = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM routines WHERE id = ?",
        [Number(routineId)],
      );
      if (routineRes) setActiveRoutineName(routineRes.name);
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
            const historyRes = await db.getAllAsync<{
              weight: number;
              reps: number;
            }>(
              "SELECT weight, MAX(reps) as reps FROM workout_sets WHERE exercise_id = ? GROUP BY weight",
              [ex.id],
            );
            return {
              logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
              id: ex.id,
              name: ex.name,
              notes: "",
              rest_time: 0,
              personalRecords: historyRes || [],
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
        setIsActive(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [params.routineId, db, weightUnit]);

  useEffect(() => {
    db.getAllAsync<any>("SELECT * FROM exercises ORDER BY name ASC").then(
      setDbExercises,
    );
    initWorkout();
  }, [initWorkout]);

  const handleToggleSet = (exLogId: string, setId: string) => {
    const exercise = exercises.find((e) => e.logId === exLogId);
    if (
      exercise &&
      !exercise.sets.find((s) => s.id === setId)?.completed &&
      exercise.rest_time > 0
    ) {
      setActiveRestTimers((prev) => ({ ...prev, [setId]: exercise.rest_time }));
    }
    toggleSetCompleted(exLogId, setId);
  };

  const handleSetRestTime = (exLogId: string) => {
    Alert.prompt(
      "Rest Timer",
      "Segundos de descanso:",
      (val) => {
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

  const confirmSelection = async () => {
    if (tempSelected.length === 0) {
      setIsModalVisible(false);
      return;
    }
    const newExs = await Promise.all(
      tempSelected.map(async (ex) => {
        const prevRes = await db.getFirstAsync<any>(
          "SELECT weight, reps FROM workout_sets WHERE exercise_id = ? ORDER BY id DESC LIMIT 1",
          [ex.id],
        );
        const historyRes = await db.getAllAsync<{
          weight: number;
          reps: number;
        }>(
          "SELECT weight, MAX(reps) as reps FROM workout_sets WHERE exercise_id = ? GROUP BY weight",
          [ex.id],
        );
        return {
          logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
          id: ex.id,
          name: ex.name,
          notes: "",
          rest_time: 0,
          personalRecords: historyRes || [],
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
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

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
            onPress={() =>
              router.push({
                pathname: "/workout/save_workout",
                params: { routineName: activeRoutineName },
              })
            }
            className="bg-[#E31C25] px-5 py-2 rounded-full"
          >
            <Text className="text-white font-black uppercase italic text-xs">
              Finish
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between px-2 py-4 bg-black">
          {[
            { label: "Duration", value: timer, color: "#E31C25" },
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

              {ex.sets.map((set, idx) => {
                const isNewPR = ex.personalRecords.every(
                  (pr) =>
                    Number(set.weight) > pr.weight ||
                    (Number(set.weight) === pr.weight &&
                      Number(set.reps) > pr.reps),
                );
                return (
                  <View key={set.id} className="mb-2">
                    <View
                      className={`flex-row items-center h-14 px-2 rounded-2xl ${set.completed ? "bg-[#E31C25]/15 border border-[#E31C25]/30" : "bg-zinc-900/60 border border-zinc-800"}`}
                    >
                      <TouchableOpacity
                        className="w-10 h-10 items-center justify-center bg-zinc-800 rounded-xl relative"
                        onPress={() =>
                          setTypeModal({
                            visible: true,
                            exId: ex.logId,
                            setId: set.id,
                          })
                        }
                      >
                        {set.completed && isNewPR && Number(set.weight) > 0 && (
                          <View className="absolute -top-1 -left-1 z-10 bg-amber-500 rounded-full p-1 border border-black shadow-sm">
                            <Trophy size={8} color="black" />
                          </View>
                        )}
                        <Text className="text-white font-black italic">
                          {set.type === "1" ? idx + 1 : set.type}
                        </Text>
                      </TouchableOpacity>
                      <Text className="flex-1 text-zinc-500 text-center text-xs font-black italic">
                        {set.previous}
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "weight", v)
                        }
                        className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black italic"
                        placeholder="0"
                      />
                      <TextInput
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "reps", v)
                        }
                        className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black italic"
                        placeholder="0"
                      />
                      <TouchableOpacity
                        onPress={() => handleToggleSet(ex.logId, set.id)}
                        className={`w-9 h-9 rounded-xl items-center justify-center ml-2 ${set.completed ? "bg-[#E31C25]" : "bg-zinc-800"}`}
                      >
                        <Check size={20} color="white" strokeWidth={5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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

          {/* BOTAO ADD EXERCISE - PEQUENO E CENTRALIZADO */}
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="mt-8 mb-24 bg-[#E31C25] py-3 px-8 self-center rounded-full flex-row items-center border border-zinc-800 shadow-lg"
          >
            <Plus size={18} color="white" strokeWidth={4} />
            <Text className="text-white font-black text-sm ml-2 uppercase italic">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>

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
                <Text className="text-white text-2xl font-black italic uppercase tracking-tighter">
                  Library
                </Text>
                <TouchableOpacity onPress={confirmSelection}>
                  <Text className="text-[#E31C25] text-xl font-black uppercase italic">
                    Add{" "}
                    {tempSelected.length > 0 ? `(${tempSelected.length})` : ""}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-zinc-900 rounded-2xl h-14 px-5 mb-6 border border-zinc-800">
                <Search color="#52525b" size={24} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
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
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const imageKey = item.image?.trim();
                  const isCustomImage =
                    imageKey?.startsWith("file://") ||
                    imageKey?.startsWith("http");
                  const imageSource = isCustomImage
                    ? { uri: imageKey }
                    : imageKey
                      ? IMAGE_MAP[imageKey]
                      : null;
                  const isSelected = tempSelected.some((e) => e.id === item.id);

                  return (
                    <View className="flex-row items-center py-4 border-b border-zinc-900">
                      {/* ESQUERDA: Texto e Imagem abre Detalhes e fecha Modal */}
                      <TouchableOpacity
                        className="flex-1 flex-row items-center"
                        onPress={() => {
                          setIsModalVisible(false);
                          router.push({
                            pathname: "/workout/[id]",
                            params: { id: item.id, from: "workout" },
                          });
                        }}
                      >
                        <View className="w-14 h-14 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
                          {imageSource ? (
                            <Image
                              source={imageSource}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : (
                            <Target size={24} color="#E31C25" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-[16px] font-black uppercase italic tracking-tighter">
                            {item.name}
                          </Text>
                          <Text className="text-zinc-600 text-[10px] font-black mt-1 uppercase tracking-widest">
                            {item.muscle_group}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* DIREITA: Bola apenas seleciona */}
                      <TouchableOpacity
                        onPress={() => {
                          if (isSelected) {
                            setTempSelected(
                              tempSelected.filter((e) => e.id !== item.id),
                            );
                          } else {
                            setTempSelected([...tempSelected, item]);
                          }
                        }}
                        className="w-12 h-12 items-center justify-center"
                      >
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center border-2 ${
                            isSelected
                              ? "bg-[#E31C25] border-[#E31C25]"
                              : "border-zinc-800"
                          }`}
                        >
                          {isSelected && (
                            <Check color="white" size={14} strokeWidth={4} />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          </SafeAreaView>
        </Modal>

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
                    <Text className={`${i.c} font-black text-2xl italic`}>
                      {i.v === "1" ? "1" : i.v}
                    </Text>
                    <Text
                      className={`${i.c} text-[8px] font-black uppercase mt-1 italic`}
                    >
                      {i.l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
