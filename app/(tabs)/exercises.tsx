import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- 1. Definição de Tipos ---
type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  image: string | null; // Usamos a imagem estática na lista
};

// --- 2. Mapeamento de Imagens Estáticas (PNG) ---
// Adiciona aqui as tuas 23 imagens conforme os caminhos na coluna 'image' da BD
const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/barbell_decline_bench_press_chest.png": require("../../assets/exercises_images/barbell_decline_bench_press_chest.png"),
};

// Variável global para evitar que a BD feche e abra constantemente na pesquisa
let dbInstance: SQLite.SQLiteDatabase | null = null;

export default function ExercisesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 3. Lógica de Carregamento da BD ---
  const loadDatabase = useCallback(async () => {
    if (dbInstance) return dbInstance;

    try {
      const dbName = "inicializedatabase.sqlite";
      const dbFile = require("../../src/inicializedatabase.sqlite");
      const dbUri = Asset.fromModule(dbFile).uri;
      const fs: any = FileSystem;
      const dbInternalPath = `${fs.documentDirectory}SQLite/${dbName}`;

      const fileInfo = await FileSystem.getInfoAsync(dbInternalPath);

      // Se a BD não existe ou se estás a mudar nomes no PC (podes usar || __DEV__ aqui se quiseres forçar)
      if (!fileInfo.exists) {
        const sqliteDir = `${fs.documentDirectory}SQLite`;
        const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(sqliteDir);
        }
        await FileSystem.downloadAsync(dbUri, dbInternalPath);
      }

      dbInstance = await SQLite.openDatabaseAsync(dbName);
      return dbInstance;
    } catch (e) {
      console.error("Erro ao carregar BD:", e);
      return null;
    }
  }, []);

  // --- 4. Busca de Dados (useEffect) ---
  useEffect(() => {
    let isMounted = true;

    async function fetchExercises() {
      const currentSearch = search.trim();

      try {
        const db = await loadDatabase();
        if (!db || !isMounted) return;

        const query = currentSearch
          ? "SELECT id, name, muscle_group, image FROM exercises WHERE name LIKE ? ORDER BY name ASC"
          : "SELECT id, name, muscle_group, image FROM exercises ORDER BY name ASC";

        const params = currentSearch ? [`%${currentSearch}%`] : [];
        const allRows = await db.getAllAsync<Exercise>(query, params);

        if (isMounted) {
          setExercises(allRows);
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Erro na Query:", error.message);
      }
    }

    fetchExercises();
    return () => {
      isMounted = false;
    };
  }, [search, loadDatabase]);

  // --- 5. Função de Renderização (Dentro do Componente) ---
  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const imageSource = item.image ? IMAGE_MAP[item.image] : null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center py-4 border-b border-zinc-800/50"
        onPress={() => {
          // @ts-ignore
          router.push(`/exercise/${item.id}`);
        }}
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
            {item.muscle_group}
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
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-semibold">Exercises</Text>
          <TouchableOpacity onPress={() => router.push("/createexercise")}>
            <Text className="text-[#E31C25] text-lg font-medium">Create</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#2D2F33] rounded-xl px-4 h-12 mb-4">
          <Search color="#9ca3af" size={20} className="mr-3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercise"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-white text-base"
            selectionColor="#E31C25"
          />
        </View>

        {/* Filters */}
        <View className="flex-row justify-between mb-8 gap-x-4">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#2D2F33] rounded-full py-3 px-4">
            <Text className="text-white text-[15px] font-medium mr-2">
              Equipment
            </Text>
            <ChevronDown color="#9ca3af" size={18} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#2D2F33] rounded-full py-3 px-4">
            <Text className="text-white text-[15px] font-medium mr-2">
              Muscles
            </Text>
            <ChevronDown color="#9ca3af" size={18} />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-400 text-[17px] font-medium mb-2">
          Recent Exercises
        </Text>

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
    </SafeAreaView>
  );
}
