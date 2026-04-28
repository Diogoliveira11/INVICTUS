import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { login, resetPassword } from "../../src/database";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  // Estados principais
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false); // Evita cliques múltiplos

  // Estados Reset Password
  const [showModal, setShowModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotName, setForgotName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Estados Status
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [statusMessage, setStatusMessage] = useState("");

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
        await AsyncStorage.setItem("userEmail", email.toLowerCase().trim());
        await AsyncStorage.setItem("hasOnboarded", "true");
        await AsyncStorage.setItem("profileComplete", "true");
        router.replace("/(tabs)/home");
      } else {
        setError("Invalid email or password.");
      }
    } catch (e) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    if (!forgotEmail || !forgotName || !newPassword) {
      setStatusType("error");
      setStatusMessage("Please fill in all fields.");
      setStatusVisible(true);
      return;
    }
    setLoading(true);
    try {
      const success = await resetPassword(
        db,
        forgotEmail.toLowerCase().trim(),
        forgotName,
        newPassword,
      );
      if (success) {
        setStatusType("success");
        setStatusMessage("Your password has been updated!");
        setShowModal(false);
        setTimeout(() => setStatusVisible(true), 500); // Delay suave para não bugar a animação
        setForgotEmail("");
        setForgotName("");
        setNewPassword("");
      } else {
        setStatusType("error");
        setStatusMessage("User not found with these credentials.");
        setStatusVisible(true);
      }
    } catch (e) {
      setStatusType("error");
      setStatusMessage("Something went wrong.");
      setStatusVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={require("../../assets/images/onboarding3.png")}
        style={{ width, height, position: "absolute" }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "#000"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.6,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center px-6">
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
                secureTextEntry
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
                    <Text className="text-black text-center text-[10px]">
                      ✓
                    </Text>
                  )}
                </View>
                <Text className="text-white text-xs opacity-70">
                  Remember me
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(true)}>
                <Text className="text-white text-xs opacity-70 underline">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-white h-14 w-full rounded-full justify-center items-center"
              onPress={handleLogin}
            >
              <Text className="text-black font-bold text-lg uppercase">
                Log In
              </Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity
            onPress={() => router.push("/auth/signup")}
            className="mt-8 items-center"
          >
            <Text className="text-white text-sm">
              Don´t have an account?{" "}
              <Text className="font-bold underline">Sign up!</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* --- MODAL RESET PASSWORD --- */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
              }}
            />
          </TouchableWithoutFeedback>

          <View className="w-full rounded-t-[40px] overflow-hidden border-t border-white/20">
            <BlurView intensity={95} tint="dark" className="p-8 pb-12">
              <View className="w-12 h-1 bg-white/20 rounded-full self-center mb-6" />
              <Text className="text-white text-2xl font-bold mb-8">
                Reset Password
              </Text>

              <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-4">
                <TextInput
                  className="text-white text-base"
                  placeholder="Full Name"
                  placeholderTextColor="#666"
                  value={forgotName}
                  onChangeText={setForgotName}
                />
              </View>
              <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-4">
                <TextInput
                  className="text-white text-base"
                  placeholder="Email Address"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
              </View>
              <View className="bg-white/5 rounded-2xl px-4 border border-white/10 h-16 justify-center mb-8">
                <TextInput
                  className="text-white text-base"
                  placeholder="New Password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleResetPassword}
                className="w-full h-14 rounded-2xl overflow-hidden bg-white justify-center items-center"
              >
                <Text className="text-black font-black uppercase tracking-widest text-xs">
                  Update Password
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL STATUS --- */}
      <Modal
        visible={statusVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="w-full rounded-[35px] overflow-hidden border border-white/10">
            <BlurView intensity={100} tint="dark" className="p-8 items-center">
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
                {statusType === "success" ? "Success!" : "Oops!"}
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
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
