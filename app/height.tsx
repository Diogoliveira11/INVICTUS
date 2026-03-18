import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Ajustado para 70 para um equilíbrio melhor
const ITEM_HEIGHT = 70;

interface ScrollColumnProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  unitLabel?: string;
}

export default function HeightSelection() {
  const router = useRouter();
  const [unit, setUnit] = useState<"CM" | "FT">("CM");

  const [cmValue, setCmValue] = useState("170");
  const [ftValue, setFtValue] = useState("5");
  const [inValue, setInValue] = useState("7");

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

  const toggleUnit = (newUnit: "CM" | "FT") => {
    if (unit === newUnit) return;
    if (newUnit === "FT") {
      const totalInches = Math.round(parseInt(cmValue) / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      setFtValue(Math.max(4, Math.min(8, feet)).toString());
      setInValue(inches.toString());
    } else {
      const totalInches = parseInt(ftValue) * 12 + parseInt(inValue);
      const cm = Math.round(totalInches * 2.54);
      setCmValue(Math.max(120, Math.min(220, cm)).toString());
    }
    setUnit(newUnit);
  };

  const ScrollColumn = ({
    data,
    selectedValue,
    onValueChange,
    unitLabel,
  }: ScrollColumnProps) => {
    return (
      <View className="flex-1 items-center justify-center">
        <View
          pointerEvents="none"
          className="absolute bg-[#2D2F33] rounded-2xl z-0"
          style={{
            height: ITEM_HEIGHT - 10,
            width: "92%",
            top: "50%",
            marginTop: -(ITEM_HEIGHT - 10) / 2,
          }}
        />

        <FlatList
          data={data}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate={Platform.OS === "ios" ? "normal" : 0.9}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            const index = Math.round(y / ITEM_HEIGHT);
            if (data[index] && data[index] !== selectedValue) {
              onValueChange(data[index]);
            }
          }}
          initialScrollIndex={
            data.indexOf(selectedValue) !== -1 ? data.indexOf(selectedValue) : 0
          }
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          renderItem={({ item }) => (
            <View
              style={{ height: ITEM_HEIGHT }}
              className="justify-center items-center"
            >
              <Text
                className={`text-center ${
                  selectedValue === item
                    ? "text-white font-bold text-4xl" // TAMANHO EQUILIBRADO
                    : "text-gray-500 text-xl opacity-20"
                }`}
              >
                {item}
                <Text className="text-lg font-normal">{unitLabel || ""}</Text>
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
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            What´s your height?
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            This helps us create your personalized plan
          </Text>
        </View>

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

        {/* Switcher */}
        <View className="items-center mb-6">
          <View className="flex-row bg-[#2D2F33] rounded-full p-1 w-52">
            <TouchableOpacity
              className={`flex-1 py-3 items-center rounded-full ${unit === "CM" ? "bg-[#E31C25]" : ""}`}
              onPress={() => toggleUnit("CM")}
            >
              <Text
                className={`font-bold ${unit === "CM" ? "text-white" : "text-gray-400"}`}
              >
                CM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 items-center rounded-full ${unit === "FT" ? "bg-[#E31C25]" : ""}`}
              onPress={() => toggleUnit("FT")}
            >
              <Text
                className={`font-bold ${unit === "FT" ? "text-white" : "text-gray-400"}`}
              >
                FT
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            onPress={() => router.push("/goal")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}