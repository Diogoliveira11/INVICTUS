import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite"; // 1. Importar o contexto
import { ChevronLeft } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useWorkout } from "../context/workoutcontext";

export default function SaveWorkoutScreen() {
  const router = useRouter();
  const db = useSQLiteContext(); // 2. Obter a instância central da BD
  const { timer, exercises, stopWorkout } = useWorkout();
  const [description, setDescription] = useState("");

  // CÁLCULO DE ESTATÍSTICAS
  const stats = useMemo(() => {
    let totalVolume = 0;
    let totalSets = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          totalSets++;
        }
      });
    });
    return { totalVolume, totalSets };
  }, [exercises]);

  const today = new Date().toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // FUNÇÃO PARA SALVAR NA BASE DE DADOS
  const handleSave = async () => {
    if (stats.totalSets === 0) {
      Alert.alert("Atenção", "Deves completar pelo menos uma série!");
      return;
    }

    try {
      console.log("Iniciando processo de salvamento...");

      // 1. Buscar Utilizador
      const userEmail = await AsyncStorage.getItem("userEmail");
      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [userEmail],
      );

      if (!user) {
        Alert.alert("Erro", "Utilizador não encontrado.");
        return;
      }

      // 2. Gerar ID Manual para o Treino
      const lastWorkout = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM workouts ORDER BY id DESC LIMIT 1",
      );
      const newWorkoutId = lastWorkout ? lastWorkout.id + 1 : 1;

      // 3. Inserir o Treino
      await db.runAsync(
        "INSERT INTO workouts (id, user_id, title, date, total_volume) VALUES (?, ?, ?, ?, ?)",
        [
          newWorkoutId,
          user.id,
          "Treino Invictus",
          new Date().toISOString(),
          stats.totalVolume,
        ],
      );

      // 4. Gerar ID Manual inicial para as Séries
      const lastSet = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM workout_sets ORDER BY id DESC LIMIT 1",
      );
      let currentSetId = lastSet ? lastSet.id + 1 : 1;

      // 5. Loop para inserir as Séries
      for (const ex of exercises) {
        let setIndex = 1;

        for (const set of ex.sets) {
          if (set.completed) {
            console.log(
              `Inserindo série ID ${currentSetId} (Ordem: ${setIndex})`,
            );

            await db.runAsync(
              "INSERT INTO workout_sets (id, workout_exercise_id, exercise_id, weight, reps, set_type, index_order, is_personal_record) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [
                currentSetId, // id
                newWorkoutId, // workout_exercise_id
                ex.id, // exercise_id
                Number(set.weight) || 0,
                Number(set.reps) || 0,
                set.type, // set_type
                setIndex, // index_order
                0, // is_personal_record (0 = falso) <--- O QUE FALTA!
              ],
            );

            currentSetId++;
            setIndex++;
          }
        }
      }

      // Sucesso!
      stopWorkout();
      Alert.alert("Sucesso!", "O teu treino foi guardado!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/workout") },
      ]);
    } catch (error) {
      console.error("ERRO AO SALVAR:", error);
      Alert.alert("Erro", "Ainda falta preencher alguma coluna obrigatória.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-black text-lg italic uppercase">
          Finalizar
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          className="bg-[#E31C25] px-6 py-1.5 rounded-full"
        >
          <Text className="text-white font-bold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-black italic mb-8 uppercase tracking-tighter">
          Resumo do Treino
        </Text>

        {/* GRILHA DE STATS */}
        <View className="flex-row justify-between mb-10 bg-zinc-900/30 p-5 rounded-[30px] border border-zinc-900">
          <View>
            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
              Duração
            </Text>
            <Text className="text-[#E31C25] text-xl font-black italic">
              {timer}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
              Volume
            </Text>
            <Text className="text-white text-xl font-black italic">
              {stats.totalVolume} kg
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
              Séries
            </Text>
            <Text className="text-white text-xl font-black italic">
              {stats.totalSets}
            </Text>
          </View>
        </View>

        {/* INFO DATA */}
        <View className="border-t border-zinc-900 pt-6 mb-8">
          <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">
            Data do Treino
          </Text>
          <Text className="text-white font-bold text-base">{today}</Text>
        </View>

        {/* NOTAS */}
        <View className="border-t border-zinc-900 pt-6">
          <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3">
            Notas Pessoais
          </Text>
          <TextInput
            placeholder="Como te sentiste hoje? Notas sobre carga ou cansaço..."
            placeholderTextColor="#3f3f46"
            multiline
            value={description}
            onChangeText={setDescription}
            className="text-white text-base bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900"
            style={{ minHeight: 100, textAlignVertical: "top" }}
          />
        </View>

        {/* DESCARTAR */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Descartar Treino?",
              "Todos os dados deste treino serão perdidos permanentemente.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Descartar",
                  style: "destructive",
                  onPress: () => {
                    stopWorkout();
                    router.replace("/(tabs)/workout");
                  },
                },
              ],
            );
          }}
          className="mt-20 mb-10 items-center"
        >
          <Text className="text-zinc-700 font-black uppercase tracking-widest text-xs">
            Descartar Treino
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
