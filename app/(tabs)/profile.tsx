import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router"; // Adicionado useLocalSearchParams
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, Pencil, Settings } from "lucide-react-native";
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

  // 1. Mover os params para DENTRO do componente
  const params = useLocalSearchParams();
  const [userEmail, setUserEmail] = useState<string>(params.email as string);

  const [activeFilter, setActiveFilter] = useState("Duration");
  const [history, setHistory] = useState<any[]>([]);

  // Tenta recuperar o email do AsyncStorage se o params falhar
  useEffect(() => {
    const checkEmail = async () => {
      if (!userEmail) {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (storedEmail) setUserEmail(storedEmail);
      }
    };
    checkEmail();
  }, [userEmail]);

  const loadProfileData = useCallback(async () => {
    try {
      const result = await db.getAllAsync<any>(
        "SELECT * FROM workouts ORDER BY id DESC",
      );
      setHistory(result || []);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  }, [db]);

  useEffect(() => {
    if (isFocused) loadProfileData();
  }, [isFocused, loadProfileData]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userEmail");
    router.replace("/auth/login");
  };

  const BarChart = () => {
    const maxBarHeight = 120;
    const barWidth = 14;

    return (
      <View className="items-center mt-3">
        <View className="flex-row items-end h-[120px] relative w-full pr-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <View
              key={index}
              className="absolute left-0 right-0 h-[1px] bg-zinc-800"
              style={{ bottom: index * 24 }}
            />
          ))}

          <View className="flex-row items-end justify-between flex-1 pl-4 h-full">
            {chartData.map((bar, index) => (
              <View
                key={index}
                className="bg-[#E31C25] rounded-t-sm"
                style={{
                  width: barWidth,
                  height: (bar.value / 4.5) * maxBarHeight,
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
                className="text-zinc-600 text-[10px]"
                style={{ width: barWidth * 2.5, textAlign: "center" }}
              >
                {bar.day}
              </Text>
            ) : (
              <View key={index} style={{ width: barWidth * 2.5 }} />
            ),
          )}
        </View>
      </View>
    );
  };

  const FilterButton = ({ label }: { label: string }) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(label)}
        className={`px-5 py-2 rounded-full mr-2 ${
          isActive ? "bg-[#E31C25]" : "bg-zinc-800"
        }`}
      >
        <Text
          className={`font-bold text-xs ${isActive ? "text-white" : "text-zinc-300"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const ActionButton = ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-[#E31C25] w-[48%] py-3 rounded-full items-center mb-3"
    >
      <Text className="text-white font-bold text-base">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="flex-row justify-end items-center px-5 py-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-[#E31C25] font-semibold text-base pr-3">
                Log out
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => router.push("/editprofile")}
                className="bg-zinc-800 w-12 h-12 rounded-full items-center justify-center"
              >
                <Pencil size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/settings",
                    params: { email: userEmail },
                  })
                }
              >
                <Settings size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PROFILE INFO */}
        <View className="px-5 mt-4 flex-row items-center gap-6">
          <View className="shadow-lg">
            <Image
              source={{
                uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
              }}
              className="w-24 h-24 rounded-full border-2 border-zinc-800"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1">
            <View className="flex-row gap-5">
              <View>
                <Text className="text-zinc-500 text-xs uppercase font-bold">
                  Joined
                </Text>
                <Text className="text-white font-black text-sm uppercase">
                  Apr 2026
                </Text>
              </View>
              <View>
                <Text className="text-zinc-500 text-xs uppercase font-bold">
                  Workouts
                </Text>
                <Text className="text-white font-black text-sm">
                  {history.length}
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-white text-2xl font-black italic uppercase">
                DIOGO
              </Text>
              <Text className="text-zinc-400 text-xl font-black italic uppercase">
                OLIVEIRA
              </Text>
            </View>
          </View>
        </View>

        {/* CHART CARD */}
        <View className="bg-zinc-900/40 mx-3 p-4 rounded-3xl mt-8 border border-zinc-900/80">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white font-black text-xl leading-5">
                {history.length > 0 ? "Active" : "0 hours"}
              </Text>
              <Text className="text-zinc-400 text-xs">this week</Text>
            </View>

            <TouchableOpacity className="flex-row items-center gap-1 bg-zinc-800/80 px-3 py-1 rounded-full">
              <Text className="text-zinc-300 text-xs">Last 3 months</Text>
              <ChevronDown size={14} color="#71717A" />
            </TouchableOpacity>
          </View>

          <BarChart />

          <View className="flex-row mt-4">
            <FilterButton label="Duration" />
            <FilterButton label="Volume" />
            <FilterButton label="Reps" />
          </View>
        </View>

        {/* ACTION BUTTONS GRID */}
        <View className="flex-row flex-wrap justify-between px-5 mt-6">
          <ActionButton
            label="Statistics"
            onPress={() => router.push("/volumestats")}
          />
          <ActionButton
            label="Exercises"
            onPress={() => router.push("/exercises")}
          />
          <ActionButton label="Measures" onPress={() => {}} />
          <ActionButton
            label="Calendar"
            onPress={() => router.push("/workouthistory")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
