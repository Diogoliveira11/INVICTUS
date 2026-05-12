import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Globe,
  HelpCircle,
  Info,
  Mail,
  Moon,
  Ruler,
  Share,
  Star,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { exportUserData } from "../src/exportData";

const RED = "#E31C25";

const SettingItem = ({
  icon: Icon,
  label,
  onPress,
  hideArrow = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  hideArrow?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
  >
    <View className="flex-row items-center gap-4">
      <Icon size={22} color="#A1A1AA" />
      <Text className="text-zinc-200 text-base">{label}</Text>
    </View>
    {!hideArrow && <ChevronRight size={20} color="#3F3F46" />}
  </TouchableOpacity>
);

const SectionTitle = ({ title }: { title: string }) => (
  <View className="bg-zinc-900/50 px-5 py-3 mt-4">
    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
      {title}
    </Text>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const params = useLocalSearchParams();
  const userEmail = params.email as string;

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Estatisticas Modal
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleExport = async () => {
    try {
      setExporting(true);
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      await exportUserData(db, email);
    } catch (e) {
      setErrorMessage("Failed to import data. Make sure the file is valid.");
      setShowError(true);
    } finally {
      setExporting(false);
    }
  };

  const handleImportConfirmed = async () => {
    setShowConfirmImport(false);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      setImporting(true);
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!user) return;

      const DocumentPicker = require("expo-document-picker");
      const FileSystem = require("expo-file-system/legacy");

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const data = JSON.parse(content);
      if (!data.workouts) throw new Error("Invalid file");

      await db.runAsync(
        `DELETE FROM workout_sets WHERE workout_exercise_id IN (
          SELECT we.id FROM workout_exercises we
          JOIN workouts w ON we.workout_id = w.id
          WHERE w.user_id = ?
        )`,
        [user.id],
      );
      await db.runAsync(
        `DELETE FROM workout_exercises WHERE workout_id IN (
          SELECT id FROM workouts WHERE user_id = ?
        )`,
        [user.id],
      );
      await db.runAsync("DELETE FROM workouts WHERE user_id = ?", [user.id]);

      for (const workout of data.workouts) {
        await db.runAsync(
          `INSERT INTO workouts (user_id, date, title, notes, description, total_volume, duration)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            workout.date,
            workout.title,
            workout.notes,
            workout.description,
            workout.total_volume,
            workout.duration,
          ],
        );
        const insertedWorkout = await db.getFirstAsync<{ id: number }>(
          "SELECT MAX(id) as id FROM workouts WHERE user_id = ?",
          [user.id],
        );
        const newWorkoutId = insertedWorkout!.id;

        for (const exercise of workout.exercises ?? []) {
          const lastWEx = await db.getFirstAsync<{ id: number }>(
            "SELECT COALESCE(MAX(id), 0) as id FROM workout_exercises",
          );
          const newExerciseId = lastWEx!.id + 1;
          await db.runAsync(
            `INSERT INTO workout_exercises (id, workout_id, exercise_id, index_order, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [
              newExerciseId,
              newWorkoutId,
              exercise.exercise_id,
              exercise.index_order,
              exercise.notes,
            ],
          );
          for (const set of exercise.sets ?? []) {
            const lastSet = await db.getFirstAsync<{ id: number }>(
              "SELECT COALESCE(MAX(id), 0) as id FROM workout_sets",
            );
            const newSetId = lastSet!.id + 1;
            await db.runAsync(
              `INSERT INTO workout_sets (id, workout_exercise_id, exercise_id, index_order, set_type, weight, reps, is_personal_record, distance, time)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                newSetId,
                newExerciseId,
                set.exercise_id,
                set.index_order,
                set.set_type,
                set.weight,
                set.reps,
                set.is_personal_record,
                set.distance,
                set.time,
              ],
            );
          }
        }
      }
      setSuccessMessage("Your data has been imported successfully.");
      setShowSuccess(true);
    } catch (e: any) {
      console.error("Import error detalhado:", JSON.stringify(e), e?.message);
      setErrorMessage(
        e?.message ?? "Failed to import data. Make sure the file is valid.",
      );
      setShowError(true);
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/profile")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide">
          Settings
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="Account" />
        <View className="px-5">
          <SettingItem
            icon={User}
            label="Account"
            onPress={() =>
              router.push({
                pathname: "/accountsettings",
                params: { email: userEmail },
              })
            }
          />
        </View>

        <SectionTitle title="Preferences" />
        <View className="px-5">
          <SettingItem
            icon={Dumbbell}
            label="Workouts"
            onPress={() => router.push("/workoutsettings")}
          />
          <SettingItem icon={Ruler} label="Units" />
          <SettingItem icon={Globe} label="Language" />
          <SettingItem icon={Moon} label="Theme" />
          <SettingItem
            icon={Share}
            label={exporting ? "Exporting..." : "Export Data"}
            onPress={handleExport}
            hideArrow
          />
          <SettingItem
            icon={Share}
            label={importing ? "Importing..." : "Import Data"}
            onPress={() => setShowConfirmImport(true)}
            hideArrow
          />
        </View>

        <SectionTitle title="Guides" />
        <View className="px-5">
          <SettingItem icon={Info} label="Getting Started Guide" />
          <SettingItem icon={ClipboardList} label="Routine Help" />
        </View>

        <SectionTitle title="Help" />
        <View className="px-5">
          <SettingItem icon={HelpCircle} label="Frequently Asked Questions" />
          <SettingItem icon={Mail} label="Contact Us" />
          <SettingItem icon={Star} label="Review Invictus on the App Store" />
        </View>

        <TouchableOpacity
          className="mt-10 mb-10 items-center justify-center py-4"
          onPress={() => router.replace("/auth/login")}
        >
          <Text className="text-[#E31C25] font-bold text-xl">Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL confirmação */}
      <Modal visible={showConfirmImport} transparent animationType="fade">
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
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
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
              Import Data
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
              This will replace all your current workout data. Are you sure?
            </Text>
            <TouchableOpacity
              onPress={handleImportConfirmed}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 16,
                  textTransform: "uppercase",
                }}
              >
                Replace & Import
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowConfirmImport(false)}
              style={{
                width: "100%",
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#71717a", fontWeight: "800", fontSize: 15 }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SUCESSO */}
      <Modal visible={showSuccess} transparent animationType="fade">
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
              {successMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowSuccess(false)}
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

      {/* MODAL ERRO */}
      <Modal visible={showError} transparent animationType="fade">
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
                backgroundColor: "rgba(239,68,68,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle color="#ef4444" size={32} strokeWidth={3} />
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
              Error
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
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowError(false)}
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
    </View>
  );
}
