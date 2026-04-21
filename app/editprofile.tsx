import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Check, HelpCircle } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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

  // Estado para o Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
          setWeight(userRow.weight ? String(userRow.weight) : "");
          setHeight(userRow.height ? String(userRow.height) : "");
          setProfileImage(userRow.profile_picture || null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
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

      // Mostra o modal customizado em vez do Alert
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving:", error);
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

        {/* INPUTS */}
        <View className="px-6 mt-10">
          <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-4 italic">
            Athlete Data
          </Text>

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

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Weight (kg)
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

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Height (cm)
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

        {/* PERSONAL INFO */}
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

      {/* SUCCESS MODAL (INVICTUS STYLE) */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
            <View className="bg-green-500/10 p-4 rounded-full mb-6 border border-green-500/20">
              <Check color="#22c55e" size={32} strokeWidth={3} />
            </View>

            <Text className="text-white text-center text-xl font-black uppercase italic mb-3">
              Success!
            </Text>

            <Text className="text-zinc-500 text-center text-sm font-bold uppercase mb-8">
              Profile updated successfully.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              className="w-full bg-[#E31C25] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase italic text-lg">
                Great!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
