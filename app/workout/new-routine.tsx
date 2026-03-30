import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
    ArrowLeft,
    Check,
    Dumbbell,
    Search,
    X
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

// --- Mapeamento de Imagens ---
const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

export default function NewRoutineScreen() {
  const router = useRouter();

  // Estados da Rotina
  const [step, setStep] = useState(1); // 1: Nome, 2: Exercícios
  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  // Estados da Lista de Exercícios (Filtros e Busca)
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );

  // --- Lógica de Base de Dados ---
  const fetchExercises = useCallback(async () => {
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
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  }, [search, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    if (step === 2) fetchExercises();
  }, [step, fetchExercises]);

  // --- Funções de Ação ---
  const toggleExercise = (ex: Exercise) => {
    const isSelected = selectedExercises.find((e) => e.id === ex.id);
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== ex.id));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  const saveRoutine = async () => {
    if (selectedExercises.length === 0) return;
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      // 1. Criar a Rotina
      const result = await db.runAsync(
        "INSERT INTO routines (name) VALUES (?)",
        [routineName],
      );
      const routineId = result.lastInsertRowId;

      // 2. Ligar os Exercícios à Rotina
      for (const ex of selectedExercises) {
        await db.runAsync(
          "INSERT INTO routine_exercises (routine_id, exercise_id) VALUES (?, ?)",
          [routineId, ex.id],
        );
      }
      router.back();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* HEADER DINÂMICO */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() => (step === 1 ? router.back() : setStep(1))}
        >
          {step === 1 ? (
            <X color="white" size={24} />
          ) : (
            <ArrowLeft color="white" size={24} />
          )}
        </TouchableOpacity>

        <Text className="text-white text-lg font-medium">
          {step === 1 ? "New Routine" : "Add Exercises"}
        </Text>

        <TouchableOpacity
          onPress={() =>
            step === 1 ? (routineName ? setStep(2) : null) : saveRoutine()
          }
          disabled={step === 1 ? !routineName : selectedExercises.length === 0}
        >
          <Text
            className={`${(step === 1 ? routineName : selectedExercises.length > 0) ? "text-[#E31C25]" : "text-zinc-800"} text-base font-medium`}
          >
            {step === 1 ? "Next" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO PASSO 1: NOME */}
      {step === 1 && (
        <View className="flex-1 px-8 pt-20">
          <Text className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-medium">
            Routine Name
          </Text>
          <TextInput
            autoFocus
            placeholder="e.g. Upper Body"
            placeholderTextColor="#27272a"
            value={routineName}
            onChangeText={setRoutineName}
            className="text-white text-3xl font-normal border-b border-zinc-800 pb-2"
            selectionColor="#E31C25"
          />
          <Text className="text-zinc-600 text-sm mt-4 font-normal">
            Give your routine a clear name so you can find it easily later.
          </Text>
        </View>
      )}

      {/* CONTEÚDO PASSO 2: LISTA DE EXERCÍCIOS CLEAN */}
      {step === 2 && (
        <View className="flex-1 px-6 pt-4">
          {/* Barra de Busca */}
          <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 h-12 mb-6 border border-zinc-800">
            <Search color="#52525b" size={18} className="mr-3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises"
              placeholderTextColor="#52525b"
              className="flex-1 text-white text-base font-normal"
              selectionColor="#E31C25"
            />
          </View>

          {/* Lista */}
          {loading ? (
            <ActivityIndicator color="#E31C25" className="mt-10" />
          ) : (
            <FlatList
              data={exercises}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.find(
                  (e) => e.id === item.id,
                );
                return (
                  <TouchableOpacity
                    onPress={() => toggleExercise(item)}
                    className={`flex-row items-center py-4 border-b border-zinc-900 ${isSelected ? "opacity-100" : "opacity-60"}`}
                  >
                    <View className="w-12 h-12 rounded-full bg-zinc-900 items-center justify-center mr-4 overflow-hidden border border-zinc-800">
                      {item.image ? (
                        <Image
                          source={IMAGE_MAP[item.image]}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Dumbbell
                          size={18}
                          color={isSelected ? "#E31C25" : "#3f3f46"}
                        />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-[16px] font-normal">
                        {item.name}
                      </Text>
                      <Text className="text-zinc-500 text-xs mt-0.5 font-normal uppercase tracking-wider">
                        {item.muscle_group}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? "bg-[#E31C25] border-[#E31C25]" : "border-zinc-800"}`}
                    >
                      {isSelected && (
                        <Check color="white" size={14} strokeWidth={4} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Contador Flutuante */}
          {selectedExercises.length > 0 && (
            <View className="absolute bottom-10 left-6 right-6 bg-[#E31C25] py-3 rounded-full items-center">
              <Text className="text-white font-medium">
                {selectedExercises.length} Exercise
                {selectedExercises.length > 1 ? "s" : ""} Selected
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
