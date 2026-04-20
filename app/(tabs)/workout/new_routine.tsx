import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image"; // Importar para as imagens
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  Plus,
  Search,
  Target,
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
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IMAGE_MAP } from "../../../constants/exercise_images";

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
  const isFocused = useIsFocused();
  const { routineId: rawId, mode: rawMode } = useLocalSearchParams();

  const routineId = Array.isArray(rawId) ? rawId[0] : rawId;
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

  const [name, setName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");

  // Estados para filtros (Igual ao Explore)
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  useEffect(() => {
    if (isFocused && mode !== "edit") {
      setName("");
      setSelectedExercises([]);
    }
  }, [isFocused, mode]);

  useEffect(() => {
    if (mode === "edit" && routineId && isFocused) {
      (async () => {
        try {
          const email = await AsyncStorage.getItem("userEmail");
          const userRow = await db.getFirstAsync<{ id: number }>(
            "SELECT id FROM users WHERE email = ?",
            [email],
          );

          // Verificação de segurança para o TypeScript
          if (!userRow) return;

          const currentUserId = userRow.id; // Criamos a variável aqui

          const res = await db.getFirstAsync<{ name: string }>(
            "SELECT name FROM routines WHERE id = ? AND user_id = ?",
            [Number(routineId), currentUserId], // Agora o TS sabe que currentUserId é um número
          );

          if (res) {
            setName(res.name);
            // O aviso 'res' is assigned a value but never used desaparece aqui
          }

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

  const fetchModalExercises = useCallback(async () => {
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
      const rows = await db.getAllAsync<Exercise>(query, params);
      setDbExercises(rows);

      // Carregar opções de filtro se ainda não existirem
      if (muscleOptions.length === 0) {
        const muscles = await db.getAllAsync<{ muscle_group: string }>(
          "SELECT DISTINCT muscle_group FROM exercises WHERE muscle_group IS NOT NULL ORDER BY muscle_group ASC",
        );
        setMuscleOptions(muscles.map((m) => m.muscle_group));

        const equipment = await db.getAllAsync<{ equipment: string }>(
          "SELECT DISTINCT equipment FROM exercises WHERE equipment IS NOT NULL ORDER BY equipment ASC",
        );
        setEquipmentOptions(equipment.map((e) => e.equipment));
      }
    } catch (error) {
      console.error("Erro modal:", error);
    }
  }, [search, selectedMuscle, selectedEquipment, db]);

  // Atualiza o useEffect para observar os novos filtros
  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Aviso", "Dá um nome à tua rotina.");
    if (selectedExercises.length === 0)
      return Alert.alert("Aviso", "Adiciona exercícios.");

    try {
      // 1. Obter o email e depois o ID do utilizador
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      // 2. Verificação crucial para o TypeScript e segurança
      if (!userRow) {
        return Alert.alert(
          "Erro",
          "Utilizador não encontrado. Faz login novamente.",
        );
      }

      const currentUserId = userRow.id; // Agora temos o ID garantido como número
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
        // 3. USAR O ID QUE BUSCÁMOS ACIMA
        const result = await db.runAsync(
          "INSERT INTO routines (name, user_id) VALUES (?, ?)",
          [name, currentUserId], // Mudado de userId para currentUserId
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

          {selectedExercises.map((ex) => {
            const imageKey = ex.image?.trim();
            const imageSource = imageKey ? IMAGE_MAP[imageKey] : null;

            return (
              <View
                key={ex.id}
                className="flex-row items-center bg-zinc-900/50 p-4 rounded-2xl mb-3 border border-zinc-800"
              >
                <GripVertical size={20} color="#3f3f46" />

                {/* Imagem do Exercício na lista da Rotina */}
                <View className="w-12 h-12 rounded-xl bg-zinc-900 items-center justify-center ml-2 border border-zinc-800 overflow-hidden">
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Target size={20} color="#E31C25" />
                  )}
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold uppercase italic">
                    {ex.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs uppercase italic">
                    {ex.muscle_group}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => toggleSelection(ex)}>
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })}

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

      {/* MODAL DE SELEÇÃO - ESTILO EXPLORE/HEVY */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
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

            {/* FILTROS PADRONIZADOS */}
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
              data={dbExercises}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.some(
                  (e) => e.id === item.id,
                );
                const imageKey = item.image?.trim();
                const imageSource = imageKey ? IMAGE_MAP[imageKey] : null;

                return (
                  <View className="flex-row items-center py-4 border-b border-zinc-800/50">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center"
                      activeOpacity={0.7}
                      onPress={() => {
                        setIsModalVisible(false);
                        router.push({
                          pathname: "/workout/[id]",
                          params: { id: item.id, from: "new_routine" },
                        });
                      }}
                    >
                      {/* FOTO PADRONIZADA EXPLORE */}
                      <View className="w-16 h-16 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
                        {imageSource ? (
                          <Image
                            source={imageSource}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Target size={26} color="#E31C25" />
                        )}
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

                    {/* BOLA DE SELEÇÃO */}
                    <TouchableOpacity
                      onPress={() => toggleSelection(item)}
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
            {/* MODAL DE SELEÇÃO DE FILTRO */}
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
                    {/* ALTURA CORRIGIDA: h-[60%] em vez de min-h */}
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
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
