import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  Check,
  ChevronDown,
  Dumbbell,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  View
} from "react-native";

// --- Tipos ---
type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

type Set = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};

type WorkoutExercise = Exercise & {
  sets: Set[];
};

// Mapeamento de Imagens (conforme o teu padrão)
const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

export default function ActiveSessionScreen() {
  const router = useRouter();

  // --- Estados do Treino ---
  const [seconds, setSeconds] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );

  // --- Estados do Modal de Seleção (Clean Style) ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);

  // Filtros internos do Modal
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  // 1. Cronómetro
  useEffect(() => {
    const interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // 2. Carregar Dados da BD (Igual à tua lógica de Exercises)
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      let params: any[] = [];

      if (search.trim()) {
        query += " AND name LIKE ?";
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
      const result = await db.getAllAsync<Exercise>(query, params);
      setExercises(result);

      // Carregar opções de filtro apenas uma vez
      if (muscleOptions.length === 0) {
        const muscles = await db.getAllAsync<{ muscle_group: string }>(
          "SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group ASC",
        );
        setMuscleOptions(muscles.map((m) => m.muscle_group));
        const equipments = await db.getAllAsync<{ equipment: string }>(
          "SELECT DISTINCT equipment FROM exercises ORDER BY equipment ASC",
        );
        setEquipmentOptions(equipments.map((e) => e.equipment));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    if (isModalVisible) fetchExercises();
  }, [isModalVisible, fetchExercises]);

  // 3. Lógica de Treino
  const addExerciseToWorkout = (ex: Exercise) => {
    setWorkoutExercises([
      ...workoutExercises,
      {
        ...ex,
        sets: [{ id: Date.now(), weight: "", reps: "", completed: false }],
      },
    ]);
    setIsModalVisible(false);
  };

  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof Set,
    value: any,
  ) => {
    const updated = [...workoutExercises];
    updated[exIndex].sets[setIndex] = {
      ...updated[exIndex].sets[setIndex],
      [field]: value,
    };
    setWorkoutExercises(updated);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header - Tipografia Clean */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-zinc-900">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronDown color="white" size={28} />
          </TouchableOpacity>
          <Text className="text-white text-[17px] font-medium tracking-tight">
            Active Session
          </Text>
          <TouchableOpacity className="bg-[#E31C25] px-5 py-1.5 rounded-full">
            <Text className="text-white font-medium text-xs uppercase tracking-wider">
              Finish
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View className="flex-row justify-around py-5 border-b border-zinc-900 bg-zinc-950">
          <View className="items-center">
            <Text className="text-zinc-500 text-[10px] uppercase font-normal tracking-[1.5px] mb-1">
              Duration
            </Text>
            <Text className="text-[#E31C25] font-light text-2xl">
              {formatTime(seconds)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-zinc-500 text-[10px] uppercase font-normal tracking-[1.5px] mb-1">
              Volume
            </Text>
            <Text className="text-white font-light text-2xl">0 kg</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {workoutExercises.map((ex, exIndex) => (
            <View key={exIndex} className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#E31C25] font-medium text-[18px] flex-1">
                  {ex.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...workoutExercises];
                    updated.splice(exIndex, 1);
                    setWorkoutExercises(updated);
                  }}
                >
                  <Trash2 size={18} color="#3f3f46" />
                </TouchableOpacity>
              </View>

              {/* Tabela de Séries */}
              <View className="flex-row mb-2 px-2">
                <Text className="text-zinc-600 font-normal text-[10px] w-12 text-center uppercase tracking-widest">
                  Set
                </Text>
                <Text className="text-zinc-600 font-normal text-[10px] flex-1 text-center uppercase tracking-widest">
                  Kg
                </Text>
                <Text className="text-zinc-600 font-normal text-[10px] flex-1 text-center uppercase tracking-widest">
                  Reps
                </Text>
                <View className="w-10" />
              </View>

              {ex.sets.map((set, setIndex) => (
                <View
                  key={set.id}
                  className={`flex-row items-center py-1.5 px-2 rounded-xl mb-1 ${set.completed ? "bg-zinc-900/40" : "bg-transparent"}`}
                >
                  <View className="w-12 items-center">
                    <View className="bg-zinc-900 w-6 h-6 rounded-md items-center justify-center border border-zinc-800">
                      <Text className="text-zinc-500 font-medium text-[10px]">
                        {setIndex + 1}
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    keyboardType="numeric"
                    className="flex-1 text-white text-center font-normal text-[16px] bg-zinc-900 mx-1 rounded-lg h-9 border border-zinc-800"
                    value={set.weight}
                    onChangeText={(v) =>
                      updateSet(exIndex, setIndex, "weight", v)
                    }
                    placeholder="0"
                    placeholderTextColor="#27272a"
                  />
                  <TextInput
                    keyboardType="numeric"
                    className="flex-1 text-white text-center font-normal text-[16px] bg-zinc-900 mx-1 rounded-lg h-9 border border-zinc-800"
                    value={set.reps}
                    onChangeText={(v) =>
                      updateSet(exIndex, setIndex, "reps", v)
                    }
                    placeholder="0"
                    placeholderTextColor="#27272a"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      updateSet(exIndex, setIndex, "completed", !set.completed)
                    }
                    className={`w-9 h-9 rounded-lg items-center justify-center ml-2 ${set.completed ? "bg-[#E31C25]" : "bg-zinc-900 border border-zinc-800"}`}
                  >
                    <Check color="white" size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => {
                  const updated = [...workoutExercises];
                  updated[exIndex].sets.push({
                    id: Date.now(),
                    weight: "",
                    reps: "",
                    completed: false,
                  });
                  setWorkoutExercises(updated);
                }}
                className="py-2 mt-2 items-center"
              >
                <Text className="text-zinc-500 text-[12px] font-normal">
                  + Add Set
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="bg-[#E31C25]/5 border border-[#E31C25]/20 py-4 rounded-2xl flex-row justify-center items-center mb-32"
          >
            <Plus size={20} color="#E31C25" />
            <Text className="text-[#E31C25] font-medium ml-2 text-[16px]">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* --- MODAL DE SELEÇÃO (Igual ao ExercisesPage, mas Clean) --- */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-[#121417]">
            <View className="px-6 pt-4 flex-1">
              {/* Header Modal */}
              <View className="flex-row items-center justify-between mb-6">
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  className="p-2 -ml-2"
                >
                  <X color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-lg font-medium">
                  Select Exercise
                </Text>
                <View className="w-10" />
              </View>

              {/* Barra de Busca */}
              <View className="flex-row items-center bg-[#2D2F33] rounded-xl px-4 h-12 mb-4">
                <Search color="#9ca3af" size={18} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search exercise"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-white text-base font-normal"
                  selectionColor="#E31C25"
                />
              </View>

              {/* Filtros Suaves */}
              <View className="flex-row justify-between mb-6 gap-x-3">
                <TouchableOpacity
                  onPress={() => {
                    setModalType("equipment");
                    setIsFilterModalVisible(true);
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-full py-2.5 px-4 ${selectedEquipment ? "bg-[#E31C25]" : "bg-[#2D2F33]"}`}
                >
                  <Text
                    numberOfLines={1}
                    className="text-white text-[12px] font-normal mr-2"
                  >
                    {selectedEquipment || "Equipment"}
                  </Text>
                  <ChevronDown
                    color={selectedEquipment ? "white" : "#9ca3af"}
                    size={16}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setModalType("muscle");
                    setIsFilterModalVisible(true);
                  }}
                  className={`flex-1 flex-row items-center justify-center rounded-full py-2.5 px-4 ${selectedMuscle ? "bg-[#E31C25]" : "bg-[#2D2F33]"}`}
                >
                  <Text
                    numberOfLines={1}
                    className="text-white text-[12px] font-normal mr-2"
                  >
                    {selectedMuscle || "Muscles"}
                  </Text>
                  <ChevronDown
                    color={selectedMuscle ? "white" : "#9ca3af"}
                    size={16}
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator color="#E31C25" className="mt-10" />
              ) : (
                <FlatList
                  data={exercises}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="flex-row items-center py-4 border-b border-zinc-800/50"
                      onPress={() => addExerciseToWorkout(item)}
                    >
                      <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center mr-4 overflow-hidden border border-zinc-700">
                        {item.image ? (
                          <Image
                            source={IMAGE_MAP[item.image]}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Dumbbell size={18} color="#52525b" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-[16px] font-normal">
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">
                          {item.muscle_group} • {item.equipment}
                        </Text>
                      </View>
                      <Plus color="#E31C25" size={20} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
