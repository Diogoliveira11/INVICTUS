import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { login } from "../../src/database";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const user = (await login(db, email, password)) as any;

    if (user) {
      setError("");
      if (rememberMe) {
        await AsyncStorage.setItem("userEmail", email);
      }
      await AsyncStorage.setItem("hasOnboarded", "true");
      router.replace("/(tabs)/home");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={require("../../assets/images/onboarding3.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <View className="flex-1 justify-center items-center px-6 bg-black/30">
        <Text
          className="text-white text-5xl font-bold mb-10 text-center"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Login
        </Text>

        <BlurView
          intensity={80}
          tint="dark"
          className="w-full p-8 rounded-[30px] overflow-hidden border border-white/20"
        >
          <Text className="text-white text-2xl font-bold mb-6 text-left">
            Welcome Back
          </Text>

          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs mb-[-2px]">Email</Text>
            <TextInput
              className="text-white h-11 text-lg"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs mb-[-2px]">Password</Text>
            <TextInput
              className="text-white h-11 text-lg"
              secureTextEntry
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? (
            <Text className="text-red-400 text-xs mb-3">{error}</Text>
          ) : null}

          {/* Remember Me + Forgot Password */}
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center gap-2"
            >
              <View
                className={`w-5 h-5 rounded border ${
                  rememberMe ? "bg-white border-white" : "border-white/40"
                } items-center justify-center`}
              >
                {rememberMe && (
                  <Text className="text-black text-xs font-bold">✓</Text>
                )}
              </View>
              <Text className="text-white text-xs opacity-70">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="text-white text-xs opacity-70">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-white h-[56px] rounded-full justify-center items-center"
            onPress={handleLogin}
          >
            <Text className="text-black font-bold text-lg uppercase">
              Log In
            </Text>
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          className="mt-8"
        >
          <Text className="text-white text-sm">
            {"Don't have an account? "}
            <Text className="font-bold underline">Sign up!</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
