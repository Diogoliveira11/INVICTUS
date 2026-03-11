import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Aumentado para dar mais destaque e espaço à caixa
const ITEM_HEIGHT = 75;

export default function GoalSelection() {
  const router = useRouter();
  const goals = ["Lose weight", "Gain Weight", "Create Muscle"];
  const [selectedGoal, setSelectedGoal] = useState("Gain Weight");

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const newGoal = goals[index];

      if (newGoal && newGoal !== selectedGoal) {
        setTimeout(() => {
          setSelectedGoal(newGoal);
          if (Platform.OS !== "web") {
            Haptics.selectionAsync().catch(() => {});
          }
        }, 0);
      }
    },
    [selectedGoal],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-8 py-10 justify-between">
        {/* Header */}
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            What´s your goal?
          </Text>
          <Text className="text-base text-gray-400 text-center mt-2 px-5">
            This helps us create your personalized plan
          </Text>
        </View>

        {/* Picker Central */}
        <View className="flex-1 justify-center items-center">
          <View
            style={{ height: ITEM_HEIGHT * 5 }}
            className="w-full justify-center items-center relative"
          >
            {/* Overlay Reforçado */}
            <View
              pointerEvents="none"
              className="absolute z-0 items-center justify-center"
              style={{
                height: ITEM_HEIGHT,
                top: "50%",
                marginTop: -ITEM_HEIGHT / 2,
                alignSelf: "center",
              }}
            >
              {/* Linhas vermelhas um pouco mais grossas (border-2) */}
              <View
                className="border-t-2 border-b-2 border-[#FF0000] absolute"
                style={{ height: ITEM_HEIGHT, width: "130%" }}
              />

              {/* Caixa cinzenta maior e mais arredondada */}
              <View
                className="bg-[#2D2F33] rounded-2xl px-12"
                style={{ height: ITEM_HEIGHT * 0.85 }}
              >
                <Text className="text-2xl font-bold opacity-0">
                  Create Muscle
                </Text>
              </View>
            </View>

            <FlatList
              data={goals}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              snapToAlignment="center"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={handleScroll}
              initialScrollIndex={goals.indexOf("Gain Weight")}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * 2,
              }}
              renderItem={({ item }) => {
                const isSelected = selectedGoal === item;
                return (
                  <View
                    style={{ height: ITEM_HEIGHT }}
                    className="justify-center items-center"
                  >
                    <Text
                      className={`text-center ${
                        isSelected
                          ? "text-white font-bold text-2xl" // Aumentado para 2xl
                          : "text-gray-600 text-xl opacity-40" // Aumentado para xl
                      }`}
                    >
                      {item}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
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
            onPress={() => router.push("/WorkOutSchedule")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
