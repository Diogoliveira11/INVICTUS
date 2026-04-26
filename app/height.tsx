import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo } from "react";
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
import { updateUserHeight } from "../src/database";
import { useUnits } from "./(tabs)/context/units_context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_HEIGHT = 70;

interface ScrollColumnProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  unitLabel?: string;
}

export default function HeightSelection() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { heightUnit: unit } = useUnits();

  const [cmValue, setCmValue] = React.useState("170");
  const [ftValue, setFtValue] = React.useState("5");
  const [inValue, setInValue] = React.useState("7");

  const cmData = useMemo(
    () => Array.from({ length: 101 }, (_, i) => (120 + i).toString()),
    [],
  );
  const ftData = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (4 + i).toString()),
    [],
  );
  const inData = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i.toString()),
    [],
  );

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "User session lost. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }

      let heightToSave: string;
      if (unit === "CM") {
        heightToSave = cmValue;
      } else {
        heightToSave = `${ftValue}.${inValue}`;
      }

      await updateUserHeight(db, userEmail, heightToSave);
      await AsyncStorage.setItem("userHeightUnit", unit);

      router.replace("/workoutschedule");
    } catch (e) {
      console.error("❌ Erro ao guardar height:", e);
      Alert.alert("Error", "Could not save height.");
    }
  };

  const ScrollColumn = ({
    data,
    selectedValue,
    onValueChange,
    unitLabel,
  }: ScrollColumnProps) => {
    const initialIndex =
      data.indexOf(selectedValue) !== -1 ? data.indexOf(selectedValue) : 0;

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            height: ITEM_HEIGHT - 10,
            width: "92%",
            backgroundColor: "#2D2F33",
            borderRadius: 16,
            top: "50%",
            marginTop: -(ITEM_HEIGHT - 10) / 2,
            zIndex: 0,
          }}
        />
        <FlatList
          data={data}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            const index = Math.round(y / ITEM_HEIGHT);
            if (data[index]) onValueChange(data[index]);
          }}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          renderItem={({ item }) => (
            <View
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: selectedValue === item ? "#fff" : "#6b7280",
                  fontSize: selectedValue === item ? 36 : 20,
                  fontWeight: selectedValue === item ? "700" : "400",
                  opacity: selectedValue === item ? 1 : 0.3,
                  textAlign: "center",
                }}
              >
                {item}
                <Text style={{ fontSize: 18, fontWeight: "400" }}>
                  {unitLabel || ""}
                </Text>
              </Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-6 py-8 justify-between">
        {/* Título */}
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            What´s your height?
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            This helps us create your personalized plan
          </Text>
        </View>

        {/* Picker */}
        <View className="flex-1 justify-center my-2">
          <View className="flex-row w-full mb-4 justify-center">
            {unit === "CM" ? (
              <Text className="text-white text-lg font-semibold">
                Centimeters
              </Text>
            ) : (
              <>
                <Text className="flex-1 text-white text-lg font-semibold text-center">
                  Feet
                </Text>
                <Text className="flex-1 text-white text-lg font-semibold text-center">
                  Inches
                </Text>
              </>
            )}
          </View>

          <View
            style={{ height: ITEM_HEIGHT * 5 }}
            className="justify-center items-center w-full"
          >
            <View
              pointerEvents="none"
              className="absolute border-t-2 border-b-2 border-[#E31C25] z-10"
              style={{
                height: ITEM_HEIGHT,
                top: "50%",
                marginTop: -ITEM_HEIGHT / 2,
                width: unit === "CM" ? "45%" : "100%",
              }}
            />
            <View className="flex-row w-full h-full justify-center">
              {unit === "CM" ? (
                <View style={{ width: SCREEN_WIDTH * 0.45 }}>
                  <ScrollColumn
                    data={cmData}
                    selectedValue={cmValue}
                    onValueChange={setCmValue}
                  />
                </View>
              ) : (
                <>
                  <ScrollColumn
                    data={ftData}
                    selectedValue={ftValue}
                    onValueChange={setFtValue}
                    unitLabel="'"
                  />
                  <ScrollColumn
                    data={inData}
                    selectedValue={inValue}
                    onValueChange={setInValue}
                    unitLabel="''"
                  />
                </>
              )}
            </View>
          </View>
        </View>

        {/* Unidade selecionada (informativo) */}
        <View className="items-center mb-6">
          <View className="bg-[#2D2F33] rounded-full px-8 py-3">
            <Text className="text-white font-bold text-base">{unit}</Text>
          </View>
        </View>

        {/* Botões */}
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.push("/weight")}
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
