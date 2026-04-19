import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
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
  const db = useSQLiteContext();
  const { timer, exercises, stopWorkout } = useWorkout();
  const [description, setDescription] = useState("");
  const { routineName } = useLocalSearchParams<{ routineName: string }>();

  const checkPersonalRecord = async (
    exerciseId: number,
    weight: number,
    reps: number,
  ) => {
    try {
      const bestForThisWeight = await db.getFirstAsync<{ reps: number }>(
        "SELECT MAX(reps) as reps FROM workout_sets WHERE exercise_id = ? AND weight = ?",
        [exerciseId, weight],
      );
      const absoluteMaxWeight = await db.getFirstAsync<{ weight: number }>(
        "SELECT MAX(weight) as weight FROM workout_sets WHERE exercise_id = ?",
        [exerciseId],
      );
      if (!absoluteMaxWeight?.weight || weight > absoluteMaxWeight.weight)
        return 1;
      if (
        weight === absoluteMaxWeight.weight &&
        reps > (bestForThisWeight?.reps || 0)
      )
        return 1;
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const stats = useMemo(() => {
    let totalVolume = 0,
      totalSets = 0;
    exercises.forEach((ex) =>
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          totalSets++;
        }
      }),
    );
    return { totalVolume, totalSets };
  }, [exercises]);

  const handleSave = async () => {
    if (stats.totalSets === 0) {
      Alert.alert("Atenção", "Completa pelo menos uma série!");
      return;
    }
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [userEmail],
      );
      if (!user) return;

      const lastWorkout = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM workouts ORDER BY id DESC LIMIT 1",
      );
      const newWorkoutId = lastWorkout ? lastWorkout.id + 1 : 1;

      await db.runAsync(
        "INSERT INTO workouts (id, user_id, date, title, duration, notes, total_volume) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          newWorkoutId,
          user.id,
          new Date().toISOString(),
          routineName || "Treino Avulso",
          timer,
          description,
          stats.totalVolume,
        ],
      );

      const lastSet = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM workout_sets ORDER BY id DESC LIMIT 1",
      );
      let currentSetId = lastSet ? lastSet.id + 1 : 1;

      for (const ex of exercises) {
        let setIndex = 1;
        for (const set of ex.sets) {
          if (set.completed) {
            const isPR = await checkPersonalRecord(
              ex.id,
              Number(set.weight),
              Number(set.reps),
            );
            await db.runAsync(
              "INSERT INTO workout_sets (id, workout_exercise_id, exercise_id, weight, reps, set_type, index_order, is_personal_record) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [
                currentSetId,
                newWorkoutId,
                ex.id,
                Number(set.weight) || 0,
                Number(set.reps) || 0,
                set.type,
                setIndex,
                isPR,
              ],
            );
            currentSetId++;
            setIndex++;
          }
        }
      }
      stopWorkout();
      Alert.alert("Sucesso!", "Treino guardado!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/home") },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.push("/workout/log_workout")}>
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
      <ScrollView className="px-6 pt-6">
        <Text className="text-white text-3xl font-black italic mb-8 uppercase">
          Resumo
        </Text>
        <View className="flex-row justify-between mb-10 bg-zinc-900/30 p-5 rounded-[30px] border border-zinc-900">
          <View>
            <Text className="text-zinc-500 text-[10px] font-black uppercase">
              Duração
            </Text>
            <Text className="text-[#E31C25] text-xl font-black italic">
              {timer}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-zinc-500 text-[10px] font-black uppercase">
              Volume
            </Text>
            <Text className="text-white text-xl font-black italic">
              {stats.totalVolume}kg
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-zinc-500 text-[10px] font-black uppercase">
              Séries
            </Text>
            <Text className="text-white text-xl font-black italic">
              {stats.totalSets}
            </Text>
          </View>
        </View>
        <TextInput
          placeholder="Notas..."
          placeholderTextColor="#3f3f46"
          multiline
          value={description}
          onChangeText={setDescription}
          className="text-white text-base bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900 min-h-[100px]"
          textAlignVertical="top"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
