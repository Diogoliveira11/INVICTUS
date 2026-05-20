import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { getUserData, login, resetPassword } from "../../src/database";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const { width, height } = Dimensions.get("window");

type StatusType = "success" | "error";

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotName, setForgotName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [statusVisible, setStatusVisible] = useState(false);
  const [statusType, setStatusType] = useState<StatusType>("success");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    await LocalAuthentication.hasHardwareAsync();
    await LocalAuthentication.isEnrolledAsync();
  };

  const showStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMessage(message);
    setStatusVisible(true);
  };

  const handleCloseForgotModal = () => {
    Keyboard.dismiss();
    setShowModal(false);
    setForgotEmail("");
    setForgotName("");
    setNewPassword("");
    setForgotError("");
  };

  // FUNÇÃO DE BIOMETRIA
  const handleBiometricAuth = async () => {
    try {
      const results = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login INVICTUS",
        disableDeviceFallback: false,
      });

      if (results.success) {
        const savedEmail = await SecureStore.getItemAsync("user_email");
        const savedPass = await SecureStore.getItemAsync("user_password");

        if (savedEmail && savedPass) {
          setLoading(true);
          const user = (await login(db, savedEmail, savedPass)) as any;
          if (user) {
            await AsyncStorage.setItem(
              "userEmail",
              savedEmail.toLowerCase().trim(),
            );
            router.replace("/(tabs)/home");
          } else {
            setError("Saved credentials no longer valid.");
          }
          setLoading(false);
        } else {
          showStatus(
            "error",
            "Please login with password once to enable biometrics.",
          );
        }
      }
    } catch {
      setError("Biometric authentication failed.");
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const user = (await login(db, email, password)) as any;
      if (user) {
        setError("");

        // GUARDAR CREDENCIAIS PARA BIOMETRIA FUTURA
        await SecureStore.setItemAsync("user_email", email);
        await SecureStore.setItemAsync("user_password", password);

        await AsyncStorage.setItem("userEmail", email.toLowerCase().trim());
        await AsyncStorage.setItem("hasOnboarded", "true");
        await AsyncStorage.setItem("profileComplete", "true");
        router.replace("/(tabs)/home");
      } else {
        setError("Invalid email or password.");
      }
    } catch {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    if (!forgotEmail || !forgotName || !newPassword) {
      setForgotError("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotError("");
    setLoading(true);
    try {
      const userData = (await getUserData(
        db,
        forgotEmail.toLowerCase().trim(),
      )) as any;
      if (!userData) {
        setForgotError("No account found with this email.");
        setLoading(false);
        return;
      }
      if (userData.username.trim() !== forgotName.trim()) {
        setForgotError(
          "Name doesn't match. Check uppercase/lowercase letters.",
        );
        setLoading(false);
        return;
      }
      if (userData.pass === newPassword) {
        setForgotError("New password must be different from the current one.");
        setLoading(false);
        return;
      }
      const success = await resetPassword(
        db,
        forgotEmail.toLowerCase().trim(),
        forgotName,
        newPassword,
      );
      if (success) {
        handleCloseForgotModal();
        showStatus("success", "Your password has been updated successfully!");
      } else {
        setForgotError("Something went wrong. Please try again.");
      }
    } catch {
      setForgotError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={require("../../assets/images/imagelogin.png")}
        style={{ width, height, position: "absolute" }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "#000"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.7,
        }}
      />

      <View
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <Text
          className="text-white text-5xl font-bold mb-10 text-center"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Log in
        </Text>

        <BlurView
          intensity={80}
          tint="dark"
          className="w-full p-8 rounded-[30px] overflow-hidden border border-white/20"
        >
          <Text className="text-white text-2xl font-bold mb-6">
            Welcome Back
          </Text>

          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs">Email</Text>
            <TextInput
              className="text-white h-11 text-lg"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs">Password</Text>
            <TextInput
              className="text-white h-11 text-lg"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={true}
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <Text className="text-red-400 text-xs mb-3">{error}</Text>
          ) : null}

          <View className="flex-row justify-between items-center mb-8">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center"
            >
              <View
                className={`w-5 h-5 rounded border mr-2 ${rememberMe ? "bg-white" : "border-white/40"}`}
              >
                {rememberMe && (
                  <Text className="text-black text-center text-[10px]">✓</Text>
                )}
              </View>
              <Text className="text-white text-xs opacity-70">Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text className="text-white text-xs opacity-70 underline">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* BOTÕES DE LOGIN E BIOMETRIA LADO A LADO */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="bg-white h-14 flex-1 rounded-full justify-center items-center"
              onPress={handleLogin}
            >
              <Text className="text-black font-bold text-lg uppercase">
                {loading ? "..." : "Log In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBiometricAuth}
              className="bg-white/10 w-14 h-14 rounded-full justify-center items-center border border-white/20"
            >
              <MaterialCommunityIcons
                name={
                  Platform.OS === "ios" ? "face-recognition" : "fingerprint"
                }
                size={30}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </BlurView>

        <View className="flex-row justify-center items-center mt-8">
          <Text className="text-white text-sm">Don´t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("./signup")}>
            <Text className="text-white font-bold text-sm underline">
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ESQUERCER PASS - MODAL ── */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseForgotModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={handleCloseForgotModal}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.7)",
                justifyContent: "flex-end",
              }}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={{
                    width: "100%",
                    backgroundColor: "#121212",
                    borderTopLeftRadius: 40,
                    borderTopRightRadius: 40,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                      padding: 32,
                      paddingBottom: Platform.OS === "ios" ? 48 : 32,
                    }}
                    bounces={false}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 4,
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: 2,
                        alignSelf: "center",
                        marginBottom: 24,
                      }}
                    />
                    <Text className="text-white text-2xl font-bold mb-2 text-center">
                      Reset Password
                    </Text>
                    <Text className="text-white/40 text-xs text-center mb-8">
                      Enter your details exactly as registered
                    </Text>
                    <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-4">
                      <TextInput
                        className="text-white text-base"
                        placeholder="Exact Full Name"
                        placeholderTextColor="#666"
                        autoCapitalize="words"
                        value={forgotName}
                        onChangeText={(t) => {
                          setForgotName(t);
                          if (forgotError) setForgotError("");
                        }}
                      />
                    </View>
                    <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-4">
                      <TextInput
                        className="text-white text-base"
                        placeholder="Email Address"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={forgotEmail}
                        onChangeText={(t) => {
                          setForgotEmail(t);
                          if (forgotError) setForgotError("");
                        }}
                      />
                    </View>
                    <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-4">
                      <TextInput
                        className="text-white text-base"
                        placeholder="New Password"
                        placeholderTextColor="#666"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={(t) => {
                          setNewPassword(t);
                          if (forgotError) setForgotError("");
                        }}
                      />
                    </View>
                    {forgotError ? (
                      <View className="flex-row items-center mb-4 px-1">
                        <Text style={{ color: "#f87171", fontSize: 11 }}>
                          {forgotError}
                        </Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      onPress={handleResetPassword}
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-white justify-center items-center mt-2"
                      style={{ opacity: loading ? 0.6 : 1 }}
                    >
                      <Text className="text-black font-black uppercase tracking-widest text-xs">
                        {loading ? "Updating..." : "Update Password"}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── STATUS MODAL ── */}
      <Modal visible={statusVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 24,
          }}
        >
          <View className="w-full rounded-[35px] overflow-hidden border border-white/10 bg-[#1a1a1a]">
            <View className="p-8 items-center">
              <View
                className={`w-16 h-16 rounded-full justify-center items-center mb-4 ${statusType === "success" ? "bg-green-500/20" : "bg-red-500/20"}`}
              >
                <Text
                  style={{
                    fontSize: 30,
                    color: statusType === "success" ? "#4ade80" : "#f87171",
                  }}
                >
                  {statusType === "success" ? "✓" : "✕"}
                </Text>
              </View>
              <Text className="text-white text-xl font-bold mb-2">
                {statusType === "success" ? "Success!" : "Error"}
              </Text>
              <Text className="text-white/60 text-center mb-8 text-sm">
                {statusMessage}
              </Text>
              <TouchableOpacity
                onPress={() => setStatusVisible(false)}
                className={`w-full h-12 rounded-xl justify-center items-center ${statusType === "success" ? "bg-green-500" : "bg-red-500"}`}
              >
                <Text className="text-white font-bold uppercase text-xs tracking-widest">
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
