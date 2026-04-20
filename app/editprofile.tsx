import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, HelpCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// @ts-ignore
import InvictusLogo from "../assets/images/logo_invictus.jpeg";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const redColor = "#E31C25";

  useEffect(() => {
    async function loadUserData() {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        if (!email) return;

        const userRow = await db.getFirstAsync<any>(
          "SELECT username, weight, height, profile_picture FROM users WHERE email = ?",
          [email],
        );

        if (userRow) {
          setName(userRow.username || "");
          setWeight(userRow.weight || "");
          setHeight(userRow.height || "");
          setProfileImage(userRow.profile_picture || null);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [db]);

  const handleSave = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      await db.runAsync(
        "UPDATE users SET username = ?, weight = ?, height = ? WHERE email = ?",
        [name, weight, height, email],
      );

      Alert.alert("Sucesso", "Perfil atualizado!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao guardar:", error);
      Alert.alert("Erro", "Falha ao gravar dados na base de dados.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color={redColor} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row justify-between items-center px-6 pb-5 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={28} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white font-black uppercase italic text-xl tracking-tighter">
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            style={{ color: redColor }}
            className="font-black uppercase italic text-xl tracking-tighter"
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* AVATAR */}
        <View className="items-center mt-6">
          <View className="w-24 h-24 rounded-full border-2 border-[#E31C25] p-1">
            <View className="w-full h-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
              <Image
                source={profileImage ? { uri: profileImage } : InvictusLogo}
                className="w-full h-full"
                contentFit={profileImage ? "cover" : "contain"}
              />
            </View>
          </View>
          <TouchableOpacity className="mt-3">
            <Text
              style={{ color: redColor }}
              className="font-black uppercase italic text-[10px]"
            >
              Change Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* INPUTS ENQUADRADOS */}
        <View className="px-6 mt-10">
          <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-4 italic">
            Athlete Data
          </Text>

          {/* Campo Username */}
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Username
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Username"
              placeholderTextColor="#3f3f46"
              className="text-white font-bold text-lg italic text-right flex-1 ml-4"
              selectionColor={redColor}
            />
          </View>

          {/* Campo Peso */}
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Weight
            </Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="0.0"
              placeholderTextColor="#3f3f46"
              keyboardType="numeric"
              className="text-white font-bold text-lg italic text-right flex-1 ml-4"
              selectionColor={redColor}
            />
          </View>

          {/* Campo Altura */}
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Height
            </Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="0"
              placeholderTextColor="#3f3f46"
              keyboardType="numeric"
              className="text-white font-bold text-lg italic text-right flex-1 ml-4"
              selectionColor={redColor}
            />
          </View>
        </View>

        {/* ACCOUNT INFO */}
        <View className="px-6 mt-10">
          <View className="flex-row items-center mb-5 gap-2">
            <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest italic">
              Personal Info
            </Text>
            <HelpCircle size={14} color="#52525b" />
          </View>

          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Gender
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase italic text-sm"
            >
              Male
            </Text>
          </View>

          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Birthday
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase italic text-sm"
            >
              Oct 30, 2005
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
