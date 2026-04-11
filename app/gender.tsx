import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ChevronRight, Mars, Venus } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { updateUserGender } from "../src/database";

export default function GenderSelection() {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const router = useRouter();
  const db = useSQLiteContext();

  const isReady = gender !== null;

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      await updateUserGender(db, userEmail!, gender!);
      router.push("/birthday");
    } catch (e) {
      console.error("Erro ao guardar gender:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-[30px] justify-between py-[50px]">
        <View className="items-center mt-10">
          <Text className="text-white text-[28px] font-bold text-center italic">
            Tell us about yourself!
          </Text>
          <Text className="text-gray-400 text-base text-center mt-[15px] leading-[22px]">
            To give you a better experience we need to know your gender
          </Text>
        </View>

        <View className="items-center" style={{ gap: 40 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setGender("male")}
            className={`w-[160px] h-[160px] rounded-full justify-center items-center shadow-lg shadow-black ${
              gender === "male" ? "bg-[#E31C25]" : "bg-[#2D2F33]"
            }`}
          >
            <Mars color="white" size={60} strokeWidth={2.5} />
            <Text className="text-white mt-2.5 text-base font-medium">
              Male
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setGender("female")}
            className={`w-[160px] h-[160px] rounded-full justify-center items-center shadow-lg shadow-black ${
              gender === "female" ? "bg-[#E31C25]" : "bg-[#2D2F33]"
            }`}
          >
            <Venus color="white" size={60} strokeWidth={2.5} />
            <Text className="text-white mt-2.5 text-base font-medium">
              Female
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-end items-center mb-2">
          <TouchableOpacity
            disabled={!isReady}
            activeOpacity={0.8}
            onPress={handleNext}
            className={`flex-row items-center py-4 px-8 rounded-full ${
              isReady ? "bg-[#E31C25]" : "bg-zinc-800 opacity-50"
            }`}
          >
            <Text
              className={`text-lg font-bold mr-2 ${
                isReady ? "text-white" : "text-gray-500"
              }`}
            >
              Next
            </Text>
            <ChevronRight color={isReady ? "white" : "#666"} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
