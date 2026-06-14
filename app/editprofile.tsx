import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, HelpCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "../context/units_context";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { weightUnit, heightUnit } = useUnits();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

      {/* HEADER CORRIGIDO — SEM BOTÃO DONE */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/profile")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide mr-9">
          Profile Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* FOTO DE PERFIL — APENAS VISUALIZAÇÃO */}
        <View className="items-center mt-6">
          <View className="w-24 h-24 rounded-full border-2 border-[#E31C25] p-1">
            <View className="w-full h-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
              {profileImage ? (
                <RNImage
                  key={profileImage}
                  source={{ uri: profileImage }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <RNImage
                  source={require("../assets/images/logo_invictus.jpeg")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </View>

        <View className="px-6 mt-10">
          <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-4 ">
            Athlete Data
          </Text>

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Username
            </Text>
            <Text className="text-white font-bold text-lg text-right">
              {name}
            </Text>
          </View>

          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Weight ({weightUnit})
            </Text>
            <Text className="text-white font-bold text-lg text-right">
              {weight || "—"}
            </Text>
          </View>

          {/* ALTURA CORRIGIDA PARA APENAS TEXTO */}
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Height ({heightUnit})
            </Text>
            <Text className="text-white font-bold text-lg text-right">
              {height || "—"}
            </Text>
          </View>
        </View>

        <View className="px-6 mt-10">
          <View className="flex-row items-center mb-5 gap-2">
            <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest ">
              Personal Info
            </Text>
            <HelpCircle size={14} color="#52525b" />
          </View>

          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Gender
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase text-sm"
            >
              {gender}
            </Text>
          </View>

          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Birthday
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase text-sm"
            >
              {birthday}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
