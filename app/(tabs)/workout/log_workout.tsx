import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite"; // 1. Importar o contexto
import {
  Check,
  ChevronDown,
  Clock,
  MoreVertical,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SetType, useWorkout } from "../context/workoutcontext";

const IMAGE_MAP: Record<string, any> = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

export default function LogWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const db = useSQLiteContext(); // 2. Instância única da BD

  const {
    timer,
    restTimer,
    exercises,
    setExercises,
    updateSet,
    toggleSetCompleted,
    isActive,
    setIsActive,
    setIsMinimized,
    setLastExercise,
  } = useWorkout();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<any[]>([]);

  // 3. CARREGAR ROTINA - Removido o openDatabaseAsync
  const initWorkout = useCallback(async () => {
    const routineId = Array.isArray(params.routineId)
      ? params.routineId[0]
      : params.routineId;
    if (!routineId || exercises.length > 0) return;

    try {
      const routineExs = await db.getAllAsync<any>(
        `SELECT e.* FROM exercises e 
         JOIN routine_exercises re ON e.id = re.exerciseid 
         WHERE re.routineid = ?
         ORDER BY re.index_order ASC`,
        [routineId],
      );

      if (routineExs && routineExs.length > 0) {
        const prepared = await Promise.all(
          routineExs.map(async (ex) => {
            const prevRes = await db.getFirstAsync<any>(
              "SELECT weight, reps FROM workout_sets WHERE exerciseid = ? ORDER BY id DESC LIMIT 1",
              [ex.id],
            );
            const prevStr = prevRes
              ? `${prevRes.weight}kg x ${prevRes.reps}`
              : "-";

            return {
              logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
              id: ex.id,
              name: ex.name,
              sets: [
                {
                  id: Math.random().toString(),
                  type: "1" as SetType,
                  weight: "",
                  reps: "",
                  completed: false,
                  previous: prevStr,
                },
              ],
            };
          }),
        );

        setExercises(prepared);
        if (!isActive) setIsActive(true);
        setLastExercise(prepared[0]?.name || "Rotina");
      }
    } catch (error) {
      console.error("Erro ao carregar rotina:", error);
    }
  }, [params.routineId, db, exercises.length]);

  // 4. BUSCA EXERCÍCIOS PARA O MODAL
  const fetchModalExercises = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<any>(
        "SELECT * FROM exercises ORDER BY name ASC",
      );
      setDbExercises(rows || []);
    } catch (e) {
      console.error(e);
    }
  }, [db]);

  // 5. SETUP INICIAL - Removido openDatabaseAsync e execuções duplicadas
  useEffect(() => {
    const setupAndInit = async () => {
      try {
        await fetchModalExercises();
        await initWorkout();
      } catch (error) {
        console.error("Erro no setup:", error);
      }
    };
    setupAndInit();
  }, [db, fetchModalExercises, initWorkout]);

  // 6. CONFIRMAR SELEÇÃO
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
          const prevStr = prevRes
            ? `${prevRes.weight}kg x ${prevRes.reps}`
            : "-";

          return {
            logId: `${ex.id}-${Math.random().toString(36).substr(2, 9)}`,
            id: ex.id,
            name: ex.name,
            sets: [
              {
                id: Math.random().toString(),
                type: "1" as SetType,
                weight: "",
                reps: "",
                completed: false,
                previous: prevStr,
              },
            ],
          };
        }),
      );

      setExercises([...exercises, ...newExs]);
      if (!isActive) setIsActive(true);
      setTempSelected([]);
      setIsModalVisible(false);
      setSearch("");
    } catch (error) {
      console.error("Erro ao adicionar:", error);
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
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-zinc-900 bg-black">
          <TouchableOpacity
            onPress={() => {
              setIsMinimized(true);
              router.back();
            }}
          >
            <ChevronDown size={28} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-0.5">
              Treino Ativo
            </Text>
            <Text className="text-white font-bold text-lg">{timer}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/workout/save_workout")}
            className="bg-[#E31C25] px-5 py-2 rounded-full"
          >
            <Text className="text-white font-bold text-sm">Finish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
          {exercises.map((ex) => (
            <View
              key={ex.logId}
              className="mt-6 bg-[#121212] rounded-3xl p-4 border border-zinc-900 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#E31C25] text-lg font-black">
                  {ex.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert("Opções", ex.name, [
                      {
                        text: "Remover Exercício",
                        style: "destructive",
                        onPress: () =>
                          setExercises(
                            exercises.filter((e) => e.logId !== ex.logId),
                          ),
                      },
                      { text: "Cancelar", style: "cancel" },
                    ]);
                  }}
                >
                  <MoreVertical size={20} color="#71717a" />
                </TouchableOpacity>
              </View>

              {ex.sets.map((set, idx) => (
                <View key={set.id} className="mb-2">
                  <View
                    className={`flex-row items-center h-14 px-2 rounded-2xl ${set.completed ? "bg-[#E31C25]/10" : "bg-zinc-900/30"}`}
                  >
                    <Text className="text-white font-bold w-8 text-center">
                      {idx + 1}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-zinc-500 text-center text-[10px] italic">
                        {set.previous}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <TextInput
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "weight", v)
                        }
                        className="w-14 h-9 bg-zinc-950 text-white text-center rounded-lg mx-1 border border-zinc-800"
                        placeholder="0"
                      />
                      <TextInput
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={(v) =>
                          updateSet(ex.logId, set.id, "reps", v)
                        }
                        className="w-14 h-9 bg-zinc-950 text-white text-center rounded-lg mx-1 border border-zinc-800"
                        placeholder="0"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleSetCompleted(ex.logId, set.id)}
                      className={`w-10 h-10 rounded-xl items-center justify-center ml-2 ${set.completed ? "bg-[#E31C25]" : "bg-zinc-800"}`}
                    >
                      <Check size={18} color="white" strokeWidth={4} />
                    </TouchableOpacity>
                  </View>
                  {set.completed &&
                    restTimer !== null &&
                    idx === ex.sets.length - 1 && (
                      <View className="flex-row items-center justify-center py-2 bg-amber-500/10 rounded-xl mt-1 border border-amber-500/20">
                        <Clock size={12} color="#f59e0b" />
                        <Text className="text-amber-500 font-bold text-[11px] ml-2 italic">
                          Descanso: {restTimer}s
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
                className="mt-2 py-3 bg-zinc-900/40 rounded-2xl items-center border border-dashed border-zinc-800"
              >
                <Text className="text-zinc-500 font-bold text-xs uppercase">
                  + Add Set
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="bg-[#E31C25] py-4 rounded-3xl mt-10 items-center flex-row justify-center mb-40 shadow-lg"
          >
            <Plus size={20} color="white" strokeWidth={4} />
            <Text className="text-white font-black text-lg ml-2 uppercase">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL SELEÇÃO EXERCÍCIOS */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView className="flex-1 bg-[#121417]">
            <View className="flex-1 px-6 pt-4">
              <View className="flex-row items-center justify-between mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false);
                    setTempSelected([]);
                  }}
                >
                  <X color="white" size={26} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Exercises</Text>
                <TouchableOpacity onPress={confirmSelection}>
                  <Text className="text-[#E31C25] text-lg font-bold">Add</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center bg-[#2D2F33] rounded-xl px-4 h-12 mb-6">
                <Search color="#9ca3af" size={20} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search..."
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-white text-base"
                />
              </View>
              <FlatList
                data={dbExercises.filter((ex) =>
                  ex.name.toLowerCase().includes(search.toLowerCase()),
                )}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }: any) => {
                  const isSelected = tempSelected.some((e) => e.id === item.id);
                  return (
                    <TouchableOpacity
                      onPress={() =>
                        isSelected
                          ? setTempSelected(
                              tempSelected.filter((e) => e.id !== item.id),
                            )
                          : setTempSelected([...tempSelected, item])
                      }
                      className="flex-row items-center py-3 border-b border-zinc-800/50"
                    >
                      <View className="w-12 h-12 rounded-full bg-zinc-800 mr-4 overflow-hidden items-center justify-center border border-zinc-700">
                        {item.image && IMAGE_MAP[item.image] ? (
                          <Image
                            source={IMAGE_MAP[item.image]}
                            className="w-full h-full"
                          />
                        ) : (
                          <Text className="text-zinc-600 text-[8px]">IMG</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-[16px] font-semibold ${isSelected ? "text-[#E31C25]" : "text-white"}`}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-sm">
                          {item.muscle_group} • {item.equipment}
                        </Text>
                      </View>
                      {isSelected ? (
                        <Check color="#E31C25" size={24} strokeWidth={3} />
                      ) : (
                        <Plus color="#3f3f46" size={24} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
