import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { checkEmailExists, signup } from "../../src/database";

export default function SignupScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const exists = await checkEmailExists(db, email);

    if (exists) {
      setError("Email already registered.");
      return;
    }

    signup(db, username, email, password);
    router.push("/auth/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={require("../../assets/images/onboarding1.jpg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-6 bg-black/40">
          <Text className="text-white text-5xl font-bold mb-10 italic">
            Signup
          </Text>

          <BlurView
            intensity={60}
            tint="dark"
            className="w-full p-8 rounded-[30px] overflow-hidden border border-white/20"
          >
            <View className="mb-6 border-b border-white/30">
              <Text className="text-white text-xs mb-[-4px]">Name</Text>
              <TextInput
                className="text-white h-12 text-lg"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View className="mb-6 border-b border-white/30">
              <Text className="text-white text-xs mb-[-4px]">Email</Text>
              <TextInput
                className="text-white h-12 text-lg"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-8 border-b border-white/30">
              <Text className="text-white text-xs mb-[-4px]">Password</Text>
              <TextInput
                className="text-white h-12 text-lg"
                secureTextEntry
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <Text className="text-red-400 text-xs mb-3">{error}</Text>
            ) : null}

            <TouchableOpacity
              className="bg-white h-[56px] rounded-full justify-center items-center"
              onPress={handleSignup}
            >
              <Text className="text-black font-bold text-lg">SIGN UP</Text>
            </TouchableOpacity>
          </BlurView>

          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            className="mt-8"
          >
            <Text className="text-white text-sm">
              Already have an account?{" "}
              <Text className="font-bold underline">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
