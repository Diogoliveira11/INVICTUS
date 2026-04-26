import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { Image } from "expo-image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Target,
  Trash2,
  Trophy,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  TouchableWithoutFeedback,
  View
} from "react-native";
import { IMAGE_MAP } from "../../../constants/exercise_images";
import { ActiveExercise, SetType, useWorkout } from "../context/workoutcontext";

// @ts-ignore
import InvictusLogo from "../../../assets/images/logo_invictus.jpeg";

const isNewRecord = (
  currentW: string,
  currentR: string,
  prWeight: number,
  prReps: number,
) => {
  const w = parseFloat(currentW) || 0;
  const r = parseInt(currentR) || 0;

  if (w === 0 || r === 0) return false;

  const currentVolume = w * r;
  const bestVolume = prWeight * prReps;

  return currentVolume > bestVolume;
};

export default function LogWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const db = useSQLiteContext();

  const {
    timer,
    restTimer,
    activeRestSetId,
    exercises,
    setExercises,
    updateSet,
    toggleSetCompleted,
    setIsMinimized,
    setIsActive,
    isActive,
    stopWorkout,
    startWorkout,
  } = useWorkout();

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  const [activeRoutineName, setActiveRoutineName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<any[]>([]);
  const [weightUnit] = useState("kg");

  const [typeModal, setTypeModal] = useState<{
    visible: boolean;
    exId: string;
    setId: string;
  } | null>(null);

  const [restModal, setRestModal] = useState<{
    visible: boolean;
    exLogId: string;
    value: string;
  }>({
    visible: false,
    exLogId: "",
    value: "60",
  });

  const [removeExerciseModal, setRemoveExerciseModal] = useState<{
    visible: boolean;
    logId: string;
    name: string;
  }>({
    visible: false,
    logId: "",
    name: "",
  });

  useFocusEffect(
    useCallback(() => {
      setIsMinimized(false);
      return () => {
        setIsMinimized(true);
      };
    }, [setIsMinimized]),
  );

  const fetchLibraryExercises = useCallback(async () => {
    try {
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      let params: any[] = [];

      if (search.trim()) {
        query += " AND name LIKE ? COLLATE NOCASE";
        params.push(`%${search.trim()}%`);
      }
      if (selectedMuscle) {
        query += " AND muscle_group = ?";
        params.push(selectedMuscle);
      }
      if (selectedEquipment) {
        query += " AND equipment = ?";
        params.push(selectedEquipment);
      }

      query += " ORDER BY name ASC";
      const rows = await db.getAllAsync<any>(query, params);
      setDbExercises(rows);

      if (muscleOptions.length === 0) {
        const muscles = await db.getAllAsync<{ muscle_group: string }>(
          "SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group ASC",
        );
        setMuscleOptions(muscles.map((m) => m.muscle_group));
        const equipment = await db.getAllAsync<{ equipment: string }>(
          "SELECT DISTINCT equipment FROM exercises ORDER BY equipment ASC",
        );
        setEquipmentOptions(equipment.map((e) => e.equipment));
      }
    } catch (error) {
      console.error("Erro ao carregar biblioteca:", error);
    }
  }, [search, selectedMuscle, selectedEquipment, db, muscleOptions.length]);

  useEffect(() => {
    if (isModalVisible) fetchLibraryExercises();
  }, [isModalVisible, fetchLibraryExercises]);

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

  const initWorkout = useCallback(async () => {
    const routineId = Array.isArray(params.routineId)
      ? params.routineId[0]
      : params.routineId;
    const shouldReset = params.reset === "true";

    if (shouldReset) {
      router.setParams({ reset: undefined });
      startWorkout("");
      setActiveRoutineName("");
      return;
    }

    if (!routineId) {
      if (!isActive) {
        startWorkout("");
        setActiveRoutineName("");
      }
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

            const prRes = await db.getFirstAsync<any>(
              "SELECT weight, reps FROM workout_sets WHERE exercise_id = ? ORDER BY (weight * reps) DESC LIMIT 1",
              [ex.id],
            );

            return {
              logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
              id: ex.id,
              name: ex.name,
              muscle_group: ex.muscle_group, // Adicionado para verificação de Cardio
              image_url: ex.image,
              notes: "",
              rest_time: 0,
              personalRecords: prRes
                ? [{ weight: prRes.weight, reps: prRes.reps }]
                : [],
              sets: [
                {
                  id: Math.random().toString(),
                  type: "1" as SetType,
                  weight: "",
                  reps: "",
                  suggestedWeight: prevRes ? String(prevRes.weight) : "0",
                  suggestedReps: prevRes ? String(prevRes.reps) : "0",
                  completed: false,
                  previous: prevRes
                    ? `${prevRes.weight}${weightUnit} x ${prevRes.reps}`
                    : "-",
                },
              ],
            };
          }),
        );
        setExercises(prepared as ActiveExercise[]);
        setIsActive(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [
    params.routineId,
    params.reset,
    db,
    weightUnit,
    exercises.length,
    isActive,
    startWorkout,
  ]);

  useEffect(() => {
    db.getAllAsync<any>("SELECT * FROM exercises ORDER BY name ASC").then(
      setDbExercises,
    );
    initWorkout();
  }, [initWorkout]);

  const handleToggleSet = (exLogId: string, setId: string) => {
    const exercise = exercises.find((e) => e.logId === exLogId);
    if (!exercise) return;
    const currentSet = exercise.sets.find((s) => s.id === setId);
    if (!currentSet) return;

    const isMarkingComplete = !currentSet.completed;

    if (isMarkingComplete) {
      if (
        currentSet.weight === "" &&
        currentSet.suggestedWeight &&
        currentSet.suggestedWeight !== "0"
      )
        updateSet(exLogId, setId, "weight", currentSet.suggestedWeight);
      if (
        currentSet.reps === "" &&
        currentSet.suggestedReps &&
        currentSet.suggestedReps !== "0"
      )
        updateSet(exLogId, setId, "reps", currentSet.suggestedReps);
    }
    toggleSetCompleted(exLogId, setId);
  };

  const handleSetRestTime = (exLogId: string) => {
    const currentEx = exercises.find((e) => e.logId === exLogId);
    setRestModal({
      visible: true,
      exLogId,
      value: String(currentEx?.rest_time || "60"),
    });
  };

  const confirmSelection = async () => {
    if (tempSelected.length === 0) {
      setIsModalVisible(false);
      return;
    }
    const newExs = await Promise.all(
      tempSelected.map(async (ex) => {
        return {
          logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
          id: ex.id,
          name: ex.name,
          muscle_group: ex.muscle_group, // Adicionado
          image_url: ex.image,
          notes: "",
          rest_time: 0,
          personalRecords: [],
          sets: [
            {
              id: Math.random().toString(),
              type: "1" as SetType,
              weight: "",
              reps: "",
              completed: false,
              previous: "-",
            },
          ],
        };
      }),
    );
    setExercises(
      (prev: ActiveExercise[]) => [...prev, ...newExs] as ActiveExercise[],
    );
    setTempSelected([]);
    setIsModalVisible(false);
  };

  // FUNÇÃO DE REORDENAÇÃO
  const moveExercise = (index: number, direction: "up" | "down") => {
    const newExercises = [...exercises];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newExercises.length) return;

    const temp = newExercises[index];
    newExercises[index] = newExercises[targetIndex];
    newExercises[targetIndex] = temp;

    setExercises(newExercises);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View className="flex-row items-center justify-between px-4 py-3 bg-black border-b border-zinc-900">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronDown size={30} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black uppercase italic tracking-tighter text-lg">
            Workout
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
          <View className="px-4 mt-2 mb-4">
            <TextInput
              placeholder="Workout Name"
              placeholderTextColor="#52525b"
              value={activeRoutineName}
              onChangeText={setActiveRoutineName}
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              keyboardType={
                Platform.OS === "android" ? "visible-password" : "default"
              }
              className="text-white text-3xl font-black italic border-b border-zinc-800 pb-2 uppercase"
            />
          </View>

          {exercises.map((ex, index) => (
            <View
              key={ex.logId}
              className="mt-4 bg-zinc-900/30 rounded-[25px] p-5 mx-2 border border-zinc-900"
            >
              <View className="flex-row items-center mb-3">
                <TouchableOpacity
                  className="flex-row items-center flex-1"
                  onPress={() => {
                    router.push({
                      pathname: "/workout/[id]",
                      params: { id: ex.id, from: "workout" },
                    } as any);
                  }}
                >
                  <View className="w-16 h-16 rounded-2xl bg-zinc-900 items-center justify-center mr-3 border border-zinc-800 overflow-hidden">
                    {(() => {
                      const imageKey = ex.image_url?.trim();
                      if (!imageKey)
                        return (
                          <Image
                            source={InvictusLogo}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="contain"
                          />
                        );

                      const isExternal =
                        imageKey.startsWith("file") ||
                        imageKey.startsWith("http");

                      const imageSource = isExternal
                        ? { uri: imageKey }
                        : IMAGE_MAP[imageKey] || InvictusLogo;

                      return (
                        <Image
                          source={imageSource}
                          style={{ width: "100%", height: "100%" }}
                          contentFit={
                            imageSource === InvictusLogo ? "contain" : "cover"
                          }
                        />
                      );
                    })()}
                  </View>

                  <View className="flex-1">
                    <Text className="text-[#E31C25] text-xl font-black italic uppercase tracking-tighter">
                      {ex.name}
                    </Text>

                    {ex.personalRecords && ex.personalRecords.length > 0 && (
                      <View className="flex-row items-center bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 self-start mt-1">
                        <Target size={12} color="#EAB308" />
                        <Text className="text-[#EAB308] text-[10px] font-bold ml-1 uppercase">
                          PR: {ex.personalRecords[0].weight}kg
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setRemoveExerciseModal({
                      visible: true,
                      logId: ex.logId,
                      name: ex.name,
                    })
                  }
                  className="p-2"
                >
                  <MoreVertical size={24} color="#3f3f46" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Add notes..."
                placeholderTextColor="#3f3f46"
                value={ex.notes}
                onChangeText={(t) =>
                  setExercises((prev: ActiveExercise[]) =>
                    prev.map((e) =>
                      e.logId === ex.logId ? { ...e, notes: t } : e,
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
                  {ex.muscle_group?.toLowerCase() === "cardio" ? "KM" : "KG"}
                </Text>
                <Text className="text-zinc-700 text-[10px] font-black uppercase w-16 text-center italic">
                  {ex.muscle_group?.toLowerCase() === "cardio"
                    ? "TIME"
                    : "Reps"}
                </Text>
                <View className="w-12" />
              </View>

              {ex.sets.map((set, idx) => (
                <View key={set.id} className="mb-3">
                  <View
                    className={`flex-row items-center h-14 px-2 rounded-2xl border ${set.completed ? "bg-[#E31C25]/15 border-[#E31C25]/30" : "bg-zinc-900/60 border border-zinc-800"}`}
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
                        className={`font-black italic text-base ${
                          set.type === "W"
                            ? "text-amber-500"
                            : set.type === "D"
                              ? "text-purple-500"
                              : set.type === "F"
                                ? "text-[#E31C25]"
                                : "text-white"
                        }`}
                      >
                        {set.type === "1" ? idx + 1 : set.type}
                      </Text>
                    </TouchableOpacity>
                    <Text className="flex-1 text-zinc-500 text-center text-xs font-black italic">
                      {set.previous}
                    </Text>

                    <TextInput
                      keyboardType="numeric"
                      value={set.weight}
                      placeholder={
                        ex.muscle_group?.toLowerCase() === "cardio"
                          ? "0.0"
                          : set.suggestedWeight
                      }
                      placeholderTextColor="#52525b"
                      onChangeText={(v) =>
                        updateSet(ex.logId, set.id, "weight", v)
                      }
                      textAlignVertical="center"
                      multiline={false}
                      scrollEnabled={false}
                      underlineColorAndroid="transparent"
                      style={{ paddingVertical: 0 }}
                      className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black italic"
                    />

                    <TextInput
                      keyboardType={
                        ex.muscle_group?.toLowerCase() === "cardio"
                          ? "default"
                          : "numeric"
                      }
                      value={set.reps}
                      placeholder={
                        ex.muscle_group?.toLowerCase() === "cardio"
                          ? "00:00"
                          : set.suggestedReps
                      }
                      placeholderTextColor="#52525b"
                      onChangeText={(v) =>
                        updateSet(ex.logId, set.id, "reps", v)
                      }
                      textAlignVertical="center"
                      multiline={false}
                      scrollEnabled={false}
                      underlineColorAndroid="transparent"
                      style={{ paddingVertical: 0 }}
                      className="w-14 h-10 bg-zinc-950 text-white text-center rounded-xl mx-0.5 border border-zinc-800 font-black italic"
                    />

                    <TouchableOpacity
                      onPress={() => handleToggleSet(ex.logId, set.id)}
                      className={`w-9 h-9 rounded-xl items-center justify-center ml-2 ${set.completed ? "bg-[#E31C25]" : "bg-zinc-800"}`}
                    >
                      {set.completed &&
                      ex.personalRecords.length > 0 &&
                      isNewRecord(
                        set.weight,
                        set.reps,
                        ex.personalRecords[0].weight,
                        ex.personalRecords[0].reps,
                      ) ? (
                        <View className="absolute -top-3 -left-2 bg-amber-500 rounded-full p-1 border-2 border-black">
                          <Trophy size={10} color="black" />
                        </View>
                      ) : null}

                      <Check size={20} color="white" strokeWidth={5} />
                    </TouchableOpacity>
                  </View>

                  {activeRestSetId === set.id && restTimer !== null && (
                    <View className="mt-1.5 mx-1">
                      <View className="bg-amber-500/15 flex-row items-center justify-between px-5 py-2.5 rounded-xl border border-amber-500/30">
                        <View className="flex-row items-center">
                          <Clock size={16} color="#EAB308" strokeWidth={3} />
                          <Text className="text-[#EAB308] text-xs font-black italic ml-2.5 uppercase tracking-wider">
                            Resting Period
                          </Text>
                        </View>
                        <Text className="text-white text-base font-black italic tracking-tighter">
                          {restTimer}
                          <Text className="text-zinc-400 text-xs">s</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              <View className="flex-row items-center mt-3 gap-x-2">
                <TouchableOpacity
                  onPress={() =>
                    setExercises((prev: ActiveExercise[]) =>
                      prev.map((e) =>
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
                                  suggestedWeight:
                                    e.sets[e.sets.length - 1]?.weight || "0",
                                  suggestedReps:
                                    e.sets[e.sets.length - 1]?.reps || "0",
                                  completed: false,
                                  previous: "-",
                                },
                              ],
                            }
                          : e,
                      ),
                    )
                  }
                  className="flex-1 py-4 bg-zinc-900/40 rounded-2xl items-center border border-dashed border-zinc-800"
                >
                  <Text className="text-zinc-500 font-black text-[10px] uppercase italic tracking-widest">
                    + Add Set
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => moveExercise(index, "up")}
                  disabled={index === 0}
                  className={`p-4 rounded-2xl border border-zinc-800 ${index === 0 ? "bg-zinc-900/20 opacity-30" : "bg-zinc-900/40"}`}
                >
                  <ArrowUp
                    size={16}
                    color={index === 0 ? "#3f3f46" : "#E31C25"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => moveExercise(index, "down")}
                  disabled={index === exercises.length - 1}
                  className={`p-4 rounded-2xl border border-zinc-800 ${index === exercises.length - 1 ? "bg-zinc-900/20 opacity-30" : "bg-zinc-900/40"}`}
                >
                  <ArrowDown
                    size={16}
                    color={
                      index === exercises.length - 1 ? "#3f3f46" : "#E31C25"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
                  Select Exercises
                </Text>
                <TouchableOpacity onPress={confirmSelection}>
                  <Text className="text-[#E31C25] text-xl font-black uppercase italic">
                    Add{" "}
                    {tempSelected.length > 0 ? `(${tempSelected.length})` : ""}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-zinc-900/50 rounded-2xl h-14 px-5 mb-4 border border-zinc-800">
                <Search color="#52525b" size={20} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search exercises..."
                  placeholderTextColor="#52525b"
                  className="flex-1 text-white font-bold italic text-base"
                />
              </View>

              <View className="flex-row justify-between mb-6 gap-x-3">
                <TouchableOpacity
                  onPress={() => {
                    setModalType("equipment");
                    setIsFilterModalVisible(true);
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 px-4 ${selectedEquipment ? "bg-[#E31C25]" : "bg-zinc-900"}`}
                >
                  <Text
                    numberOfLines={1}
                    className="text-white text-[10px] font-black uppercase italic mr-2 flex-shrink"
                  >
                    {selectedEquipment || "Equipment"}
                  </Text>
                  <ChevronDown color="white" size={14} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setModalType("muscle");
                    setIsFilterModalVisible(true);
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 px-4 ${selectedMuscle ? "bg-[#E31C25]" : "bg-zinc-900"}`}
                >
                  <Text
                    numberOfLines={1}
                    className="text-white text-[10px] font-black uppercase italic mr-2 flex-shrink"
                  >
                    {selectedMuscle || "Muscles"}
                  </Text>
                  <ChevronDown color="white" size={14} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={dbExercises.filter(
                  (ex) =>
                    ex.name.toLowerCase().includes(search.toLowerCase()) &&
                    !exercises.some((ae: any) => ae.id === ex.id),
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = tempSelected.some((e) => e.id === item.id);
                  const imageKey = item.image?.trim();

                  const isExternal =
                    imageKey?.startsWith("file") ||
                    imageKey?.startsWith("http");
                  const imageSource = isExternal
                    ? { uri: imageKey }
                    : imageKey && IMAGE_MAP[imageKey]
                      ? IMAGE_MAP[imageKey]
                      : InvictusLogo;

                  return (
                    <View className="flex-row items-center py-4 border-b border-zinc-900/50">
                      <TouchableOpacity
                        className="flex-1 flex-row items-center"
                        onPress={() => {
                          setIsModalVisible(false);
                          router.push({
                            pathname: "/workout/[id]",
                            params: { id: item.id, from: "workout" },
                          } as any);
                        }}
                      >
                        <View className="w-16 h-16 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
                          <Image
                            source={imageSource}
                            style={{ width: "100%", height: "100%" }}
                            contentFit={
                              imageSource === InvictusLogo ? "contain" : "cover"
                            }
                          />
                        </View>

                        <View className="flex-1">
                          <Text
                            className={`text-[16px] font-bold uppercase italic ${isSelected ? "text-[#E31C25]" : "text-white"}`}
                          >
                            {item.name}
                          </Text>
                          <Text className="text-zinc-500 text-xs mt-1 uppercase font-medium">
                            {item.muscle_group} • {item.equipment}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          isSelected
                            ? setTempSelected(
                                tempSelected.filter((e) => e.id !== item.id),
                              )
                            : setTempSelected([...tempSelected, item])
                        }
                        className="w-12 h-12 items-center justify-center"
                      >
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center border-2 ${isSelected ? "bg-[#E31C25] border-[#E31C25]" : "border-zinc-800"}`}
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

            <Modal
              visible={isFilterModalVisible}
              transparent
              animationType="slide"
            >
              <TouchableWithoutFeedback
                onPress={() => setIsFilterModalVisible(false)}
              >
                <View className="flex-1 bg-black/80 justify-end">
                  <TouchableWithoutFeedback>
                    <View className="bg-[#121212] rounded-t-[40px] h-[60%] p-8 border-t border-zinc-800">
                      <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-6" />
                      <Text className="text-white text-xl font-black uppercase italic mb-6">
                        {modalType === "muscle" ? "Muscles" : "Equipment"}
                      </Text>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        <TouchableOpacity
                          onPress={() => {
                            if (modalType === "muscle") setSelectedMuscle(null);
                            else setSelectedEquipment(null);
                            setIsFilterModalVisible(false);
                          }}
                          className="flex-row items-center py-4 border-b border-zinc-900"
                        >
                          <Text className="text-white text-lg flex-1 font-bold italic uppercase">
                            All
                          </Text>
                          {(modalType === "muscle"
                            ? !selectedMuscle
                            : !selectedEquipment) && (
                            <Check color="#E31C25" size={24} />
                          )}
                        </TouchableOpacity>
                        {(modalType === "muscle"
                          ? muscleOptions
                          : equipmentOptions
                        ).map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => {
                              if (modalType === "muscle")
                                setSelectedMuscle(opt);
                              else setSelectedEquipment(opt);
                              setIsFilterModalVisible(false);
                            }}
                            className="flex-row items-center py-4 border-b border-zinc-900"
                          >
                            <Text className="text-white text-lg flex-1 font-bold italic uppercase">
                              {opt}
                            </Text>
                            {(modalType === "muscle"
                              ? selectedMuscle
                              : selectedEquipment) === opt && (
                              <Check color="#E31C25" size={24} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
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
                  { l: "Normal", v: "1", i: "1", c: "text-white" },
                  { l: "Warmup", v: "W", i: "W", c: "text-amber-500" },
                  { l: "Drop", v: "D", i: "D", c: "text-purple-500" },
                  { l: "Fail", v: "F", i: "F", c: "text-[#E31C25]" },
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
                      {i.i}
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

        <Modal visible={restModal.visible} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-black/80 justify-center px-10"
          >
            <View className="bg-[#121212] p-8 rounded-[30px] border border-zinc-800">
              <Text className="text-white text-center font-black uppercase italic mb-6">
                Rest Timer (Seconds)
              </Text>

              <TextInput
                keyboardType="numeric"
                autoFocus
                value={restModal.value}
                onChangeText={(v) =>
                  setRestModal((prev) => ({ ...prev, value: v }))
                }
                textAlignVertical="center"
                multiline={false}
                scrollEnabled={false}
                style={{ paddingVertical: 0 }}
                className="bg-zinc-900 text-white text-3xl font-black text-center py-4 rounded-2xl border border-zinc-800 mb-6"
              />

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => setRestModal({ ...restModal, visible: false })}
                  className="flex-1 py-4 mr-2 items-center bg-zinc-800 rounded-xl"
                >
                  <Text className="text-zinc-400 font-bold uppercase">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const seconds = parseInt(restModal.value || "0");
                    setExercises((prev: ActiveExercise[]) =>
                      prev.map((e) =>
                        e.logId === restModal.exLogId
                          ? { ...e, rest_time: seconds }
                          : e,
                      ),
                    );
                    setRestModal({ ...restModal, visible: false });
                  }}
                  className="flex-1 py-4 ml-2 items-center bg-[#E31C25] rounded-xl"
                >
                  <Text className="text-white font-black uppercase italic">
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={removeExerciseModal.visible}
          transparent
          animationType="fade"
        >
          <View className="flex-1 bg-black/90 justify-center items-center px-6">
            <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
              <View className="bg-[#E31C25]/10 p-4 rounded-full mb-6">
                <Trash2 color="#ef4444" size={32} />
              </View>

              <Text className="text-white text-center text-xl font-black uppercase italic mb-3">
                Remove Exercise?
              </Text>

              <Text className="text-zinc-500 text-center text-sm font-bold uppercase mb-8">
                Are you sure you want to remove {removeExerciseModal.name}
                from this workout?
              </Text>

              <View className="flex-row w-full justify-between gap-x-4">
                <TouchableOpacity
                  onPress={() =>
                    setRemoveExerciseModal({
                      ...removeExerciseModal,
                      visible: false,
                    })
                  }
                  className="flex-1 bg-zinc-900 py-4 rounded-xl items-center border border-zinc-800"
                >
                  <Text className="text-zinc-400 font-bold uppercase">
                    No, Keep
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setExercises((prev: ActiveExercise[]) =>
                      prev.filter((e) => e.logId !== removeExerciseModal.logId),
                    );
                    setRemoveExerciseModal({
                      ...removeExerciseModal,
                      visible: false,
                    });
                  }}
                  className="flex-1 bg-[#E31C25] py-4 rounded-xl items-center"
                >
                  <Text className="text-white font-black uppercase italic">
                    Yes, Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
