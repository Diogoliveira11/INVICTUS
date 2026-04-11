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
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { checkEmailExists, signup } from "../../src/database";

const { width, height } = Dimensions.get("window");

export default function SignupScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const exists = await checkEmailExists(db, email);
      if (exists) {
        setError("Email already registered.");
        return;
      }

      signup(db, username, email, password);

      if (rememberMe) {
        await AsyncStorage.setItem("userEmail", email);
      }
      await AsyncStorage.setItem("hasOnboarded", "true");

      router.push("/gender");
    } catch (e) {
      console.error("Erro no signup:", e);
      setError("An error occurred during signup.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={require("../../assets/images/onboarding1.jpg")}
        style={{ width, height, position: "absolute" }}
        resizeMode="cover"
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.6)", "#000"]}
        locations={[0, 0.5, 0.6, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-6">
          <Text
            className="text-white text-5xl font-bold mb-10 text-center"
            style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
          >
            Sign up
          </Text>

          <BlurView
            intensity={80}
            tint="dark"
            className="w-full p-8 rounded-[30px] overflow-hidden border border-white/20"
          >
            <View className="mb-6 border-b border-white/30">
              <Text className="text-white text-xs mb-[-2px]">Name</Text>
              <TextInput
                className="text-white h-11 text-lg"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View className="mb-6 border-b border-white/30">
              <Text className="text-white text-xs mb-[-2px]">Email</Text>
              <TextInput
                className="text-white h-11 text-lg"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-6 border-b border-white/30">
              <Text className="text-white text-xs mb-[-2px]">Password</Text>
              <TextInput
                className="text-white h-11 text-lg"
                secureTextEntry
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <Text className="text-red-400 text-xs mb-3">{error}</Text>
            ) : null}

            {/* Remember Me */}
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border mr-2 ${
                    rememberMe ? "bg-white" : "border-white/40"
                  }`}
                >
                  {rememberMe && (
                    <Text className="text-black text-center text-xs">✓</Text>
                  )}
                </View>
                <Text className="text-white text-xs opacity-70">
                  Remember me
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-white h-[56px] rounded-full justify-center items-center"
              onPress={handleSignup}
            >
              <Text className="text-black font-bold text-lg uppercase">
                Sign Up
              </Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            className="mt-8"
          >
            <Text className="text-white text-sm">
              {"Already have an account? "}
              <Text className="font-bold underline">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
