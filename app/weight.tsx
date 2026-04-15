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
  const [weight, setWeight] = useState(DEFAULT_WEIGHT_KG);
  const [unit, setUnit] = useState<"KG" | "LB">("KG");
  const flatListRef = useRef<FlatList>(null);
  const isSwitchingUnit = useRef(false);

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

  const toggleUnit = (newUnit: "KG" | "LB") => {
    if (unit === newUnit) return;
    isSwitchingUnit.current = true;

    let convertedValue: number;
    if (newUnit === "LB") {
      convertedValue = Math.round(weight * 2.20462);
      convertedValue = Math.max(MIN_LB, Math.min(MAX_LB, convertedValue));
    } else {
      convertedValue = Math.round(weight / 2.20462);
      convertedValue = Math.max(MIN_KG, Math.min(MAX_KG, convertedValue));
    }

    setWeight(convertedValue);
    setUnit(newUnit);

    const scrollWeight =
      newUnit === "LB" ? Math.round(convertedValue / 2.20462) : convertedValue;
    const index = weightData.indexOf(
      Math.max(MIN_KG, Math.min(MAX_KG, scrollWeight)),
    );

    if (index !== -1) {
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: true,
      });
    }

    setTimeout(() => {
      isSwitchingUnit.current = false;
    }, 500);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSwitchingUnit.current) return;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < weightData.length) {
      const kgValue = weightData[index];
      if (unit === "KG") {
        if (weight !== kgValue) setWeight(kgValue);
      } else {
        const lbValue = Math.round(kgValue * 2.20462);
        const finalLb = Math.max(MIN_LB, Math.min(MAX_LB, lbValue));
        if (weight !== finalLb) setWeight(finalLb);
      }
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

      // --- AQUI ESTÁ A CORREÇÃO ---
      // Em vez de converter, guardamos o valor que está no estado 'weight'
      // que já é o valor correto baseado na unidade selecionada.
      const weightToSave = weight;

      console.log(`Peso a guardar: ${weightToSave} ${unit}`);

      // Atualiza na SQLite com o valor real (70 se for KG, 154 se for LB)
      await updateUserWeight(db, userEmail, weightToSave);

      // IMPORTANTE: Guarda também a unidade no Storage para saberes ler depois
      await AsyncStorage.setItem("userUnit", unit);

      router.replace("/height");
    } catch (e) {
      console.error("❌ Erro ao guardar weight:", e);
      Alert.alert("Error", "Could not save weight.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-6 justify-between py-10">
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            What´s your weight?
          </Text>
          <Text className="text-base text-gray-400 text-center mt-2">
            You can always change this later
          </Text>
        </View>

        <View className="flex-row items-baseline justify-center">
          <Text className="text-white text-8xl font-bold">{weight}</Text>
          <Text className="text-gray-400 text-2xl ml-2 font-medium">
            {unit.toLowerCase()}
          </Text>
        </View>

        <View className="h-[120px] items-center justify-center relative">
          <View
            pointerEvents="none"
            className="absolute h-24 w-1 bg-[#E31C25] rounded-full z-10"
            style={{ left: SCREEN_WIDTH / 2 - 27 }}
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

        <View className="items-center">
          <View className="flex-row bg-[#2D2F33] rounded-full p-1 w-52">
            <TouchableOpacity
              className={`flex-1 h-11 justify-center items-center rounded-full ${unit === "KG" ? "bg-[#E31C25]" : ""}`}
              onPress={() => toggleUnit("KG")}
            >
              <Text
                className={`font-bold text-base ${unit === "KG" ? "text-white" : "text-gray-400"}`}
              >
                KG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 h-11 justify-center items-center rounded-full ${unit === "LB" ? "bg-[#E31C25]" : ""}`}
              onPress={() => toggleUnit("LB")}
            >
              <Text
                className={`font-bold text-base ${unit === "LB" ? "text-white" : "text-gray-400"}`}
              >
                LB
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-2">
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
