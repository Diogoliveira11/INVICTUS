import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { AlertCircle, Check, ChevronLeft } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Modal,
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

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

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
    // VALIDAÇÃO CORRIGIDA: Verifica se o nome existe, não é nulo e não é apenas espaços
    if (
      !routineName ||
      String(routineName).trim() === "" ||
      routineName === "undefined"
    ) {
      setAttentionMessage("Please provide a name for your workout!");
      setShowAttentionModal(true);
      return;
    }

    if (stats.totalSets === 0) {
      setAttentionMessage("Do at least one set!");
      setShowAttentionModal(true);
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
          String(routineName).trim(),
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
      setShowSuccessModal(true);
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
          Finish
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
          Summary
        </Text>

        <View className="flex-row justify-between mb-10 bg-zinc-900/30 p-5 rounded-[30px] border border-zinc-900">
          <View>
            <Text className="text-zinc-500 text-[10px] font-black uppercase">
              Duration
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
              Series
            </Text>
            <Text className="text-white text-xl font-black italic">
              {stats.totalSets}
            </Text>
          </View>
        </View>

        <TextInput
          placeholder="Notes..."
          placeholderTextColor="#3f3f46"
          multiline
          value={description}
          onChangeText={setDescription}
          className="text-white text-base bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900 min-h-[100px]"
          textAlignVertical="top"
        />
      </ScrollView>

      <Modal visible={showAttentionModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertCircle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase italic mb-3">
              Attention
            </Text>
            <Text className="text-zinc-500 text-center text-sm font-bold uppercase mb-8">
              {attentionMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAttentionModal(false)}
              className="w-full bg-[#E31C25] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase italic text-lg">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
            <View className="bg-green-500/10 p-4 rounded-full mb-6 border border-green-500/20">
              <Check color="#22c55e" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase italic mb-3">
              Success!
            </Text>
            <Text className="text-zinc-500 text-center text-sm font-bold uppercase mb-8">
              Saved workout!
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(tabs)/home");
              }}
              className="w-full bg-[#E31C25] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase italic text-lg">
                Great!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
