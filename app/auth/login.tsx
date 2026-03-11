import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
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

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Imagem de Fundo - Usando a mesma lógica do Onboarding */}
      <Image
        source={require("../../assets/images/onboarding3.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <View className="flex-1 justify-center items-center px-6 bg-black/30">
        {/* Título Principal */}
        <Text
          className="text-white text-5xl font-bold mb-10 text-center"
          style={{ fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}
        >
          Login
        </Text>

        {/* Cartão de Vidro */}
        <BlurView
          intensity={80}
          tint="dark"
          className="w-full p-8 rounded-[30px] overflow-hidden border border-white/20"
        >
          <Text className="text-white text-2xl font-bold mb-6 text-left">
            Welcome Back
          </Text>

          {/* Grupo de Input: Email */}
          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs mb-[-2px]">Email</Text>
            <TextInput
              className="text-white h-11 text-lg"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Grupo de Input: Password */}
          <View className="mb-5 border-b border-white/30">
            <Text className="text-white text-xs mb-[-2px]">Password</Text>
            <TextInput
              className="text-white h-11 text-lg"
              secureTextEntry
              placeholderTextColor="#ccc"
            />
          </View>

          {/* Esqueci-me da Password */}
          <TouchableOpacity className="self-end mb-6">
            <Text className="text-white text-xs opacity-70">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Botão de Login */}
          <TouchableOpacity
            className="bg-white h-[56px] rounded-full justify-center items-center"
            onPress={() => router.push("/GenderSelection")}
          >
            <Text className="text-black font-bold text-lg uppercase">
              Log In
            </Text>
          </TouchableOpacity>
        </BlurView>

        {/* Link para Signup */}
        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          className="mt-8"
        >
          <Text className="text-white text-sm">
            {"Don't have an account? "}
            <Text className="font-bold underline">Sign up!</Text>
          </Text>
        </TouchableOpacity>

        <Text className="text-white/40 mt-6 text-xs italic">Need Help?</Text>
      </View>
    </View>
  );
}
