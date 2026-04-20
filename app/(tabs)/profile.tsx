import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Settings,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Dados para o gráfico
const chartData = [
  { day: "Jan 25", value: 1.5 },
  { day: "", value: 0 },
  { day: "Feb 1", value: 3.8 },
  { day: "", value: 2.5 },
  { day: "Feb 8", value: 2.8 },
  { day: "", value: 4.2 },
  { day: "Apr 6", value: 1.8 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();

  const [userData, setUserData] = useState<{
    username: string;
    email: string;
    created_count: string;
    profile_picture?: string;
  } | null>(null);

  const [workoutCount, setWorkoutCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Duration");

  const loadProfileData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      // 1. Buscar dados dinâmicos
      const userRow = await db.getFirstAsync<any>(
        "SELECT username, email, created_count, profile_picture FROM users WHERE email = ?",
        [email],
      );

      if (userRow) {
        setUserData(userRow);

        // 2. Contar treinos reais
        const countResult = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = ?)",
          [email],
        );
        setWorkoutCount(countResult?.count || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  }, [db]);

  useEffect(() => {
    if (isFocused) {
      loadProfileData();
    }
  }, [isFocused, loadProfileData]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userEmail");
    router.replace("/auth/login");
  };

  const formatDate = (dateString: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) return "Apr 2026";
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const FilterButton = ({ label }: { label: string }) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(label)}
        className={`px-5 py-2 rounded-full mr-2 border ${
          isActive
            ? "bg-[#E31C25] border-[#E31C25]"
            : "bg-zinc-900 border-zinc-800"
        }`}
      >
        <Text
          className={`font-black text-[10px] uppercase italic ${isActive ? "text-white" : "text-zinc-500"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const BarChart = () => (
    <View className="items-center mt-3">
      <View className="flex-row items-end h-[120px] relative w-full pr-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="absolute left-0 right-0 h-[1px] bg-zinc-800/50"
            style={{ bottom: i * 24 }}
          />
        ))}
        <View className="flex-row items-end justify-between flex-1 pl-4 h-full">
          {chartData.map((bar, index) => (
            <View
              key={index}
              className="bg-[#E31C25] rounded-t-sm"
              style={{
                width: 14,
                height: (bar.value / 4.5) * 120,
                marginHorizontal: 2,
              }}
            />
          ))}
        </View>
      </View>
      <View className="flex-row justify-between w-full pl-3 pr-1 mt-1">
        {chartData.map((bar, index) =>
          bar.day ? (
            <Text
              key={index}
              className="text-zinc-600 text-[10px] font-bold italic"
              style={{ width: 35, textAlign: "center" }}
            >
              {bar.day}
            </Text>
          ) : (
            <View key={index} style={{ width: 35 }} />
          ),
        )}
      </View>
    </View>
  );

  const ActionButton = ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center justify-between bg-zinc-900/50 w-full py-5 px-8 rounded-3xl mb-3 border border-zinc-800"
    >
      <Text className="text-white font-black text-lg uppercase italic tracking-tighter">
        {label}
      </Text>
      <ChevronRight size={20} color="#E31C25" strokeWidth={3} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER - COM SETTINGS DE VOLTA */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-zinc-600 font-black uppercase italic tracking-widest text-[10px]">
            Athlete Profile
          </Text>
          <View className="flex-row items-center gap-x-3">
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800"
            >
              <Text className="text-[#E31C25] font-black text-[10px] uppercase italic">
                Logout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/editprofile")}
              className="bg-zinc-900/80 w-10 h-10 rounded-xl items-center justify-center border border-zinc-800"
            >
              <Pencil size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* BOTÃO DE DEFINIÇÕES RECOLOCADO */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: { email: userData?.email },
                })
              }
              className="bg-zinc-900/80 w-10 h-10 rounded-xl items-center justify-center border border-zinc-800"
            >
              <Settings size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE INFO */}
        <View className="px-6 mt-6 flex-row items-center">
          <View className="w-[105px] h-[105px] rounded-full border-[3px] border-[#E31C25] items-center justify-center">
            <View className="w-[92px] h-[92px] rounded-full border-2 border-black overflow-hidden bg-zinc-900">
              <Image
                source={{
                  uri:
                    userData?.profile_picture ||
                    "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>

          <View className="flex-1 ml-6">
            <View className="mb-3">
              <Text className="text-white text-4xl font-black italic uppercase leading-[34px] tracking-tighter">
                {userData?.username?.split(" ")[0] || "User"}
              </Text>
              <Text className="text-[#E31C25] text-2xl font-black italic uppercase tracking-tighter opacity-90 mt-[-2px]">
                {userData?.username?.split(" ").slice(1).join(" ") || ""}
              </Text>
            </View>

            <View className="flex-row gap-x-5 border-t border-zinc-900 pt-3">
              <View>
                <Text className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">
                  Joined
                </Text>
                <Text className="text-zinc-100 font-bold text-xs uppercase italic">
                  {formatDate(userData?.created_count || "")}
                </Text>
              </View>
              <View>
                <Text className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">
                  Workouts
                </Text>
                <Text className="text-zinc-100 font-bold text-xs uppercase italic">
                  {workoutCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CHART CARD */}
        <View className="bg-zinc-900/30 mx-4 p-5 rounded-[35px] mt-10 border border-zinc-800/60 shadow-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-white font-black text-2xl italic tracking-tighter uppercase">
                {workoutCount > 0 ? "Activity" : "No Data"}
              </Text>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest italic">
                Performance tracker
              </Text>
            </View>
            <TouchableOpacity className="flex-row items-center gap-1 bg-zinc-800/50 px-4 py-1.5 rounded-full border border-zinc-700/50">
              <Text className="text-zinc-300 text-[10px] font-bold uppercase italic">
                3 Months
              </Text>
              <ChevronDown size={12} color="#E31C25" strokeWidth={4} />
            </TouchableOpacity>
          </View>

          <BarChart />

          <View className="flex-row mt-6 justify-center">
            <FilterButton label="Duration" />
            <FilterButton label="Volume" />
            <FilterButton label="Reps" />
          </View>
        </View>

        {/* MAIN ACTIONS */}
        <View className="px-6 mt-10 mb-20">
          <ActionButton
            label="Statistics"
            onPress={() => router.push("/volumestats")}
          />
          <ActionButton label="Body Measures" onPress={() => {}} />
          <ActionButton
            label="Workout History"
            onPress={() => router.push("/workouthistory")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
