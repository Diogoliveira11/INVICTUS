import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  Check,
  ChevronDown,
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

// --- MAPEAMENTO DAS TUAS IMAGENS LOCAIS ---
const FILTER_ICONS: { [key: string]: any } = {
  // Pasta: equipment
  ALL: require("../../../assets/equipment/equipment_all.png"),
  BARBELL: require("../../../assets/equipment/equipment_barbell.jpg"),
  CABLE: require("../../../assets/equipment/equipment_cable.jpg"),
  DUMBBELL: require("../../../assets/equipment/equipment_dumbbell.avif"),
  MACHINE: require("../../../assets/equipment/equipment_machine.jpg"),
  OTHER: require("../../../assets/equipment/equipment_other.png"),

  // Pasta: all_muscles
  ABDUCTORS: require("../../../assets/all_muscles/abductors.png"),
  ABS: require("../../../assets/all_muscles/abs.png"),
  ADDUCTORS: require("../../../assets/all_muscles/adductors.png"),
  BACK: require("../../../assets/all_muscles/back.png"),
  BICEPS: require("../../../assets/all_muscles/biceps.png"),
  CALVES: require("../../../assets/all_muscles/calves.png"),
  CARDIO: require("../../../assets/all_muscles/cardio.png"),
  CHEST: require("../../../assets/all_muscles/chest.png"),
  FOREARMS: require("../../../assets/all_muscles/forearms.png"),
  GLUTES: require("../../../assets/all_muscles/glutes.png"),
  HAMSTRINGS: require("../../../assets/all_muscles/hamstrings.png"),
  LATS: require("../../../assets/all_muscles/lats.png"),
  QUADRICEPS: require("../../../assets/all_muscles/quadriceps.png"),
  SHOULDERS: require("../../../assets/all_muscles/shoulders.png"),
  TRAPS: require("../../../assets/all_muscles/traps.png"),
  TRICEPS: require("../../../assets/all_muscles/triceps.png"),
};

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
    const isCustomImage =
      imageKey?.startsWith("file://") || imageKey?.startsWith("http");

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
        <View className="w-16 h-16 rounded-2xl bg-zinc-900 mr-4 border border-zinc-800 overflow-hidden">
          <Image
            source={imageSource}
            style={{ width: "100%", height: "100%" }}
            contentFit={imageSource === InvictusLogo ? "contain" : "cover"}
            cachePolicy="memory-disk"
          />
        </View>

        <View className="flex-1">
          <Text className="text-white text-[16px] font-bold uppercase ">
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
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() => router.replace("/workout")}
          className="p-2"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase "
        >
          Explore
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/createexercise")}
          className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 flex-row items-center"
        >
          <Plus size={16} color="#E31C25" />
          <Text className="text-white font-black uppercase  text-xs ml-1">
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-5 pt-4">
        <View className="flex-row items-center bg-zinc-900/50 rounded-2xl px-4 h-14 mb-4 border border-zinc-800">
          <Search color="#52525b" size={20} className="mr-3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#52525b"
            className="flex-1 text-white text-base font-bold "
            selectionColor="#E31C25"
          />
        </View>

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
              className="text-white text-[10px] font-black uppercase  mr-2 flex-shrink"
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
              className="text-white text-[10px] font-black uppercase  mr-2 flex-shrink"
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
              <Text className="text-zinc-600 text-center mt-20 uppercase font-bold ">
                No exercises found
              </Text>
            }
          />
        )}
      </View>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/80 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#121212] rounded-t-[40px] h-[60%] p-8 border-t border-zinc-800">
                <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-6" />
                <Text className="text-white text-xl font-black uppercase  mb-6">
                  {modalType === "muscle" ? "Muscles" : "Equipment"}
                </Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  <TouchableOpacity
                    onPress={() => selectFilterOption(null)}
                    className="flex-row items-center py-4 border-b border-zinc-900"
                  >
                    {/* Tamanho aumentado para w-16 h-16 e margem ajustada */}
                    <View className="w-16 h-16 mr-6 bg-white rounded-full items-center justify-center overflow-hidden border border-zinc-800">
                      <Image
                        source={FILTER_ICONS["ALL"]}
                        style={{ width: "100%", height: "100%" }}
                        // ALTERADO PARA COVER: Preenche totalmente o círculo
                        contentFit="cover"
                      />
                    </View>
                    <Text className="text-white text-lg flex-1 font-bold  uppercase">
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
                      {/* Tamanho aumentado para w-16 h-16 e margem ajustada */}
                      <View className="w-16 h-16 mr-6 bg-white rounded-full items-center justify-center overflow-hidden border border-zinc-800">
                        {FILTER_ICONS[opt.toUpperCase()] ? (
                          <Image
                            source={FILTER_ICONS[opt.toUpperCase()]}
                            style={{ width: "100%", height: "100%" }}
                            // ALTERADO PARA COVER: Preenche totalmente o círculo
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-full h-full bg-zinc-800" />
                        )}
                      </View>

                      <Text className="text-white text-lg flex-1 font-bold  uppercase">
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
