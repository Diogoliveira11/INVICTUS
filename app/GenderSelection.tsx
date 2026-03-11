import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Mars, Venus } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

export default function GenderSelection() {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const router = useRouter();

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

        {/* Selection Area - Usando gap para separação garantida */}
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
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            onPress={() => router.push("/BirthdaySelection")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
