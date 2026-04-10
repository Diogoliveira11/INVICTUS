import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite"; // 1. Importar o contexto
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
  Image,
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

const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

export default function NewRoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext(); // 2. Instância central da BD
  const { routineId: rawId, mode: rawMode } = useLocalSearchParams();

  const routineId = Array.isArray(rawId) ? rawId[0] : rawId;
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

  const [name, setName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");

  // 1. CARREGAR DADOS DA ROTINA (SE EDIÇÃO) - Sem openDatabaseAsync
  useEffect(() => {
    if (mode === "edit" && routineId) {
      (async () => {
        try {
          const res = await db.getFirstAsync<{ name: string }>(
            "SELECT name FROM routines WHERE id = ?",
            [Number(routineId)],
          );
          if (res) setName(res.name);

          const exes = await db.getAllAsync<Exercise>(
            `SELECT e.* FROM exercises e 
             JOIN routine_exercises re ON e.id = re.exerciseid 
             WHERE re.routineid = ? 
             ORDER BY re.index_order ASC`,
            [Number(routineId)],
          );
          setSelectedExercises(exes);
        } catch (error) {
          console.error("Erro ao carregar rotina para edição:", error);
        }
      })();
    }
  }, [routineId, mode, db]);

  // 2. BUSCAR EXERCÍCIOS PARA O MODAL - Sem openDatabaseAsync
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
      console.error("Erro ao buscar exercícios do modal:", error);
    }
  }, [search, db]);

  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises]);

  // 3. SALVAR TUDO - Sem openDatabaseAsync e com tratamento de erros
  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Aviso", "Dá um nome à tua rotina.");
    if (selectedExercises.length === 0)
      return Alert.alert("Aviso", "Adiciona pelo menos um exercício.");

    try {
      if (mode === "edit" && routineId) {
        const rId = Number(routineId);
        await db.runAsync("UPDATE routines SET name = ? WHERE id = ?", [
          name,
          rId,
        ]);
        await db.runAsync("DELETE FROM routine_exercises WHERE routineid = ?", [
          rId,
        ]);

        for (let i = 0; i < selectedExercises.length; i++) {
          await db.runAsync(
            "INSERT INTO routine_exercises (routinesid, exerciseid, index_order) VALUES (?, ?, ?)",
            [rId, selectedExercises[i].id, i],
          );
        }
      } else {
        const res = await db.runAsync(
          "INSERT INTO routines (name) VALUES (?)",
          [name, new Date().toISOString()],
        );
        const newRoutineId = res.lastInsertRowId;

        for (let i = 0; i < selectedExercises.length; i++) {
          await db.runAsync(
            "INSERT INTO routine_exercises (routine_id, exercise_id, order_index) VALUES (?, ?, ?)",
            [newRoutineId, selectedExercises[i].id, i],
          );
        }
      }

      Alert.alert("Sucesso", "Rotina guardada!");
      router.push("/workout");
    } catch (e) {
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

      {/* HEADER PRINCIPAL */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#E31C25" />
        </TouchableOpacity>
        <Text className="text-white text-[17px] font-bold">
          {mode === "edit" ? "Edit Routine" : "New Routine"}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-[#E31C25] text-lg font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-5 mt-6" showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Routine Name"
          placeholderTextColor="#52525b"
          value={name}
          onChangeText={setName}
          className="text-white text-3xl font-bold border-b border-zinc-800 pb-3"
        />

        <View className="mt-8">
          <Text className="text-zinc-500 font-bold uppercase mb-4 tracking-widest text-xs">
            Exercises
          </Text>
          {selectedExercises.map((ex) => (
            <View
              key={ex.id}
              className="flex-row items-center bg-[#1c1c1e] p-4 rounded-2xl mb-3 border border-zinc-800"
            >
              <GripVertical size={20} color="#3f3f46" />
              <View className="w-10 h-10 rounded-full bg-zinc-800 ml-3 overflow-hidden border border-zinc-700">
                {ex.image ? (
                  <Image
                    source={IMAGE_MAP[ex.image]}
                    className="w-full h-full"
                  />
                ) : null}
              </View>
              <Text className="text-white flex-1 ml-3 font-semibold">
                {ex.name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedExercises((prev) =>
                    prev.filter((e) => e.id !== ex.id),
                  )
                }
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="flex-row items-center justify-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 py-5 rounded-2xl mt-2"
          >
            <Plus size={22} color="#E31C25" strokeWidth={3} />
            <Text className="text-zinc-400 font-bold ml-2 text-lg">
              Add Exercises
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE SELEÇÃO */}
      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView className="flex-1 bg-[#121417]">
          <View className="flex-1 px-6 pt-4">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="white" size={26} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold">
                Exercises
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.some(
                  (e) => e.id === item.id,
                );
                return (
                  <TouchableOpacity
                    onPress={() => toggleSelection(item)}
                    className="flex-row items-center py-4 border-b border-zinc-800/50"
                  >
                    <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center mr-4 overflow-hidden border border-zinc-700">
                      {item.image ? (
                        <Image
                          source={IMAGE_MAP[item.image]}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-[16px] font-medium ${isSelected ? "text-[#E31C25]" : "text-white"}`}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        {item.muscle_group} • {item.equipment}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Check color="#E31C25" size={22} />
                    ) : (
                      <Plus color="#52525b" size={22} />
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
