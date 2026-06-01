import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkout } from "../context/workoutcontext";
import { clearActiveWorkout } from "../src/activeWorkout";
import { updateEmail, updatePassword, updateUsername } from "../src/database";

const SettingItem = ({
  icon: Icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-5 border-b border-zinc-900/50"
  >
    <View className="flex-row items-center gap-4">
      <Icon size={22} color="#A1A1AA" />
      <Text className="text-zinc-200 text-base">{label}</Text>
    </View>
    <ChevronRight size={20} color="#3F3F46" />
  </TouchableOpacity>
);

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const params = useLocalSearchParams();
  const userEmail = params.email as string;

  const { stopWorkout } = useWorkout();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWorkoutWarning, setShowWorkoutWarning] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Estados dos Modais
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Estados dos Campos
  const [currentVal, setCurrentVal] = useState("");
  const [password, setPassword] = useState("");
  const [newVal, setNewVal] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [currentVal, password, newVal]);

  const closeEditModals = () => {
    setIsUserModalVisible(false);
    setIsEmailModalVisible(false);
    setIsPassModalVisible(false);
    setCurrentVal("");
    setPassword("");
    setNewVal("");
    setErrorMessage(null);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }
    try {
      const email = await AsyncStorage.getItem("userEmail");

      if (!email) {
        setDeleteError("Session expired. Please login again.");
        return;
      }

      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ? AND pass = ?",
        [email, deletePassword],
      );

      if (!user) {
        setDeleteError("Incorrect password.");
        return;
      }

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
      await db.runAsync("DELETE FROM user_settings WHERE user_id = ?", [
        user.id,
      ]);
      await db.runAsync("DELETE FROM users WHERE id = ?", [user.id]);
      await AsyncStorage.removeItem("userEmail");
      router.replace("/auth/login");
    } catch (e) {
      console.error("Delete error:", e);
      setDeleteError("An error occurred. Please try again.");
    }
  };

  const handleUpdateUsername = async () => {
    if (!currentVal || !password || !newVal) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      const result = await updateUsername(db, currentVal, password, newVal);
      if (result.success) {
        closeEditModals();
        setIsSuccessModalVisible(true);
      } else {
        setErrorMessage(result.message ?? "An error occurred.");
      }
    } catch {
      setErrorMessage("This username is already taken.");
    }
  };

  const handleUpdateEmail = async () => {
    if (!currentVal || !password || !newVal) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!newVal.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      const result = await updateEmail(db, currentVal, password, newVal);
      if (result.success) {
        closeEditModals();
        setIsSuccessModalVisible(true);
      } else {
        setErrorMessage(result.message ?? "An error occurred.");
      }
    } catch {
      setErrorMessage("This email is already registered.");
    }
  };

  const handleUpdatePass = async () => {
    if (!password || !newVal) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      const result = await updatePassword(db, userEmail, password, newVal);
      if (result.success) {
        closeEditModals();
        setIsSuccessModalVisible(true);
      } else {
        setErrorMessage(result.message ?? "An error occurred.");
      }
    } catch {
      setErrorMessage("Could not update password.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/settings")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide">
          Account Settings
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 mt-2">
          <SettingItem
            icon={User}
            label="Change Username"
            onPress={() => setIsUserModalVisible(true)}
          />
          <SettingItem
            icon={Mail}
            label="Change Email"
            onPress={() => setIsEmailModalVisible(true)}
          />
          <SettingItem
            icon={Lock}
            label="Update Password"
            onPress={() => setIsPassModalVisible(true)}
          />
        </View>

        <TouchableOpacity
          onPress={async () => {
            const activeWorkout = await db.getFirstAsync<{ id: number }>(
              "SELECT id FROM active_workout LIMIT 1",
            );
            if (activeWorkout) {
              setShowWorkoutWarning(true);
            } else {
              setShowDeleteConfirm(true);
            }
          }}
          className="mt-10 mb-10 items-center justify-center py-4"
        >
          <Text className="text-[#E31C25] font-bold text-xl">
            Delete Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL: WORKOUT ATIVO */}
      <Modal transparent visible={showWorkoutWarning} animationType="fade">
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
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Active Workout
            </Text>
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              You have an active workout. Do you want to discard it and delete
              your account?
            </Text>
            <TouchableOpacity
              onPress={async () => {
                setShowWorkoutWarning(false);
                stopWorkout(false);
                await clearActiveWorkout(db);
                setShowDeleteConfirm(true);
              }}
              style={{
                width: "100%",
                backgroundColor: "#E31C25",
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
                Discard & Continue
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowWorkoutWarning(false)}
              style={{
                width: "100%",
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#71717a", fontWeight: "800", fontSize: 15 }}
              >
                Keep Workout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: CHANGE USERNAME */}
      <Modal animationType="slide" transparent visible={isUserModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-[#18181B] rounded-t-[32px] p-6 pb-10 border-t border-zinc-800">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-white text-xl font-bold">
                  Change Username
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  Verify your identity to continue
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeEditModals}
                className="bg-zinc-800 p-2 rounded-full"
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View className="gap-y-5">
              <TextInput
                value={currentVal}
                onChangeText={setCurrentVal}
                placeholder="Current Username"
                placeholderTextColor="#3F3F46"
                autoCapitalize="none"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-800"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#3F3F46"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-800"
              />
              <TextInput
                value={newVal}
                onChangeText={setNewVal}
                placeholder="New Username"
                placeholderTextColor="#3F3F46"
                autoCapitalize="none"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-700"
              />
              <View className="h-6 ml-1 justify-center">
                {errorMessage && (
                  <Text className="text-[#E31C25] text-sm font-medium">
                    {errorMessage}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleUpdateUsername}
              className="bg-white mt-4 py-4 rounded-2xl items-center"
            >
              <Text className="text-black font-bold text-base">
                Confirm Update
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: DELETE ACCOUNT */}
      <Modal transparent visible={showDeleteConfirm} animationType="fade">
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
                marginBottom: 8,
              }}
            >
              Delete Account
            </Text>
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              This action is permanent and cannot be undone. Enter your password
              to confirm.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={(t) => {
                setDeletePassword(t);
                setDeleteError(null);
              }}
              secureTextEntry
              placeholder="Your password"
              placeholderTextColor="#3F3F46"
              style={{
                backgroundColor: "#09090B",
                color: "white",
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#27272a",
                width: "100%",
                marginBottom: 8,
              }}
            />
            {deleteError && (
              <Text
                style={{
                  color: "#E31C25",
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                {deleteError}
              </Text>
            )}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              style={{
                width: "100%",
                backgroundColor: "#E31C25",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                marginTop: 8,
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
                Delete Permanently
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowDeleteConfirm(false);
                setDeletePassword("");
                setDeleteError(null);
              }}
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

      {/* MODAL: TROCAR EMAIL */}
      <Modal animationType="slide" transparent visible={isEmailModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-[#18181B] rounded-t-[32px] p-6 pb-10 border-t border-zinc-800">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-white text-xl font-bold">
                  Change Email
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  Verify your identity to continue
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeEditModals}
                className="bg-zinc-800 p-2 rounded-full"
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View className="gap-y-5">
              <TextInput
                value={currentVal}
                onChangeText={setCurrentVal}
                placeholder="Current Email"
                placeholderTextColor="#3F3F46"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-800"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#3F3F46"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-800"
              />
              <TextInput
                value={newVal}
                onChangeText={setNewVal}
                placeholder="New Email"
                placeholderTextColor="#3F3F46"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-700"
              />
              <View className="h-6 ml-1 justify-center">
                {errorMessage && (
                  <Text className="text-[#E31C25] text-sm font-medium">
                    {errorMessage}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleUpdateEmail}
              className="bg-white mt-4 py-4 rounded-2xl items-center"
            >
              <Text className="text-black font-bold text-base">
                Confirm Update
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: ATUALIZAR PASSWORD */}
      <Modal animationType="slide" transparent visible={isPassModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-[#18181B] rounded-t-[32px] p-6 pb-10 border-t border-zinc-800">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-white text-xl font-bold">
                  Update Password
                </Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  Insert your current and new password
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeEditModals}
                className="bg-zinc-800 p-2 rounded-full"
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View className="gap-y-5">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Current Password"
                placeholderTextColor="#3F3F46"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-800"
              />
              <TextInput
                value={newVal}
                onChangeText={setNewVal}
                secureTextEntry
                placeholder="New Password"
                placeholderTextColor="#3F3F46"
                className="bg-[#09090B] text-white p-4 rounded-2xl border border-zinc-700"
              />
              <View className="h-6 ml-1 justify-center">
                {errorMessage && (
                  <Text className="text-[#E31C25] text-sm font-medium">
                    {errorMessage}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleUpdatePass}
              className="bg-white mt-4 py-4 rounded-2xl items-center"
            >
              <Text className="text-black font-bold text-base">
                Confirm New Password
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: SUCESSO CUSTOMIZADO */}
      <Modal transparent visible={isSuccessModalVisible} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/90 px-8">
          <View className="bg-[#18181B] border border-zinc-800 p-8 rounded-[40px] items-center w-full">
            <View className="bg-green-500/10 p-5 rounded-full mb-6">
              <CheckCircle2 size={50} color="#22C55E" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2 text-center">
              Success!
            </Text>
            <Text className="text-zinc-400 text-center mb-10 text-base">
              Information updated successfully.
            </Text>
            <TouchableOpacity
              onPress={() => setIsSuccessModalVisible(false)}
              className="bg-[#E31C25] py-4 rounded-2xl w-full items-center"
            >
              <Text className="text-white font-bold text-lg">Great!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
