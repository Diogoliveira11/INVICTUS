import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image"; // Mantemos para o logo padrão
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Camera,
  Check,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"; // Importante para URIs locais
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "./(tabs)/context/units_context"; // IMPORTAÇÃO DO CONTEXTO

// @ts-ignore
import InvictusLogo from "../assets/images/logo_invictus.jpeg";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { weightUnit, heightUnit } = useUnits(); // ACESSO ÀS UNIDADES

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const redColor = "#E31C25";

  useEffect(() => {
    async function loadUserData() {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        if (!email) return;

        const userRow = await db.getFirstAsync<any>(
          "SELECT username, weight, height, profile_picture, gender, birthday FROM users WHERE email = ?",
          [email],
        );

        if (userRow) {
          setName(userRow.username || "");
          setWeight(userRow.weight ? String(userRow.weight) : "");
          setHeight(userRow.height ? String(userRow.height) : "");
          setProfileImage(userRow.profile_picture || null);
          setGender(userRow.gender || "Not set");

          if (userRow.birthday) {
            const date = new Date(userRow.birthday);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            setBirthday(formattedDate);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [db]);

  const pickImage = async (useCamera: boolean) => {
    setShowImageModal(false);
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Need access to camera/gallery.");
      return;
    }

    const result = await (useCamera
      ? ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        })
      : ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        }));

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      await db.runAsync(
        "UPDATE users SET weight = ?, height = ?, profile_picture = ? WHERE email = ?",
        [weight, height, profileImage, email],
      );
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
              {profileImage ? (
                <RNImage
                  key={profileImage} // Força o refresh visual
                  source={{ uri: profileImage }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={InvictusLogo}
                  className="w-full h-full"
                  contentFit="contain"
                />
              )}
            </View>
          </View>
          <TouchableOpacity
            className="mt-3"
            onPress={() => setShowImageModal(true)}
          >
            <Text
              style={{ color: redColor }}
              className="font-black uppercase italic text-[10px]"
            >
              Change Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* ATLETA DATA COM UNIDADES DINÂMICAS */}
        <View className="px-6 mt-10">
          <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-4 italic">
            Athlete Data
          </Text>

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Username
            </Text>
            <Text className="text-white font-bold text-lg italic text-right">
              {name}
            </Text>
          </View>

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase italic text-xs">
              Weight ({weightUnit})
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
              Height ({heightUnit})
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
              {gender}
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
              {birthday}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ESCOLHER IMAGEM */}
      <Modal visible={showImageModal} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowImageModal(false)}
        >
          <View className="bg-[#121212] p-8 rounded-t-[40px] border-t border-zinc-800">
            <Text className="text-white text-center font-black uppercase italic mb-6">
              Choose Source
            </Text>
            <View className="flex-row justify-around mb-4">
              <TouchableOpacity
                onPress={() => pickImage(true)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-4 rounded-full mb-2 border border-zinc-800">
                  <Camera color={redColor} size={30} />
                </View>
                <Text className="text-white font-bold text-xs">Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage(false)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-4 rounded-full mb-2 border border-zinc-800">
                  <ImageIcon color={redColor} size={30} />
                </View>
                <Text className="text-white font-bold text-xs">Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SUCESSO */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
            <View className="bg-green-500/10 p-4 rounded-full mb-6">
              <Check color="#22c55e" size={32} />
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
