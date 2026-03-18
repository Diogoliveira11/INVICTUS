import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dumbbell } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

export default function ProgressResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const marginHeader = Platform.OS === "ios" ? 0 : 10;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View
          style={{
            height: height * 0.58,
            marginTop: insets.top + marginHeader,
            marginHorizontal: 8,
          }}
          className="relative rounded-[45px] overflow-hidden"
        >
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
            }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />

          <View className="absolute inset-0 bg-black/30" />

          <View className="absolute bottom-6 w-full items-center">
            <Text className="text-white text-3xl font-black uppercase tracking-tighter">
              Progress Result
            </Text>

            <Text className="text-[#E31C25] text-2xl font-normal mt-1">
              Full Stats
            </Text>

            <View className="mt-4 bg-zinc-900/90 px-10 py-3 rounded-2xl border border-zinc-800">
              <Text className="text-zinc-200 text-lg font-medium">
                Diogo Oliveira
              </Text>
            </View>
          </View>
        </View>

        {/* Container dos Cards */}
        <View className="flex-row justify-between px-5">
          {/* BOTÃO WORKOUTS */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/workouthistory")}
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-800/50"
          >
            <Text className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">
              Workouts
            </Text>

            <View className="w-20 h-20 rounded-full border-[4px] border-[#E31C25] items-center justify-center relative">
              <View className="absolute w-20 h-20 rounded-full border-[4px] border-zinc-800 -z-10" />
              <Text className="text-white text-2xl font-bold">3/5</Text>
            </View>

            <View className="flex-row mt-5 gap-3">
              <View className="items-center">
                <Text className="text-zinc-300 font-bold text-xl">15</Text>
                <Text className="text-zinc-500 text-[10px] uppercase font-bold">
                  h
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-zinc-300 font-bold text-xl">22</Text>
                <Text className="text-zinc-500 text-[10px] uppercase font-bold">
                  min
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* BOTÃO TOTAL VOLUME */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/volumestats")}
            className="bg-zinc-900/50 w-[48%] p-6 rounded-[35px] items-center border border-zinc-800/50"
          >
            <Text className="text-zinc-400 text-xs font-bold mb-4 uppercase tracking-widest">
              Total Volume
            </Text>

            <View className="h-20 justify-center">
              <Dumbbell size={48} color="#E31C25" />
            </View>

            <View className="mt-5 items-center">
              <Text className="text-zinc-200 text-2xl font-black">19 344</Text>
              <Text className="text-zinc-500 text-sm font-bold uppercase">
                Kg
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Frase Motivacional */}
        <View className="mt-10">
          <Text className="text-zinc-600 text-center italic leading-5 text-sm">
            ´Discipline is the bridge between goals and achievements´
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}