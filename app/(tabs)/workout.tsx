import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  Folder,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 1. Definição do Tipo
type Routine = {
  id: number;
  name: string;
  folder_id: number | null;
};

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 2. Estado com Tipagem correta
  const [routines, setRoutines] = useState<Routine[]>([]);

  const loadRoutines = async () => {
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");
      const result = await db.getAllAsync<Routine>(
        "SELECT * FROM routines ORDER BY id DESC",
      );
      setRoutines(result);
    } catch (e) {
      console.error("Erro ao carregar rotinas", e);
    }
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleCreateFolder = () => {
    Alert.prompt("New Folder", "Enter folder name:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Create",
        onPress: (name?: string) => console.log("Criar pasta:", name),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-bold mt-4">Workout</Text>

        <TouchableOpacity
          onPress={() => router.push("/workout/active-session")}
          className="flex-row items-center justify-center bg-[#E31C25] py-4 rounded-2xl mt-6"
        >
          <Plus size={22} color="white" strokeWidth={3} />
          <Text className="text-white font-black ml-2 text-lg">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mt-10">
          <Text className="text-white text-2xl font-bold">Routines</Text>
          <TouchableOpacity onPress={handleCreateFolder}>
            <FolderPlus size={26} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={() => router.push("/workout/new-routine")}
            className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 py-3 rounded-full"
          >
            <Plus size={18} color="#E31C25" />
            <Text className="text-white font-bold text-base ml-2">
              New Routine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/workout/explore")}
            className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 py-3 rounded-full"
          >
            <Search size={18} color="#E31C25" />
            <Text className="text-white font-bold text-base ml-2">Explore</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 mb-10">
          {routines.length === 0 ? (
            <View className="items-center py-10">
              <Folder size={48} color="#27272a" />
              <Text className="text-zinc-500 mt-4 text-center text-base">
                No routines yet.{"\n"}Create one to speed up your workouts.
              </Text>
            </View>
          ) : (
            <View className="gap-y-4">
              {routines.map((item) => (
                <View
                  key={item.id}
                  className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800"
                >
                  <View className="flex-row justify-between items-start">
                    <Text className="text-white text-lg font-bold flex-1 mr-4">
                      {item.name}
                    </Text>
                    <MoreHorizontal size={20} color="#71717a" />
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/workout/active-session",
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
          )}
        </View>
      </ScrollView>
    </View>
  );
}
