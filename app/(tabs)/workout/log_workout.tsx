import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  Check,
  ChevronDown,
  MoreVertical,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkout } from "../context/workoutcontext"; // Caminho corrigido para a raiz

const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

type SetType = "W" | "1" | "F" | "D";
type SetEntry = {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
};
type ActiveExercise = {
  logId: string;
  id: number;
  name: string;
  sets: SetEntry[];
};
type DBExercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

export default function LogWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // USA O CONTEXTO GLOBAL
  const {
    timer,
    isActive,
    setIsActive,
    setIsMinimized,
    setLastExercise,
    stopWorkout,
  } = useWorkout();

  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<DBExercise[]>([]);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<DBExercise[]>([]);
  const [activeSetSelection, setActiveSetSelection] = useState<{
    exId: number;
    setId: string;
  } | null>(null);

  // 1. Minimizar treino e mostrar barra
  const minimizeWorkout = () => {
    setIsMinimized(true);
    router.back();
  };

  // 2. Carregar exercícios da BD
  const fetchModalExercises = useCallback(async () => {
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      const params: any[] = [];
      if (search.trim()) {
        query += " AND name LIKE ?";
        params.push(`%${search.trim()}%`);
      }
      query += " ORDER BY name ASC LIMIT 50";
      const rows = await db.getAllAsync<DBExercise>(query, params);
      setDbExercises(rows);
    } catch (e) {
      console.error(e);
    }
  }, [search]);

  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises]);

  // 3. Lógica de Seleção Múltipla (A FUNÇÃO QUE FALTAVA)
  const toggleTempSelection = (ex: DBExercise) => {
    const exists = tempSelected.find((e) => e.id === ex.id);
    if (exists) {
      setTempSelected((prev) => prev.filter((e) => e.id !== ex.id));
    } else {
      setTempSelected((prev) => [...prev, ex]);
    }
  };

  const confirmSelection = () => {
    if (tempSelected.length === 0) return;

    const newExercises = tempSelected.map((ex) => ({
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
        },
      ],
    }));

    // Se for o primeiro exercício ou se não houver exercícios, ativa o treino global
    if (!isActive) {
      setIsActive(true);
    }

    // Atualiza sempre o nome do último exercício na barra
    setLastExercise(newExercises[newExercises.length - 1].name);

    setExercises((prev) => [...prev, ...newExercises]);
    setTempSelected([]);
    setIsModalVisible(false);
  };

  const addSet = (exId: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: Math.random().toString(),
                  type: "1",
                  weight: "",
                  reps: "",
                  completed: false,
                },
              ],
            }
          : ex,
      ),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* HEADER */}
        <View className="flex-row items-center justify-between px-5 py-2 border-b border-zinc-900">
          <TouchableOpacity onPress={minimizeWorkout}>
            <ChevronDown size={28} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white font-bold text-base">Log Workout</Text>
            <Text className="text-[#E31C25] text-xs font-bold">{timer}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              stopWorkout();
              router.push({
                pathname: "/workout/save_workout",
                params: {
                  duration: timer,
                  volume: "0",
                  sets: exercises
                    .reduce((acc, ex) => acc + ex.sets.length, 0)
                    .toString(),
                  title: "Treino",
                },
              });
            }}
            className="bg-[#E31C25] px-5 py-1.5 rounded-full"
          >
            <Text className="text-white font-bold text-sm">Finish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
          {/* STATS */}
          <View className="flex-row justify-between py-6 border-b border-zinc-900/50">
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                Duration
              </Text>
              <Text className="text-white text-lg font-bold">{timer}</Text>
            </View>
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                Volume
              </Text>
              <Text className="text-white text-lg font-bold">0 kg</Text>
            </View>
            <View>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                Sets
              </Text>
              <Text className="text-white text-lg font-bold">
                {exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
              </Text>
            </View>
          </View>

          {exercises.map((ex) => (
            <View key={ex.logId} className="mt-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#E31C25] text-[17px] font-bold">
                  {ex.name}
                </Text>
                <TouchableOpacity>
                  <MoreVertical size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              {ex.sets.map((set, idx) => (
                <View
                  key={set.id}
                  className={`flex-row items-center h-12 px-2 rounded-xl mb-1 ${
                    set.completed ? "bg-[#E31C25]/10" : ""
                  }`}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setActiveSetSelection({ exId: ex.id, setId: set.id })
                    }
                    className="w-8 h-8 bg-zinc-800 rounded-lg items-center justify-center"
                  >
                    <Text
                      className={`font-black ${
                        set.type === "1" ? "text-zinc-400" : "text-[#E31C25]"
                      }`}
                    >
                      {set.type}
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-zinc-700 flex-1 text-center text-xs">
                    —
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#333"
                    className="w-16 h-9 bg-zinc-900 text-white rounded-lg text-center font-bold mx-1"
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#333"
                    className="w-16 h-9 bg-zinc-900 text-white rounded-lg text-center font-bold mx-1"
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setExercises((p) =>
                        p.map((e) =>
                          e.logId === ex.logId
                            ? {
                                ...e,
                                sets: e.sets.map((s) =>
                                  s.id === set.id
                                    ? { ...s, completed: !s.completed }
                                    : s,
                                ),
                              }
                            : e,
                        ),
                      )
                    }
                    className={`w-8 h-8 rounded-lg items-center justify-center ml-2 ${
                      set.completed ? "bg-[#E31C25]" : "bg-zinc-800"
                    }`}
                  >
                    <Check size={16} color="white" strokeWidth={4} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => addSet(ex.id)}
                className="bg-zinc-900/50 py-2.5 rounded-xl mt-3 items-center border border-zinc-800/30"
              >
                <Text className="text-zinc-400 font-bold text-sm">
                  + Add Set
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="bg-[#E31C25] py-4 rounded-2xl mt-10 items-center flex-row justify-center mb-20"
          >
            <Plus size={20} color="white" strokeWidth={4} />
            <Text className="text-white font-black text-lg ml-2">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL SELEÇÃO */}
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
                  <Text className="text-[#E31C25] text-lg font-bold">Done</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-[#2D2F33] rounded-xl px-4 h-12 mb-6">
                <Search color="#9ca3af" size={20} className="mr-3" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search exercise"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 text-white text-base"
                />
              </View>

              <FlatList
                data={dbExercises}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }: { item: DBExercise }) => {
                  const isSelected = tempSelected.some((e) => e.id === item.id);
                  const imageSource = item.image ? IMAGE_MAP[item.image] : null;
                  return (
                    <TouchableOpacity
                      onPress={() => toggleTempSelection(item)}
                      className="flex-row items-center py-3 border-b border-zinc-800/50"
                    >
                      <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center mr-4 overflow-hidden border border-zinc-700">
                        {imageSource ? (
                          <Image
                            source={imageSource}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full bg-zinc-800" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-[16px] font-semibold ${
                            isSelected ? "text-[#E31C25]" : "text-white"
                          }`}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-sm mt-0.5">
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
