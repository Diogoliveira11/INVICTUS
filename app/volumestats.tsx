import { useRouter } from "expo-router";
import { Award, ChevronLeft, TrendingUp } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VolumeStats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => router.push("/home")}
          className="bg-zinc-900 p-2 rounded-full"
        >
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-black ml-4 uppercase tracking-tighter">
          Total Volume
        </Text>
      </View>

      <ScrollView className="px-6 mt-4" showsVerticalScrollIndicator={false}>
        {/* Card Principal */}
        <View className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[40px] items-center mb-6">
          <Award color="#E31C25" size={48} />
          <Text className="text-zinc-400 font-bold uppercase tracking-widest mt-4 text-xs">
            Total Lifted
          </Text>
          <Text className="text-white text-5xl font-black mt-2">19 344</Text>
          <Text className="text-[#E31C25] text-xl font-bold uppercase">Kg</Text>
        </View>
{/* Estatísticas de Progresso */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-zinc-900/50 border border-zinc-800 w-[48%] p-6 rounded-[35px]">
            <TrendingUp color="#E31C25" size={24} />
            <Text className="text-white text-2xl font-black mt-4">+12%</Text>
            <Text className="text-zinc-500 text-xs font-bold uppercase tracking-tighter">
              Este Mês
            </Text>
          </View>
          <View className="bg-zinc-900/50 border border-zinc-800 w-[48%] p-6 rounded-[35px]">
            <Award color="#E31C25" size={24} />
            <Text className="text-white text-2xl font-black">1.2k</Text>
            <Text className="text-zinc-500 text-xs font-bold uppercase tracking-tighter">
              Repetições
            </Text>
          </View>
        </View>

        <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-800/50">
          <Text className="text-zinc-400 text-center italic text-sm leading-5">
            Your only limit is your mind. Keep pushing those weights.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}