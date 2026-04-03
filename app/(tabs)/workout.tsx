import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
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

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(
    null,
  );

  const loadRoutines = async () => {
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");

      await db.execAsync(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS routines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS routine_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id INTEGER,
          exercise_id INTEGER,
          FOREIGN KEY (routine_id) REFERENCES routines (id)
        );
      `);

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
      console.error("Erro na leitura:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, []),
  );

  const openOptions = (id: number) => {
    setSelectedRoutineId(id);
    setIsOptionsVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoutineId) return;
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      await db.runAsync("DELETE FROM routine_exercises WHERE routine_id = ?", [
        selectedRoutineId,
      ]);
      await db.runAsync("DELETE FROM routines WHERE id = ?", [
        selectedRoutineId,
      ]);
      setIsOptionsVisible(false);
      loadRoutines();
    } catch (e) {
      console.error("Erro ao apagar:", e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-4">Workout</Text>

        {/* Start Empty Workout - Ajustado para Vermelho conforme pedido */}
        <TouchableOpacity
          onPress={() => router.push("/workout/log_workout")}
          className="flex-row items-center bg-[#1c1c1e] py-4 px-4 rounded-xl mt-6 border border-zinc-800/50"
        >
          <Plus size={22} color="#E31C25" strokeWidth={3} />
          <Text className="text-[#E31C25] font-bold ml-3 text-lg">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mt-10">
          <Text className="text-white text-2xl font-bold">Routines</Text>
          <TouchableOpacity>
            <FolderPlus size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={() => router.push("/workout/new-routine")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-3 rounded-full"
          >
            <List size={18} color="white" />
            <Text className="text-white font-bold ml-2">New Routine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/workout/explore")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-3 rounded-full"
          >
            <Search size={18} color="white" />
            <Text className="text-white font-bold ml-2">Explore</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 mb-10 gap-y-4">
          {routines.map((item) => (
            <View
              key={item.id}
              className="bg-[#1c1c1e] p-5 rounded-3xl border border-zinc-800"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold uppercase">
                    {item.name}
                  </Text>
                  <Text
                    className="text-zinc-500 text-sm mt-1"
                    numberOfLines={2}
                  >
                    {item.exercise_list || "No exercises added"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openOptions(item.id)}>
                  <MoreHorizontal size={24} color="#71717a" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/workout/log_workout",
                    params: { routineId: item.id },
                  })
                }
                className="bg-[#E31C25] w-full py-3 rounded-2xl mt-5 items-center"
              >
                <Text className="text-white font-black text-lg">
                  Start Routine
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE OPÇÕES ESTILIZADO (TEMA ESCURO + VERMELHO) */}
      <Modal
        visible={isOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOptionsVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOptionsVisible(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)" }}
          className="justify-end"
        >
          <View className="bg-[#1c1c1e] p-6 rounded-t-[40px] border-t border-zinc-800">
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mb-8" />

            <Text className="text-zinc-500 text-center text-xs font-bold uppercase tracking-widest mb-6">
              Routine Options
            </Text>

            <TouchableOpacity
              onPress={() => {
                setIsOptionsVisible(false);
                router.push({
                  pathname: "/workout/new-routine",
                  params: { routineId: selectedRoutineId, mode: "edit" },
                });
              }}
              className="flex-row items-center bg-zinc-900/50 p-5 rounded-2xl mb-3 border border-zinc-800"
            >
              <Edit3 size={20} color="white" />
              <Text className="text-white text-base font-bold ml-4">
                Edit Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmDelete}
              className="flex-row items-center bg-[#E31C25]/10 p-5 rounded-2xl mb-8 border border-[#E31C25]/20"
            >
              <Trash2 size={20} color="#E31C25" />
              <Text className="text-[#E31C25] text-base font-bold ml-4">
                Delete Routine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsOptionsVisible(false)}
              className="bg-zinc-800/50 py-4 rounded-2xl mb-4"
            >
              <Text className="text-zinc-400 text-base font-bold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
