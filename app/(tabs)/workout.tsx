import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  FolderPlus,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

  const loadRoutines = async () => {
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");

      // FORÇAR CRIAÇÃO (Caso o arquivo aberto seja um novo vazio)
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

  const debugDatabase = async () => {
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );
      console.log("--- TABELAS ENCONTRADAS NO BANCO ---");
      console.log(tables.map((t) => t.name));

      const countRoutines = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM routines",
      );
      console.log("Total de Rotinas na DB:", countRoutines?.count);
    } catch (e) {
      console.error("ERRO NO DIAGNÓSTICO:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      debugDatabase();
      loadRoutines(); // Agora ele já encontra a função
    }, []),
  );

  const handleDelete = async (id: number) => {
    Alert.alert("Opções", "O que pretendes fazer?", [
      {
        text: "Editar",
        onPress: () =>
          router.push({
            pathname: "/workout/new-routine",
            params: { routineId: id, mode: "edit" },
          }),
      },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          const db = await SQLite.openDatabaseAsync(
            "inicializedatabase.sqlite",
          );
          await db.runAsync(
            "DELETE FROM routine_exercises WHERE routine_id = ?",
            [id],
          );
          await db.runAsync("DELETE FROM routines WHERE id = ?", [id]);
          loadRoutines(); // Agora ele já encontra a função
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-4">Workout</Text>

        <TouchableOpacity className="flex-row items-center bg-[#1c1c1e] py-3 px-4 rounded-xl mt-6 border border-zinc-800/50">
          <Plus size={20} color="#a1a1aa" strokeWidth={3} />
          <Text className="text-zinc-400 font-semibold ml-3 text-lg">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mt-10">
          <Text className="text-white text-2xl font-bold">Routines</Text>
          <FolderPlus size={26} color="white" />
        </View>

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={() => router.push("/workout/new-routine")}
            className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-3 rounded-full"
          >
            <List size={18} color="white" />
            <Text className="text-white font-bold ml-2">New Routine</Text>
          </TouchableOpacity>

          {/* BOTÃO EXPLORE ATUALIZADO ABAIXO */}
          <TouchableOpacity
            onPress={() => router.push("/workout/explore")} // Adicionado o redirecionamento
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
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <MoreHorizontal size={22} color="#71717a" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity className="bg-[#E31C25] w-full py-3 rounded-2xl mt-5 items-center">
                <Text className="text-white font-black text-lg">
                  Start Routine
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
