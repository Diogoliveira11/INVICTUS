import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateUserWeight } from "../src/database";
import { useUnits } from "./(tabs)/context/units_context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MIN_KG = 20;
const MAX_KG = 300;
const MIN_LB = 45;
const MAX_LB = 661;
const ITEM_WIDTH = 20;
const DEFAULT_WEIGHT_KG = 70;
const SNAP_OFFSET = SCREEN_WIDTH / 2 - ITEM_WIDTH / 2;

const weightData = Array.from(
  { length: MAX_KG - MIN_KG + 1 },
  (_, i) => MIN_KG + i,
);

export default function WeightSelection() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { weightUnit: unit } = useUnits();

  // Estado interno sempre em KG para a FlatList
  const [weightKg, setWeightKg] = useState(DEFAULT_WEIGHT_KG);
  const flatListRef = useRef<FlatList>(null);

  // Valor exibido: converte para LB se necessário
  const displayWeight =
    unit === "LB" ? Math.round(weightKg * 2.20462) : weightKg;

  useEffect(() => {
    const initialIndex = weightData.indexOf(DEFAULT_WEIGHT_KG);
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < weightData.length) {
      const kgValue = weightData[index];
      if (weightKg !== kgValue) setWeightKg(kgValue);
    }
  };

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "User session lost.");
        router.replace("/auth/signup");
        return;
      }

      // Guardamos sempre o valor na unidade selecionada pelo utilizador
      const weightToSave =
        unit === "LB" ? Math.round(weightKg * 2.20462) : weightKg;

      await updateUserWeight(db, userEmail, weightToSave);
      router.replace("/height");
    } catch (e) {
      console.error("❌ Erro ao guardar weight:", e);
      Alert.alert("Error", "Could not save weight.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 justify-between py-10">
        {/* Título */}
        <View className="px-6 items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            What´s your weight?
          </Text>
          <Text className="text-base text-gray-400 text-center mt-2">
            You can always change this later
          </Text>
        </View>

        {/* Número */}
        <View className="px-6 flex-row items-baseline justify-center">
          <Text className="text-white text-8xl font-bold">{displayWeight}</Text>
          <Text className="text-gray-400 text-2xl ml-2 font-medium">
            {unit.toLowerCase()}
          </Text>
        </View>

        {/* Ruler — full width */}
        <View className="h-[120px] items-center justify-center relative">
          <View
            pointerEvents="none"
            className="absolute h-24 w-[2px] bg-[#E31C25] rounded-full z-10"
          />
          <FlatList
            ref={flatListRef}
            data={weightData}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEventThrottle={1}
            bounces={false}
            onScroll={onScroll}
            contentContainerStyle={{ paddingHorizontal: SNAP_OFFSET }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => {
              const isMajor = item % 5 === 0;
              return (
                <View
                  style={{ width: ITEM_WIDTH }}
                  className="items-center justify-center"
                >
                  <View
                    className={`w-[2px] rounded-full bg-[#E31C25] ${
                      isMajor ? "h-[60px] opacity-100" : "h-[30px] opacity-30"
                    }`}
                  />
                </View>
              );
            }}
          />
        </View>

        {/* Unidade selecionada (só informativo, não editável aqui) */}
        <View className="px-6 items-center">
          <View className="bg-[#2D2F33] rounded-full px-8 py-3">
            <Text className="text-white font-bold text-base">{unit}</Text>
          </View>
        </View>

        {/* Botões */}
        <View className="px-6 flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.push("/birthday")}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            onPress={handleNext}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
