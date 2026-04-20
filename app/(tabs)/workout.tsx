import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Edit3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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
  const db = useSQLiteContext();
  const isFocused = useIsFocused();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(
    null,
  );

  const loadRoutines = useCallback(async () => {
    try {
      await db.execAsync("PRAGMA foreign_keys = ON;");

      // 1. Pegar o email e o ID do utilizador logado
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      if (!userRow) return;

      // 2. Query com o filtro WHERE r.user_id = ?
      const query = `
        SELECT 
          r.id, 
          r.name, 
          (SELECT GROUP_CONCAT(e.name, ', ') 
           FROM exercises e 
           JOIN routine_exercises re ON e.id = re.exercise_id 
           WHERE re.routine_id = r.id) AS exercise_list
        FROM routines r
        WHERE r.user_id = ?
        ORDER BY r.id DESC
    `;

      const result = await db.getAllAsync<Routine>(query, [userRow.id]);
      setRoutines(result);
    } catch (e) {
      console.error("Erro ao carregar rotinas:", e);

      // Fallback filtrado também!
      try {
        const email = await AsyncStorage.getItem("userEmail");
        const simpleResult = await db.getAllAsync<Routine>(
          "SELECT id, name FROM routines WHERE user_id = (SELECT id FROM users WHERE email = ?) ORDER BY id DESC",
          [email],
        );
        setRoutines(simpleResult);
      } catch (innerError) {
        console.error("Erro no fallback:", innerError);
      }
    }
  }, [db]);

  useEffect(() => {
    if (isFocused) {
      loadRoutines();
    }
  }, [isFocused, loadRoutines]);

  const openOptions = (id: number) => {
    setSelectedRoutineId(id);
    setIsOptionsVisible(true);
  };

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
              // PASSO 1: Ativar Foreign Keys (Boa prática)
              await db.execAsync("PRAGMA foreign_keys = ON;");

              // PASSO 2: Apagar primeiro as associações dos exercícios desta rotina
              await db.runAsync(
                "DELETE FROM routine_exercises WHERE routine_id = ?",
                [selectedRoutineId],
              );

              // PASSO 3: Apagar a rotina em si
              await db.runAsync("DELETE FROM routines WHERE id = ?", [
                selectedRoutineId,
              ]);

              // PASSO 4: Fechar modal e recarregar lista
              setIsOptionsVisible(false);
              loadRoutines();

              Alert.alert("Success", "Routine deleted successfully.");
            } catch (e) {
              console.error("Erro ao apagar:", e);
              Alert.alert(
                "Error",
                "Could not delete routine. Make sure it's not being used in other records.",
              );
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
          onPress={() => {
            router.push({
              pathname: "/workout/log_workout",
              params: { routineId: undefined, reset: "true" },
            });
          }}
          className="flex-row items-center bg-zinc-900/30 py-5 px-5 rounded-[25px] mt-8 border border-zinc-800"
        >
          <Plus size={24} color="#E31C25" strokeWidth={4} />
          <Text className="text-[#E31C25] font-black ml-4 text-lg uppercase italic">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        {/* CABEÇALHO SEM O ÍCONE DE FOLDER */}
        <View className="flex-row justify-between items-center mt-12">
          <Text className="text-white text-2xl font-black italic uppercase">
            Routines
          </Text>
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
            onPress={() => router.push("/workout/explore_exercises")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-4 rounded-2xl"
          >
            <Search size={20} color="white" />
            <Text className="text-white font-black ml-2 uppercase italic">
              EXERCISES
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-10 mb-20 gap-y-5">
          {/* MENSAGEM DE LISTA VAZIA ADICIONADA AQUI */}
          {routines.length === 0 ? (
            <View className="py-20 items-center border border-zinc-900 border-dashed rounded-[35px]">
              <Text className="text-zinc-600 font-bold uppercase italic text-center px-10">
                No routines found.{"\n"}Create your first workout plan!
              </Text>
            </View>
          ) : (
            routines.map((item) => (
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
            ))
          )}
        </View>
      </ScrollView>

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
