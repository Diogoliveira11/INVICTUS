import { useRouter } from "expo-router";
import { ChevronRight, Mars, Venus } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function GenderSelection() {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const router = useRouter();

  // Variável booleana para verificar se algo foi selecionado
  const isReady = gender !== null;

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-[30px] justify-between py-[50px]">
        {/* Header */}
        <View className="items-center mt-10">
          <Text className="text-white text-[28px] font-bold text-center italic">
            Tell us about yourself!
          </Text>
          <Text className="text-gray-400 text-base text-center mt-[15px] leading-[22px]">
            To give you a better experience we need to know your gender
          </Text>
        </View>

        {/* Selection Area */}
        <View className="items-center" style={{ gap: 40 }}>
          {/* Male Button */}
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

          {/* Female Button */}
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

        {/* Footer Navigation */}
        <View className="flex-row justify-end items-center mb-2">
          {/* Botão Next com Validação */}
          <TouchableOpacity
            // 1. Desativa o clique se isReady for false
            disabled={!isReady}
            activeOpacity={0.8}
            onPress={() => router.push("/video")}
            // 2. Muda o estilo baseado na seleção
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
