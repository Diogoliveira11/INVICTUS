import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  Image as ImageIcon,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUnits } from "../context/units_context";
import { useWorkout } from "../context/workoutcontext";

export default function SaveWorkoutScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { timer, exercises, stopWorkout } = useWorkout();
  const [description, setDescription] = useState("");
  const { routineName } = useLocalSearchParams<{ routineName: string }>();
  const { weightUnit: weightUnitRaw } = useUnits();
  const weightUnit = weightUnitRaw.toLowerCase();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

  const [workoutImage, setWorkoutImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalMessage, setPermissionModalMessage] = useState("");

  const checkPersonalRecord = async (
    exerciseId: number,
    weight: number,
    reps: number,
  ): Promise<number> => {
    try {
      const absoluteMaxWeight = await db.getFirstAsync<{ weight: number }>(
        "SELECT MAX(weight) as weight FROM workout_sets WHERE exercise_id = ?",
        [exerciseId],
      );

      if (!absoluteMaxWeight?.weight) return 1;
      if (weight > absoluteMaxWeight.weight) return 1;

      if (weight === absoluteMaxWeight.weight) {
        const bestRepsAtMaxWeight = await db.getFirstAsync<{ reps: number }>(
          "SELECT MAX(reps) as reps FROM workout_sets WHERE exercise_id = ? AND weight = ?",
          [exerciseId, weight],
        );
        if (reps > (bestRepsAtMaxWeight?.reps || 0)) return 1;
      }

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

  const pickImage = async (useCamera: boolean) => {
    setShowImageModal(false);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      setPermissionModalMessage(
        useCamera
          ? "WE NEED CAMERA ACCESS TO ADD A WORKOUT PHOTO!"
          : "WE NEED GALLERY ACCESS TO CHOOSE A WORKOUT PHOTO!",
      );
      setPermissionModalVisible(true);
      return;
    }

    const result = await (useCamera
      ? ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.6,
        })
      : ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.6,
        }));

    if (!result.canceled && result.assets?.length > 0) {
      setWorkoutImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
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

      // ✅ Deixa o SQLite gerar o ID automaticamente
      await db.runAsync(
        "INSERT INTO workouts (user_id, date, title, duration, notes, total_volume, photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          user.id,
          new Date().toISOString(),
          String(routineName).trim(),
          timer,
          description,
          stats.totalVolume,
          workoutImage,
        ],
      );

      // ✅ Buscar o ID real gerado pelo SQLite
      const insertedWorkout = await db.getFirstAsync<{ id: number }>(
        "SELECT MAX(id) as id FROM workouts WHERE user_id = ?",
        [user.id],
      );
      const newWorkoutId = insertedWorkout!.id;

      for (const ex of exercises) {
        // ✅ Calcular o próximo ID manualmente (a coluna não tem AUTOINCREMENT)
        const lastWEx = await db.getFirstAsync<{ id: number }>(
          "SELECT COALESCE(MAX(id), 0) as id FROM workout_exercises",
        );
        const workoutExerciseId = lastWEx!.id + 1;

        await db.runAsync(
          "INSERT INTO workout_exercises (id, workout_id, exercise_id, index_order) VALUES (?, ?, ?, ?)",
          [workoutExerciseId, newWorkoutId, ex.id, exercises.indexOf(ex)],
        );

        let setIndex = 1;
        for (const set of ex.sets) {
          if (set.completed) {
            const isCardio = ex.muscle_group?.toLowerCase() === "cardio";
            const isPR = await checkPersonalRecord(
              ex.id,
              Number(set.weight),
              Number(set.reps),
            );
            const distanceValue = isCardio
              ? parseFloat(String(set.weight).replace(",", ".")) || 0
              : null;
            const timeValue = isCardio ? set.reps || null : null;
            const weightValue = isCardio ? 0 : Number(set.weight) || 0;
            const repsValue = isCardio ? 0 : Number(set.reps) || 0;

            // ✅ Mesmo padrão para workout_sets
            const lastSet = await db.getFirstAsync<{ id: number }>(
              "SELECT COALESCE(MAX(id), 0) as id FROM workout_sets",
            );
            const newSetId = lastSet!.id + 1;

            await db.runAsync(
              "INSERT INTO workout_sets (id, workout_exercise_id, exercise_id, weight, reps, set_type, index_order, is_personal_record, distance, time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                newSetId,
                workoutExerciseId,
                ex.id,
                weightValue,
                repsValue,
                set.type,
                setIndex,
                isPR,
                distanceValue,
                timeValue,
              ],
            );
            setIndex++;
          }
        }
      }

      stopWorkout();
      setShowSuccessModal(true);
    } catch (e) {
      console.error("[save_workout] erro:", e);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() => router.push("/workout/log_workout")}
          className="p-2"
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase italic"
        >
          Finish
        </Text>
        <TouchableOpacity onPress={handleSave} className="p-2">
          <Text className="text-[#E31C25] font-black uppercase italic">
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-6 pt-6">
        <Text className="text-white text-3xl font-black italic mb-8 uppercase">
          Summary
        </Text>

        <View className="flex-row justify-between mb-6 bg-zinc-900/30 p-5 rounded-[30px] border border-zinc-900">
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
              {stats.totalVolume}
              {weightUnit}
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

        {/* FOTO DO TREINO */}
        <TouchableOpacity
          onPress={() => setShowImageModal(true)}
          className="mb-6 w-full h-48 rounded-3xl bg-zinc-900/30 border border-dashed border-zinc-700 overflow-hidden items-center justify-center"
        >
          {workoutImage ? (
            <Image
              source={{ uri: workoutImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="items-center gap-2">
              <Camera color="#52525b" size={32} />
              <Text className="text-zinc-500 font-black uppercase italic text-xs">
                Add Workout Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Notes..."
          placeholderTextColor="#3f3f46"
          multiline
          value={description}
          onChangeText={setDescription}
          className="text-white text-base bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900 min-h-[100px] mb-10"
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
      {/* MODAL CHOOSE SOURCE */}
      <Modal visible={showImageModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowImageModal(false)}
        >
          <View className="bg-[#121212] p-10 rounded-t-[40px] border-t border-zinc-800">
            <Text className="text-white text-center font-black uppercase italic mb-8 tracking-widest text-sm">
              Choose Source
            </Text>
            <View className="flex-row justify-around mb-6">
              <TouchableOpacity
                onPress={() => pickImage(true)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-5 rounded-3xl mb-2 border border-zinc-800">
                  <Camera color="#E31C25" size={32} />
                </View>
                <Text className="text-zinc-400 font-black uppercase italic text-[10px]">
                  Camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage(false)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-5 rounded-3xl mb-2 border border-zinc-800">
                  <ImageIcon color="#E31C25" size={32} />
                </View>
                <Text className="text-zinc-400 font-black uppercase italic text-[10px]">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL PERMISSÃO NEGADA */}
      <Modal visible={permissionModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-10">
          <View className="bg-[#1a1a1a] w-full p-8 rounded-[32px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertCircle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase italic mb-3 tracking-wider">
              Attention
            </Text>
            <Text className="text-zinc-400 text-center text-sm font-black uppercase italic mb-8 leading-5">
              {permissionModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setPermissionModalVisible(false)}
              className="w-full py-4 rounded-2xl items-center bg-[#E31C25]"
            >
              <Text className="text-white font-black uppercase italic text-lg">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
