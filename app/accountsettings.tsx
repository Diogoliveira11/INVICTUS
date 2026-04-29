import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  CheckCircle2,
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

  // Captura parâmetros da rota (ex: se passaste o email no login)
  const params = useLocalSearchParams();
  const userEmail = params.email as string;
  console.log("📧 Email recebido nas configurações:", userEmail); // ADICIONE ESTE LOG

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

  // Limpa mensagem de erro quando o utilizador volta a escrever
  useEffect(() => {
    setErrorMessage(null);
  }, [currentVal, password, newVal]);

  // Função para limpar campos e fechar modais de edição
  const closeEditModals = () => {
    setIsUserModalVisible(false);
    setIsEmailModalVisible(false);
    setIsPassModalVisible(false);
    setCurrentVal("");
    setPassword("");
    setNewVal("");
    setErrorMessage(null);
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
    } catch (error) {
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
    } catch (error) {
      setErrorMessage("This email is already registered.");
    }
  };

  const handleUpdatePass = async () => {
    console.log("DEBUG: Tentando atualizar para o email:", userEmail);
    if (!password || !newVal) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    try {
      // Usamos o userEmail capturado da sessão/rota
      const result = await updatePassword(db, userEmail, password, newVal);
      if (result.success) {
        closeEditModals();
        setIsSuccessModalVisible(true);
      } else {
        setErrorMessage(result.message ?? "An error occurred.");
      }
    } catch (error) {
      setErrorMessage("Could not update password.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase italic"
        >
          Account Settings
        </Text>
        <View className="w-10" />
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

        <TouchableOpacity className="mt-10 mb-10 items-center justify-center py-4">
          <Text className="text-[#E31C25] font-bold text-xl">
            Delete account
          </Text>
        </TouchableOpacity>
      </ScrollView>

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

      {/* MODAL: CHANGE EMAIL */}
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

      {/* MODAL: UPDATE PASSWORD */}
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

      {/* MODAL: SUCCESS CUSTOMIZADO */}
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
