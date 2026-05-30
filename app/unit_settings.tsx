import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "../context/units_context";

export default function UnitSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { weightUnit, heightUnit, setWeightUnit, setHeightUnit } = useUnits();

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black flex-1 text-center px-4">
          Units
        </Text>
        <View className="w-10" />
      </View>

      <View className="px-5 mt-10" style={{ gap: 40 }}>
        <View className="items-center">
          <Text className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-black">
            Weight Unit
          </Text>
          <View className="flex-row bg-zinc-900 rounded-full p-1 w-52 border border-zinc-800">
            {(["KG", "LB"] as const).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setWeightUnit(u)}
                className={`flex-1 h-11 justify-center items-center rounded-full ${weightUnit === u ? "bg-[#E31C25]" : ""}`}
              >
                <Text
                  className={`font-black text-base ${weightUnit === u ? "text-white" : "text-zinc-500"}`}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="items-center">
          <Text className="text-zinc-500 text-xs uppercase tracking-widest mb-4 font-black">
            Height Unit
          </Text>
          <View className="flex-row bg-zinc-900 rounded-full p-1 w-52 border border-zinc-800">
            {(["CM", "FT"] as const).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setHeightUnit(u)}
                className={`flex-1 h-11 justify-center items-center rounded-full ${heightUnit === u ? "bg-[#E31C25]" : ""}`}
              >
                <Text
                  className={`font-black text-base ${heightUnit === u ? "text-white" : "text-zinc-500"}`}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
