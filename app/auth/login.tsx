import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient"; // Certifica-te que instalaste
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
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

    try {
      // 1. Verificar se este email já é o que está guardado no dispositivo
      const storedEmail = await AsyncStorage.getItem("userEmail");

      if (storedEmail === email.toLowerCase().trim()) {
        setError("You are already logged into this account.");
        // Opcional: router.replace("/(tabs)/home"); se quiseres apenas mandá-lo para dentro
        return;
      }

      const user = (await login(db, email, password)) as any;

      if (user) {
        setError("");
        // Guardamos sempre o email para futuras verificações ou "Remember me"
        await AsyncStorage.setItem("userEmail", email.toLowerCase().trim());
        await AsyncStorage.setItem("hasOnboarded", "true");
        await AsyncStorage.setItem("profileComplete", "true");
        router.replace("/(tabs)/home");
      } else {
        setError("Invalid email or password.");
      }
    } catch (e) {
      setError("An error occurred during login.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* 1. IMAGEM DE FUNDO (CAMADA 0) */}
      <Image
        source={require("../../assets/images/onboarding3.png")}
        style={{ width, height, position: "absolute" }}
        resizeMode="cover"
      />

      {/* 2. GRADIENTE (CAMADA 1) - Colocado de forma a não tapar o conteúdo */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.5,
        }}
      />

      {/* 3. CONTEÚDO (CAMADA 2) */}
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

          {/* Email Input */}
          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs">Email</Text>
            <TextInput
              className="text-white h-11 text-lg"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs">Password</Text>
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

          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center"
            >
              <View
                className={`w-5 h-5 rounded border mr-2 ${rememberMe ? "bg-white" : "border-white/40"}`}
              >
                {rememberMe && (
                  <Text className="text-black text-center text-xs">✓</Text>
                )}
              </View>
              <Text className="text-white text-xs opacity-70">Remember me</Text>
            </TouchableOpacity>
            <Text className="text-white text-xs opacity-70">
              Forgot Password?
            </Text>
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

        {/* Botão de Sign Up fora do BlurView */}
        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          className="mt-8 items-center"
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
