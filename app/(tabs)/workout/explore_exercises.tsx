import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

// @ts-ignore
import InvictusLogo from "../../../assets/images/logo_invictus.jpeg";
import { IMAGE_MAP } from "../../../constants/exercise_images";

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

export default function ExploreExercisesPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const isFocused = useIsFocused();

  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  const fetchFilterOptions = useCallback(async () => {
    try {
      const muscles = await db.getAllAsync<{ muscle_group: string }>(
        "SELECT DISTINCT muscle_group FROM exercises WHERE muscle_group IS NOT NULL ORDER BY muscle_group ASC",
      );
      setMuscleOptions(muscles.map((m) => m.muscle_group));

      const equipment = await db.getAllAsync<{ equipment: string }>(
        "SELECT DISTINCT equipment FROM exercises WHERE equipment IS NOT NULL ORDER BY equipment ASC",
      );
      setEquipmentOptions(equipment.map((e) => e.equipment));
    } catch (e) {
      console.error("Erro ao carregar filtros:", e);
    }
  }, [db]);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      const params: any[] = [];

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
      const allRows = await db.getAllAsync<Exercise>(query, params);
      setExercises(allRows);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoading(false);
    }
  }, [db, search, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    if (isFocused) {
      fetchFilterOptions();
      fetchExercises();
    }
  }, [isFocused, fetchFilterOptions, fetchExercises]);

  const selectFilterOption = (option: string | null) => {
    if (modalType === "muscle") setSelectedMuscle(option);
    else setSelectedEquipment(option);
    setIsModalVisible(false);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const imageKey = item.image?.trim();

    // Verificamos se é uma imagem personalizada (caminho local ou URL)
    const isCustomImage =
      imageKey?.startsWith("file://") || imageKey?.startsWith("http");

    // Lógica de prioridade:
    // 1. Imagem de ficheiro/web
    // 2. Imagem do projeto (IMAGE_MAP)
    // 3. Logo Invictus (Fallback para exercícios sem foto)
    const imageSource = isCustomImage
      ? { uri: imageKey }
      : imageKey && IMAGE_MAP[imageKey]
        ? IMAGE_MAP[imageKey]
        : InvictusLogo;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center py-4 border-b border-zinc-800/50"
        onPress={() =>
          router.push({
            pathname: "/workout/[id]",
            params: { id: item.id, from: "explore" },
          })
        }
      >
        <View className="w-16 h-16 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
          {/* Agora imageSource nunca será nulo, pois tem o logo como padrão final */}
          <Image
            source={imageSource}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain" // "contain" é melhor para logos para não cortar o desenho
            cachePolicy="memory-disk"
          />
        </View>

        <View className="flex-1">
          <Text className="text-white text-[16px] font-bold uppercase italic">
            {item.name}
          </Text>
          <Text className="text-zinc-500 text-xs mt-1 uppercase font-medium">
            {item.muscle_group} • {item.equipment}
          </Text>
        </View>

        <ChevronRight color="#3f3f46" size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#000]">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 px-5 pt-4">
        {/* Header Corrigido */}
        <View className="flex-row items-center justify-between py-4 border-b border-zinc-900 mb-4">
          <TouchableOpacity onPress={() => router.replace("/workout")}>
            <ChevronLeft size={28} color="#E31C25" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-black uppercase italic">
            Explore
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/createexercise")}
            className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 flex-row items-center"
          >
            <Plus size={16} color="#E31C25" />
            <Text className="text-white font-black uppercase italic text-xs ml-1">
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-zinc-900/50 rounded-2xl px-4 h-14 mb-4 border border-zinc-800">
          <Search color="#52525b" size={20} className="mr-3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#52525b"
            className="flex-1 text-white text-base font-bold italic"
            selectionColor="#E31C25"
          />
        </View>

        {/* Filters */}
        <View className="flex-row justify-between mb-6 gap-x-3">
          <TouchableOpacity
            onPress={() => {
              setModalType("equipment");
              setIsModalVisible(true);
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
              setIsModalVisible(true);
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

        {loading ? (
          <ActivityIndicator color="#E31C25" size="large" className="mt-20" />
        ) : (
          <FlatList
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text className="text-zinc-600 text-center mt-20 uppercase font-bold italic">
                No exercises found
              </Text>
            }
          />
        )}
      </View>

      {/* Modal de Filtros */}
      {/* Modal de Filtros */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/80 justify-end">
            <TouchableWithoutFeedback>
              {/* Alterado: removido min-h e adicionada uma altura fixa ou máxima baseada no ecrã */}
              <View className="bg-[#121212] rounded-t-[40px] h-[60%] p-8 border-t border-zinc-800">
                {/* Barra cinzenta de "puxar" */}
                <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-6" />

                <Text className="text-white text-xl font-black uppercase italic mb-6">
                  {modalType === "muscle" ? "Muscles" : "Equipment"}
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  // Adicionado para garantir que o scroll funciona bem dentro do limite
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  <TouchableOpacity
                    onPress={() => selectFilterOption(null)}
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
                      onPress={() => selectFilterOption(opt)}
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
  );
}
