import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Search,
  Target,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

// Ajuste nos caminhos se o arquivo estiver em app/workout/explore.tsx
const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

const EQUIPMENT_ICONS: { [key: string]: any } = {
  Barbell: <Dumbbell size={24} color="white" />,
  Dumbbell: <Dumbbell size={20} color="white" />,
  Machine: (
    <View
      style={{
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 4,
      }}
    />
  ),
};

// Singleton para o banco de dados
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

export default function ExploreExercisesPage() {
  const router = useRouter();
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

  const loadDatabase = useCallback(async () => {
    if (dbInstance) return dbInstance;
    if (dbInitPromise) return dbInitPromise;

    dbInitPromise = (async () => {
      try {
        const dbName = "inicializedatabase.sqlite";
        // Ajuste no require do banco se necessário
        const dbFile = require("../../../src/inicializedatabase.sqlite");
        const dbUri = Asset.fromModule(dbFile).uri;
        const fs: any = FileSystem;
        const dbInternalPath = `${fs.documentDirectory}SQLite/${dbName}`;

        const sqliteDir = `${fs.documentDirectory}SQLite`;
        const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(sqliteDir);
        }

        const fileInfo = await FileSystem.getInfoAsync(dbInternalPath);
        if (!fileInfo.exists) {
          await FileSystem.downloadAsync(dbUri, dbInternalPath);
        }

        dbInstance = await SQLite.openDatabaseAsync(dbName);
        return dbInstance;
      } catch (e) {
        console.error("Erro ao carregar BD Explore:", e);
        dbInitPromise = null;
        return null;
      }
    })();

    return dbInitPromise;
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    const db = await loadDatabase();
    if (!db) return;
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
      console.error("Erro ao buscar filtros Explore:", e);
    }
  }, [loadDatabase]);

  const fetchExercises = useCallback(async () => {
    try {
      const db = await loadDatabase();
      if (!db) return;

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
      const allRows = await db.getAllAsync<Exercise>(query, params);
      setExercises(allRows);
      setLoading(false);
    } catch (error) {
      console.error("Erro na Query Explore:", error);
    }
  }, [search, selectedMuscle, selectedEquipment, loadDatabase]);

  useEffect(() => {
    fetchFilterOptions();
    fetchExercises();
  }, [fetchFilterOptions, fetchExercises]);

  const openFilterModal = (type: "muscle" | "equipment") => {
    setModalType(type);
    setIsModalVisible(true);
  };

  const selectFilterOption = (option: string | null) => {
    modalType === "muscle"
      ? setSelectedMuscle(option)
      : setSelectedEquipment(option);
    setIsModalVisible(false);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const imageSource = item.image ? IMAGE_MAP[item.image] : null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center py-4 border-b border-zinc-800/50"
        onPress={() => router.push(`/exercises/${item.id}`)}
      >
        <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center mr-4 overflow-hidden border border-zinc-700">
          {imageSource ? (
            <Image
              source={imageSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-zinc-500 text-[10px] font-bold">IMG</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-white text-[16px] font-medium leading-tight">
            {item.name}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            {item.muscle_group} • {item.equipment}
          </Text>
        </View>

        <ChevronRight color="#52525b" size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 px-6 pt-4">
        {/* Header - Voltar para o Workout */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/workout")}
            className="p-2 -ml-2"
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Explore</Text>
          <View className="w-10" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2D2F33] rounded-xl px-4 h-12 mb-4">
          <Search color="#9ca3af" size={20} className="mr-3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search all exercises"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-white text-base"
            selectionColor="#E31C25"
          />
        </View>

        {/* Filtros */}
        <View className="flex-row justify-between mb-8 gap-x-4">
          <TouchableOpacity
            onPress={() => openFilterModal("equipment")}
            className={`flex-1 flex-row items-center justify-center rounded-full py-3 px-4 ${selectedEquipment ? "bg-[#E31C25]" : "bg-[#2D2F33]"}`}
          >
            <Text
              numberOfLines={1}
              className="text-white text-[13px] font-medium mr-2"
            >
              {selectedEquipment || "Equipment"}
            </Text>
            <ChevronDown
              color={selectedEquipment ? "white" : "#9ca3af"}
              size={18}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openFilterModal("muscle")}
            className={`flex-1 flex-row items-center justify-center rounded-full py-3 px-4 ${selectedMuscle ? "bg-[#E31C25]" : "bg-[#2D2F33]"}`}
          >
            <Text
              numberOfLines={1}
              className="text-white text-[13px] font-medium mr-2"
            >
              {selectedMuscle || "Muscles"}
            </Text>
            <ChevronDown
              color={selectedMuscle ? "white" : "#9ca3af"}
              size={18}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#E31C25" />
          </View>
        ) : (
          <FlatList
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-20">
                <Text className="text-zinc-500">No exercises found.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Modal de Filtros (Bottom Sheet) */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1C1C1E] rounded-t-3xl min-h-[50%] p-6 border-t border-zinc-800">
                <View className="flex-row items-center justify-between mb-8">
                  <Text className="text-white text-xl font-bold">
                    {modalType === "muscle" ? "Muscles" : "Equipment"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    className="bg-zinc-800 p-1.5 rounded-full"
                  >
                    <X color="#9ca3af" size={20} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => selectFilterOption(null)}
                    className="flex-row items-center py-4 border-b border-zinc-800/60"
                  >
                    <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center mr-4 border border-zinc-700">
                      <View className="w-6 h-6 border-2 border-white/50 rounded-sm" />
                    </View>
                    <Text className="text-white text-lg flex-1 font-medium">
                      All {modalType === "muscle" ? "Muscles" : "Equipment"}
                    </Text>
                    {(modalType === "muscle"
                      ? selectedMuscle
                      : selectedEquipment) === null && (
                      <Check color="#E31C25" size={22} />
                    )}
                  </TouchableOpacity>
                  {(modalType === "muscle"
                    ? muscleOptions
                    : equipmentOptions
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => selectFilterOption(opt)}
                      className="flex-row items-center py-4 border-b border-zinc-800/60"
                    >
                      <View className="w-12 h-12 rounded-full bg-black items-center justify-center mr-4 overflow-hidden border border-zinc-700">
                        {modalType === "equipment" && EQUIPMENT_ICONS[opt] ? (
                          EQUIPMENT_ICONS[opt]
                        ) : modalType === "muscle" ? (
                          <Target size={24} color="white" />
                        ) : (
                          <Dumbbell size={24} color="white" />
                        )}
                      </View>
                      <Text className="text-white text-lg flex-1 font-medium">
                        {opt}
                      </Text>
                      {(modalType === "muscle"
                        ? selectedMuscle
                        : selectedEquipment) === opt && (
                        <Check color="#E31C25" size={22} />
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
