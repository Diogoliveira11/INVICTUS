import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
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

const ITEM_HEIGHT = 60;

interface ScrollColumnProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export default function BirthdaySelection() {
  const router = useRouter();

  const today = new Date();
  const monthsNames = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May.",
    "Jun.",
    "Jul.",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];

  const currentDay = today.getDate().toString();
  const currentMonth = monthsNames[today.getMonth()];
  const maxAllowedYear = today.getFullYear() - 12;
  const startingYear = maxAllowedYear.toString();

  const [day, setDay] = useState(currentDay);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(startingYear);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = monthsNames;
  const years = Array.from({ length: 90 }, (_, i) =>
    (maxAllowedYear - i).toString(),
  );

  const ScrollColumn = ({
    data,
    selectedValue,
    onValueChange,
  }: ScrollColumnProps) => {
    return (
      <View className="flex-1 items-center justify-center">
        {/* Fundo oval do item selecionado */}
        <View
          pointerEvents="none"
          className="absolute bg-[#2D2F33] rounded-xl z-0"
          style={{
            height: ITEM_HEIGHT - 12,
            width: "80%",
            top: "50%",
            marginTop: -(ITEM_HEIGHT - 12) / 2,
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
                className={`text-center ${selectedValue === item ? "text-white font-bold text-2xl" : "text-gray-500 text-lg opacity-40"}`}
              >
                {item}
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
        {/* Header */}
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center italic">
            Insert your birth date!
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            This helps us tailor your workout plan to your age
          </Text>
        </View>

        {/* Picker Central */}
        <View className="flex-1 justify-center my-8">
          {/* Labels */}
          <View className="flex-row w-full mb-4">
            {["Day", "Month", "Year"].map((label) => (
              <Text
                key={label}
                className="flex-1 text-white text-lg font-medium text-center"
              >
                {label}
              </Text>
            ))}
          </View>

          <View
            style={{ height: ITEM_HEIGHT * 5 }}
            className="justify-center items-center w-full"
          >
            {/* Linhas de seleção vermelhas - Usando posicionamento absoluto para evitar que o FlatList as empurre */}
            <View
              pointerEvents="none"
              className="absolute w-full border-t-2 border-b-2 border-[#E31C25] z-10"
              style={{
                height: ITEM_HEIGHT,
                top: "50%",
                marginTop: -ITEM_HEIGHT / 2,
              }}
            />

            <View className="flex-row w-full h-full">
              <ScrollColumn
                data={days}
                selectedValue={day}
                onValueChange={setDay}
              />
              <ScrollColumn
                data={months}
                selectedValue={month}
                onValueChange={setMonth}
              />
              <ScrollColumn
                data={years}
                selectedValue={year}
                onValueChange={setYear}
              />
            </View>
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
            onPress={() => router.push("/weight")}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}