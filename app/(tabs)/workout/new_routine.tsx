import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native"; // Adicionado
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronLeft,
  GripVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

export default function NewRoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const isFocused = useIsFocused(); // Adicionado para monitorizar foco
  const { routineId: rawId, mode: rawMode } = useLocalSearchParams();

  const routineId = Array.isArray(rawId) ? rawId[0] : rawId;
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

  const [name, setName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");

  // 1. LIMPAR ESTADO AO ENTRAR (Se for nova rotina)
  useEffect(() => {
    if (isFocused && mode !== "edit") {
      setName("");
      setSelectedExercises([]);
    }
  }, [isFocused, mode]);

  // 2. CARREGAR DADOS SE FOR EDIÇÃO
  useEffect(() => {
    if (mode === "edit" && routineId && isFocused) {
      (async () => {
        try {
          const res = await db.getFirstAsync<{ name: string }>(
            "SELECT name FROM routines WHERE id = ?",
            [Number(routineId)],
          );
          if (res) setName(res.name);

          const exes = await db.getAllAsync<Exercise>(
            `SELECT e.* FROM exercises e 
              JOIN routine_exercises re ON e.id = re.exercise_id 
              WHERE re.routine_id = ? 
              ORDER BY re.index_order ASC`,
            [Number(routineId)],
          );
          setSelectedExercises(exes);
        } catch (error) {
          console.error("Erro ao carregar rotina para edição:", error);
        }
      })();
    }
  }, [routineId, mode, db, isFocused]);

  // 3. BUSCAR EXERCÍCIOS PARA O MODAL
  const fetchModalExercises = useCallback(async () => {
    try {
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      let params: any[] = [];
      if (search.trim()) {
        query += " AND name LIKE ?";
        params.push(`%${search.trim()}%`);
      }
      query += " ORDER BY name ASC";
      const rows = await db.getAllAsync<Exercise>(query, params);
      setDbExercises(rows);
    } catch (error) {
      console.error("Erro modal:", error);
    }
  }, [search, db]);

  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises]);

  // 4. FUNÇÃO SALVAR
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Aviso", "Dá um nome à tua rotina.");
    if (selectedExercises.length === 0)
      return Alert.alert("Aviso", "Adiciona exercícios.");

    try {
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      const userId = userRow?.id || 1;

      let currentRoutineId: number;

      if (mode === "edit" && routineId) {
        currentRoutineId = Number(routineId);
        await db.runAsync("UPDATE routines SET name = ? WHERE id = ?", [
          name,
          currentRoutineId,
        ]);
        await db.runAsync(
          "DELETE FROM routine_exercises WHERE routine_id = ?",
          [currentRoutineId],
        );
      } else {
        const result = await db.runAsync(
          "INSERT INTO routines (name, user_id) VALUES (?, ?)",
          [name, userId],
        );
        currentRoutineId = result.lastInsertRowId;
      }

      for (let i = 0; i < selectedExercises.length; i++) {
        await db.runAsync(
          "INSERT INTO routine_exercises (exercise_id, routine_id, index_order) VALUES (?, ?, ?)",
          [selectedExercises[i].id, currentRoutineId, i],
        );
      }

      Alert.alert("Sucesso", "Rotina guardada!");

      // LIMPEZA FINAL ANTES DE SAIR
      setName("");
      setSelectedExercises([]);

      router.replace("/workout");
    } catch (e: any) {
      console.error("ERRO AO GRAVAR:", e);
      Alert.alert("Erro", "Falha ao gravar na base de dados.");
    }
  };

  const toggleSelection = (ex: Exercise) => {
    const exists = selectedExercises.find((e) => e.id === ex.id);
    if (exists)
      setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id));
    else setSelectedExercises((prev) => [...prev, ex]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.replace("/workout")}>
          <ChevronLeft size={28} color="#E31C25" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black uppercase italic">
          {mode === "edit" ? "Edit Routine" : "New Routine"}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-[#E31C25] text-lg font-black uppercase italic">
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-5 mt-6" showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Routine Name"
          placeholderTextColor="#52525b"
          value={name}
          onChangeText={setName}
          className="text-white text-3xl font-black italic border-b border-zinc-800 pb-3 uppercase"
        />

        <View className="mt-8">
          <Text className="text-zinc-500 font-black uppercase mb-4 tracking-widest text-xs italic">
            Exercises ({selectedExercises.length})
          </Text>

          {selectedExercises.map((ex) => (
            <View
              key={ex.id}
              className="flex-row items-center bg-zinc-900/50 p-4 rounded-2xl mb-3 border border-zinc-800"
            >
              <GripVertical size={20} color="#3f3f46" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold uppercase italic">
                  {ex.name}
                </Text>
                <Text className="text-zinc-500 text-xs uppercase">
                  {ex.muscle_group}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleSelection(ex)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="flex-row items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 py-6 rounded-2xl mt-2"
          >
            <Plus size={22} color="#E31C25" />
            <Text className="text-zinc-400 font-black ml-2 text-lg uppercase italic">
              Add Exercises
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE SELEÇÃO */}
      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView className="flex-1 bg-[#000]">
          <View className="flex-1 px-6 pt-4">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="white" size={26} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-black uppercase italic">
                Select Exercises
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text className="text-[#E31C25] text-lg font-black uppercase italic">
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 h-12 mb-6 border border-zinc-800">
              <Search color="#52525b" size={20} className="mr-3" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search exercise..."
                placeholderTextColor="#52525b"
                className="flex-1 text-white font-bold italic"
              />
            </View>

            <FlatList
              data={dbExercises}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.some(
                  (e) => e.id === item.id,
                );
                return (
                  <TouchableOpacity
                    onPress={() => toggleSelection(item)}
                    className="flex-row items-center py-4 border-b border-zinc-900"
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-base font-black italic uppercase ${isSelected ? "text-[#E31C25]" : "text-white"}`}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-zinc-500 text-xs uppercase italic">
                        {item.muscle_group}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Check color="#E31C25" size={22} />
                    ) : (
                      <Plus color="#3f3f46" size={22} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
