import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera as CameraIcon,
  Check,
  ChevronRight,
  ClipboardList,
  Image as ImageIcon,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
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

const RED = "#E31C25";

// ─── UPDATE ROUTINE BOTTOM SHEET ─────────────────────────────────────────────
function UpdateRoutineSheet({
  visible,
  routineName,
  addedCount,
  onUpdate,
  onKeep,
}: {
  visible: boolean;
  routineName: string;
  addedCount: number;
  onUpdate: () => void;
  onKeep: () => void;
}) {
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          onKeep();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "flex-end",
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateY }],
          backgroundColor: "#111111",
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          borderTopWidth: 1,
          borderColor: "#27272a",
          paddingBottom: 48,
          paddingTop: 12,
          paddingHorizontal: 24,
        }}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: "#3f3f46",
            borderRadius: 2,
            alignSelf: "center",
            marginBottom: 28,
          }}
        />

        {/* Icon */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#1c1c1e",
              borderWidth: 1,
              borderColor: "#3f3f46",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <ClipboardList size={28} color="#a1a1aa" />
          </View>

          <Text
            style={{
              color: "#ffffff",
              fontWeight: "900",
              fontSize: 20,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Update &quot;{routineName}&quot;
          </Text>
          <Text
            style={{
              color: "#71717a",
              fontSize: 14,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            You added{" "}
            <Text style={{ color: "#a1a1aa", fontWeight: "800" }}>
              {addedCount} {addedCount === 1 ? "exercise" : "exercises"}
            </Text>
            .
          </Text>
        </View>

        {/* Update button — RED */}
        <TouchableOpacity
          onPress={onUpdate}
          style={{
            backgroundColor: RED,
            borderRadius: 18,
            paddingVertical: 18,
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Update Routine
          </Text>
        </TouchableOpacity>

        {/* Keep original */}
        <TouchableOpacity
          onPress={onKeep}
          style={{ paddingVertical: 18, alignItems: "center" }}
        >
          <Text style={{ color: "#71717a", fontWeight: "800", fontSize: 15 }}>
            Keep Original Routine
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function SaveWorkoutScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { timer, exercises, stopWorkout } = useWorkout();
  const [description, setDescription] = useState("");

  const params = useLocalSearchParams<{
    routineName: string;
    routineId: string;
  }>();
  const routineName = params.routineName ?? "";
  const routineId = params.routineId ?? "";

  const { weightUnit: weightUnitRaw } = useUnits();
  const weightUnit = weightUnitRaw.toLowerCase();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAttentionModal, setShowAttentionModal] = useState(false);
  const [attentionMessage, setAttentionMessage] = useState("");

  const [workoutImage, setWorkoutImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalMessage, setPermissionModalMessage] = useState("");

  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [addedExerciseCount, setAddedExerciseCount] = useState(0);

  // ── Photo picker (same as create_exercise) ──
  const launchPicker = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setPermissionModalMessage(
          "WE NEED CAMERA ACCESS TO ADD A WORKOUT PHOTO!",
        );
        setPermissionModalVisible(true);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        mediaTypes: ["images"] as any,
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
      });
      if (!result.canceled && result.assets?.[0]) {
        setWorkoutImage(result.assets[0].uri);
      }
    } else {
      if (Platform.OS === "ios") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setPermissionModalMessage(
            "WE NEED GALLERY ACCESS TO CHOOSE A WORKOUT PHOTO!",
          );
          setPermissionModalVisible(true);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.5,
        mediaTypes: ["images"] as any,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
      });
      if (!result.canceled && result.assets?.[0]) {
        setWorkoutImage(result.assets[0].uri);
      }
    }
  };

  // Reset local state every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setDescription("");
      setWorkoutImage(null);
      setShowSuccessModal(false);
      setShowAttentionModal(false);
      setShowUpdateSheet(false);
      setAddedExerciseCount(0);
    }, []),
  );

  const handleImageOption = (useCamera: boolean) => {
    setShowImageModal(false);
    const delay = Platform.OS === "ios" ? 800 : 100;
    setTimeout(() => launchPicker(useCamera), delay);
  };

  // ── Stats ──
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

  // ── PR check ──
  const checkPersonalRecord = async (
    exerciseId: number,
    weight: number,
    reps: number,
  ): Promise<number> => {
    try {
      const bestSet = await db.getFirstAsync<{ weight: number; reps: number }>(
        "SELECT weight, reps FROM workout_sets WHERE exercise_id = ? ORDER BY (weight * reps) DESC LIMIT 1",
        [exerciseId],
      );

      if (!bestSet) return 1;
      return weight * reps > bestSet.weight * bestSet.reps ? 1 : 0;
    } catch {
      return 0;
    }
  };

  // ── Core save ──
  const executeSave = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [userEmail],
      );
      if (!user) return;

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

      const insertedWorkout = await db.getFirstAsync<{ id: number }>(
        "SELECT MAX(id) as id FROM workouts WHERE user_id = ?",
        [user.id],
      );
      const newWorkoutId = insertedWorkout!.id;

      for (const ex of exercises) {
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
      setDescription("");
      setWorkoutImage(null);
      setShowSuccessModal(true);
    } catch (e) {
      console.error("[save_workout] erro:", e);
    }
  };

  // ── Update routine in DB ──
  const updateRoutineExercises = async () => {
    if (!routineId || routineId === "undefined" || routineId === "") return;
    try {
      const currentRoutineExs = await db.getAllAsync<{ exercise_id: number }>(
        "SELECT exercise_id FROM routine_exercises WHERE routine_id = ?",
        [Number(routineId)],
      );
      const currentIds = new Set(currentRoutineExs.map((r) => r.exercise_id));
      const addedExercises = exercises.filter((ex) => !currentIds.has(ex.id));

      const maxOrder = await db.getFirstAsync<{ max_order: number }>(
        "SELECT COALESCE(MAX(index_order), -1) as max_order FROM routine_exercises WHERE routine_id = ?",
        [Number(routineId)],
      );
      let nextOrder = (maxOrder?.max_order ?? -1) + 1;

      for (const ex of addedExercises) {
        await db.runAsync(
          "INSERT INTO routine_exercises (routine_id, exercise_id, index_order) VALUES (?, ?, ?)",
          [Number(routineId), ex.id, nextOrder],
        );
        nextOrder++;
      }
    } catch (e) {
      console.error("[save_workout] erro ao atualizar rotina:", e);
    }
  };

  // ── Main save handler ──
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

    const hasRoutine =
      routineId &&
      routineId !== "" &&
      routineId !== "undefined" &&
      routineId !== "0";

    if (hasRoutine) {
      try {
        const originalExs = await db.getAllAsync<{ exercise_id: number }>(
          "SELECT exercise_id FROM routine_exercises WHERE routine_id = ?",
          [Number(routineId)],
        );
        const originalIds = new Set(originalExs.map((r) => r.exercise_id));
        const added = exercises.filter((ex) => !originalIds.has(ex.id));

        if (added.length > 0) {
          setAddedExerciseCount(added.length);
          setShowUpdateSheet(true);
          return;
        }
      } catch (e) {
        console.error("[save_workout] erro ao verificar rotina:", e);
      }
    }

    await executeSave();
  };

  const handleUpdateRoutine = async () => {
    setShowUpdateSheet(false);
    await updateRoutineExercises();
    await executeSave();
  };

  const handleKeepOriginal = async () => {
    setShowUpdateSheet(false);
    await executeSave();
  };

  // ── Render ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#18181b",
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/workout/log_workout")}
          style={{ padding: 8 }}
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "900",
            flex: 1,
            textAlign: "center",
            textTransform: "uppercase",
            paddingHorizontal: 16,
          }}
        >
          Save Workout
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: RED,
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              textTransform: "uppercase",
              fontSize: 13,
            }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ paddingHorizontal: 24, paddingTop: 24 }}>
        {/* Title */}
        <Text
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: "900",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          {String(routineName ?? "").trim() || "Workout"}
        </Text>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#18181b",
            paddingBottom: 20,
          }}
        >
          {[
            { label: "Duration", value: timer, color: RED },
            {
              label: "Volume",
              value: `${stats.totalVolume} ${weightUnit}`,
              color: "white",
            },
            { label: "Sets", value: String(stats.totalSets), color: "white" },
          ].map((item) => (
            <View key={item.label}>
              <Text
                style={{
                  color: "#52525b",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {item.label}
              </Text>
              <Text
                style={{ color: item.color, fontSize: 18, fontWeight: "900" }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* When */}
        <View
          style={{
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#18181b",
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#52525b",
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            When
          </Text>
          <Text style={{ color: RED, fontSize: 15, fontWeight: "700" }}>
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Photo row — same style as create_exercise rows */}
        <TouchableOpacity
          onPress={() => setShowImageModal(true)}
          style={{
            marginBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#18181b",
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {workoutImage ? (
            <Image
              source={{ uri: workoutImage }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                marginRight: 16,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: "#18181b",
                borderWidth: 1,
                borderColor: "#27272a",
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <CameraIcon color="#52525b" size={24} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#71717a", fontSize: 13, fontWeight: "600" }}>
              {workoutImage ? "Change photo / video" : "Add a photo / video"}
            </Text>
          </View>
          <ChevronRight color="#27272a" size={20} />
        </TouchableOpacity>

        {/* Description */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: "#52525b",
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Description
          </Text>
          <TextInput
            placeholder="How did your workout go? Leave some notes here..."
            placeholderTextColor="#3f3f46"
            multiline
            value={description}
            onChangeText={setDescription}
            style={{ color: "white", fontSize: 15, minHeight: 80 }}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── UPDATE ROUTINE BOTTOM SHEET ── */}
      <UpdateRoutineSheet
        visible={showUpdateSheet}
        routineName={String(routineName ?? "")}
        addedCount={addedExerciseCount}
        onUpdate={handleUpdateRoutine}
        onKeep={handleKeepOriginal}
      />

      {/* ── IMAGE PICKER MODAL (same as create_exercise) ── */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#0f0f0f",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderTopWidth: 1,
              borderColor: "#27272a",
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 48,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#3f3f46",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 24,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View>
                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Add Photo
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  Choose how to add your image
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={{
                  backgroundColor: "#27272a",
                  padding: 10,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: "#3f3f46",
                }}
              >
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* Camera */}
            <TouchableOpacity
              onPress={() => handleImageOption(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#27272a",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#E31C2518",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <CameraIcon color={RED} size={26} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    fontSize: 15,
                    letterSpacing: 0.5,
                  }}
                >
                  Take Photo
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 3,
                  }}
                >
                  Use your camera
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#27272a",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <ChevronRight color="#52525b" size={18} />
              </View>
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              onPress={() => handleImageOption(false)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#27272a",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#E31C2518",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <ImageIcon color={RED} size={26} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    fontSize: 15,
                    letterSpacing: 0.5,
                  }}
                >
                  Choose from Gallery
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 3,
                  }}
                >
                  Pick from your photos
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#27272a",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <ChevronRight color="#52525b" size={18} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ATTENTION MODAL ── */}
      <Modal visible={showAttentionModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              padding: 32,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(245,158,11,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <AlertCircle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Attention
            </Text>
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              {attentionMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAttentionModal(false)}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── SUCCESS MODAL ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              padding: 32,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(34,197,94,0.2)",
              }}
            >
              <Check color="#22c55e" size={32} strokeWidth={3} />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Success!
            </Text>
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Saved workout!
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(tabs)/home");
              }}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                Great!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PERMISSION MODAL ── */}
      <Modal visible={permissionModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              width: "100%",
              padding: 32,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(245,158,11,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              Attention
            </Text>
            <Text
              style={{
                color: "#a1a1aa",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 20,
              }}
            >
              {permissionModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setPermissionModalVisible(false)}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
