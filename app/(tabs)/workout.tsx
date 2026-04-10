import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite"; // 1. Importar o contexto
import {
  Edit3,
  FolderPlus,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Routine = {
  id: number;
  name: string;
  exercise_list: string | null;
};

export default function WorkoutTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext(); // 2. Instância única da BD

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(
    null,
  );

  const loadRoutines = useCallback(async () => {
    try {
      await db.execAsync("PRAGMA foreign_keys = ON;");

      const query = `
            SELECT r.id, r.name, GROUP_CONCAT(e.name, ', ') AS exercise_list
            FROM routines r
            LEFT JOIN routine_exercises re ON r.id = re.routine_id
            LEFT JOIN exercises e ON re.exercise_id = e.id
            GROUP BY r.id
            ORDER BY r.id DESC
        `;

      const result = await db.getAllAsync<Routine>(query);
      setRoutines(result);
    } catch (e) {
      console.error("Erro ao carregar rotinas:", e);
    }
  }, [db]);

  const openOptions = (id: number) => {
    setSelectedRoutineId(id);
    setIsOptionsVisible(true);
  };

  // 4. ELIMINAR ROTINA - Sem openDatabaseAsync
  const confirmDelete = async () => {
    if (!selectedRoutineId) return;

    Alert.alert(
      "Delete Routine",
      "Are you sure you want to delete this routine?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // O ON DELETE CASCADE na tabela trata as ligações automaticamente
              await db.runAsync("DELETE FROM routines WHERE id = ?", [
                selectedRoutineId,
              ]);
              setIsOptionsVisible(false);
              loadRoutines();
            } catch (e) {
              console.error("Erro ao apagar:", e);
              Alert.alert("Error", "Could not delete routine.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-4xl font-black italic mt-4 uppercase">
          Workout
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/workout/log_workout")}
          className="flex-row items-center bg-zinc-900/30 py-5 px-5 rounded-[25px] mt-8 border border-zinc-800"
        >
          <Plus size={24} color="#E31C25" strokeWidth={4} />
          <Text className="text-[#E31C25] font-black ml-4 text-lg uppercase italic">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mt-12">
          <Text className="text-white text-2xl font-black italic uppercase">
            Routines
          </Text>
          <TouchableOpacity>
            <FolderPlus size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mt-6">
          <TouchableOpacity
            onPress={() => router.push("./workout/new_routine")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-4 rounded-2xl"
          >
            <List size={20} color="white" />
            <Text className="text-white font-black ml-2 uppercase italic">
              New Routine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/workout/explore")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-4 rounded-2xl"
          >
            <Search size={20} color="white" />
            <Text className="text-white font-black ml-2 uppercase italic">
              Explore
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-10 mb-20 gap-y-5">
          {routines.map((item) => (
            <View
              key={item.id}
              className="bg-[#121212] p-6 rounded-[35px] border border-zinc-900"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white text-xl font-black italic uppercase">
                    {item.name}
                  </Text>
                  <Text
                    className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-tight"
                    numberOfLines={1}
                  >
                    {item.exercise_list || "No exercises"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => openOptions(item.id)}
                  className="p-1"
                >
                  <MoreHorizontal size={26} color="#52525b" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/workout/log_workout",
                    params: { routineId: item.id },
                  })
                }
                className="bg-[#E31C25] w-full py-4 rounded-[20px] mt-6 items-center shadow-lg"
              >
                <Text className="text-white font-black text-lg uppercase italic">
                  Start Routine
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE OPÇÕES */}
      <Modal
        visible={isOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOptionsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOptionsVisible(false)}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-[#121212] p-8 rounded-t-[45px] border-t border-zinc-800">
            <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-8" />

            <TouchableOpacity
              onPress={() => {
                setIsOptionsVisible(false);
                router.push({
                  pathname: "/workout/new_routine",
                  params: { routineId: selectedRoutineId, mode: "edit" },
                });
              }}
              className="flex-row items-center bg-zinc-900/50 p-6 rounded-3xl mb-4 border border-zinc-800"
            >
              <Edit3 size={22} color="white" />
              <Text className="text-white text-lg font-black ml-4 uppercase italic">
                Edit Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmDelete}
              className="flex-row items-center bg-[#E31C25]/10 p-6 rounded-3xl mb-10 border border-[#E31C25]/20"
            >
              <Trash2 size={22} color="#E31C25" />
              <Text className="text-[#E31C25] text-lg font-black ml-4 uppercase italic">
                Delete Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsOptionsVisible(false)}
              className="bg-zinc-800/40 py-5 rounded-3xl mb-6"
            >
              <Text className="text-zinc-500 text-base font-black text-center uppercase">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
