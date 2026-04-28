import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useUnits } from "./(tabs)/context/units_context";

export default function UnitsSelection() {
  const router = useRouter();
  const { weightUnit, heightUnit, setWeightUnit, setHeightUnit } = useUnits();

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-[30px] justify-between py-[50px]">
        <View className="items-center mt-10">
          <Text className="text-white text-[28px] font-bold text-center italic">
            Choose your units
          </Text>
          <Text className="text-gray-400 text-base text-center mt-[15px] leading-[22px]">
            You can always change this later in settings
          </Text>
        </View>

        <View style={{ gap: 40 }}>
          <View className="items-center">
            <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-4 font-bold">
              Weight Unit
            </Text>
            <View className="flex-row bg-[#2D2F33] rounded-full p-1 w-52">
              {(["KG", "LB"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  className={`flex-1 h-11 justify-center items-center rounded-full ${weightUnit === u ? "bg-[#E31C25]" : ""}`}
                  onPress={() => setWeightUnit(u)}
                >
                  <Text
                    className={`font-bold text-base ${weightUnit === u ? "text-white" : "text-gray-400"}`}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="items-center">
            <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-4 font-bold">
              Height Unit
            </Text>
            <View className="flex-row bg-[#2D2F33] rounded-full p-1 w-52">
              {(["CM", "FT"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  className={`flex-1 h-11 justify-center items-center rounded-full ${heightUnit === u ? "bg-[#E31C25]" : ""}`}
                  onPress={() => setHeightUnit(u)}
                >
                  <Text
                    className={`font-bold text-base ${heightUnit === u ? "text-white" : "text-gray-400"}`}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View className="flex-row justify-end items-center mb-2">
          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            onPress={() => router.replace("/gender")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
