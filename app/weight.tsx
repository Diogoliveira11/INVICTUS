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

  const [weightKg, setWeightKg] = useState(DEFAULT_WEIGHT_KG);
  const flatListRef = useRef<FlatList>(null);

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

      const weightToSave =
        unit === "LB" ? Math.round(weightKg * 2.20462) : weightKg;

      // 1. Atualiza a tabela de utilizadores
      await updateUserWeight(db, userEmail, weightToSave);

      // 2. CRITICAL: Cria a tabela de medições se ela não existir (evita erro de 'no such table')
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          value REAL NOT NULL,
          type TEXT NOT NULL,
          recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // 3. Insere o peso inicial
      await db.runAsync(
        "INSERT INTO body_measurements (user_email, value, type, recorded_at) VALUES (?, ?, 'weight', datetime('now'))",
        [userEmail, weightToSave],
      );

      router.replace("/height");
    } catch (e) {
      console.error("❌ Erro ao guardar weight:", e);
      Alert.alert("Error", "Could not save weight.");
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 justify-between py-10">
        <View className="px-6 items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center">
            What´s your weight?
          </Text>
          <Text className="text-base text-gray-400 text-center mt-2">
            You can always change this later
          </Text>
        </View>

        <View className="px-6 flex-row items-baseline justify-center">
          <Text className="text-white text-8xl font-bold">{displayWeight}</Text>
          <Text className="text-gray-400 text-2xl ml-2 font-medium">
            {unit.toLowerCase()}
          </Text>
        </View>

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

        <View className="px-6 items-center">
          <View className="bg-[#2D2F33] rounded-full px-8 py-3">
            <Text className="text-white font-bold text-base">{unit}</Text>
          </View>
        </View>

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
