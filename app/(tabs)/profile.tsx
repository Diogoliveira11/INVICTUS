import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ArrowRight,
  ChevronDown,
  Dumbbell,
  Pencil,
  Settings,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Dados estáticos para o gráfico
const chartData = [
  { day: "Jan 25", value: 1.5 },
  { day: "", value: 0 },
  { day: "Feb 1", value: 3.8 },
  { day: "", value: 2.5 },
  { day: "Feb 8", value: 2.8 },
  { day: "", value: 4.2 },
  { day: "Feb 22", value: 1.8 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("Duration");

  // Função para desenhar o gráfico com barras vermelhas
  const BarChart = () => {
    const maxBarHeight = 120;
    const barWidth = 14;

    return (
      <View className="items-center mt-3">
        <View className="flex-row items-end h-[120px] relative w-full pr-1">
          {[1, 2, 3, 4, 5].map((_, index) => (
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
                className="bg-[#E31C25] rounded-t-sm" // COR VERMELHA NAS BARRAS
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

  // Botões de filtro (Duration, Volume, Reps) - Tipados para TS
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

  // Botões de ação (Statistics, etc.) - Tipados para TS
  const ActionButton = ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress} // Executa a função que passares lá em baixo
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
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="flex-row justify-end items-center px-5 py-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => console.log("Sign Out")}>
              <Text className="text-[#E31C25] font-semibold text-base pr-3">
                Log out
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-2">
              {/* BOTÃO EDITAR CONFIGURADO */}
              <TouchableOpacity
                onPress={() => router.push("/editprofile")} // Redireciona para editprofile.tsx
                className="bg-zinc-800 w-12 h-12 rounded-full items-center justify-center"
              >
                <Pencil size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* BOTÃO DEFINIÇÕES */}
              <TouchableOpacity
                onPress={() => router.push("/settings")} // Exemplo para definições
                className="bg-zinc-800 w-12 h-12 rounded-full items-center justify-center"
              >
                <Settings size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* PROFILE INFO - Com espaçamento corrigido */}
        <View className="px-5 mt-6 flex-row items-center gap-6">
          {/* Avatar com borda e sombra suave */}
          <View className="shadow-lg">
            <Image
              source={{
                uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
              }}
              className="w-24 h-24 rounded-full border-2 border-zinc-800"
              resizeMode="cover"
            />
          </View>

          {/* Container de Texto com espaçamento interno */}
          <View className="flex-1">
            {/* Secção de Estatísticas (Joined/Workouts) com gap */}
            <View className="flex-row gap-5">
              <View>
                <Text className="text-zinc-500 text-xs">Joined</Text>
                <Text className="text-white font-bold text-sm">
                  2 month ago
                </Text>
              </View>
              <View>
                <Text className="text-zinc-500 text-xs">Workouts</Text>
                <Text className="text-white font-bold text-sm">17</Text>
              </View>
            </View>

            {/* Nome com margem superior para afastar das estatísticas */}
            <View className="mt-4">
              <Text className="text-white text-2xl font-black leading-7">
                Diogo
              </Text>
              <Text className="text-zinc-400 text-xl font-black leading-6">
                Oliveira
              </Text>
            </View>
          </View>
        </View>

        {/* CHART CARD */}
        <View className="bg-zinc-900/40 mx-3 p-4 rounded-3xl mt-5 border border-zinc-900/80">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white font-black text-xl leading-5">
                2 hours
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
            onPress={() => router.push("../statistics")}
          />

          <ActionButton
            label="Exercises"
            onPress={() => router.push("../exercises")}
          />

          <ActionButton
            label="Measures"
            onPress={() => router.push("../measures")}
          />

          <ActionButton
            label="Calendar"
            onPress={() => router.push("../calendar")}
          />
        </View>

        {/* ACTIVITY SUMMARY */}
        <TouchableOpacity className="bg-zinc-900 mx-5 p-4 rounded-3xl mt-4 border border-zinc-800">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-sm font-bold uppercase tracking-widest">
              Chest | Triceps | Lateral Raise
            </Text>
            <ArrowRight size={18} color="#E31C25" />
          </View>

          <View className="flex-row gap-5 mb-3">
            <View>
              <Text className="text-zinc-500 text-[10px]">Duration</Text>
              <Text className="text-zinc-100 font-bold text-xs">1h 42min</Text>
            </View>
            <View>
              <Text className="text-zinc-500 text-[10px]">Volume</Text>
              <Text className="text-zinc-100 font-bold text-xs">5,923 kg</Text>
            </View>
            <View>
              <Text className="text-zinc-500 text-[10px]">Records</Text>
              <Text className="text-[#FFC107] font-bold text-xs">🏆 2</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 mb-2">
            <Dumbbell size={16} color="#71717A" />
            <Text className="text-zinc-400 text-xs">
              5 sets Decline Bench Press (Barbell)
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Dumbbell size={16} color="#71717A" />
            <Text className="text-zinc-400 text-xs">
              4 sets Iso-Lateral Chest Press (Machine)
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
