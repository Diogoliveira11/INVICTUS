import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateUserBirthday } from "../src/database";

const ITEM_HEIGHT = 60;

interface ScrollColumnProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export default function BirthdaySelection() {
  const router = useRouter();
  const db = useSQLiteContext();

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

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const monthIndex = monthsNames.indexOf(month) + 1;
      const birthday = `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      await updateUserBirthday(db, userEmail!, birthday);
      router.push("/weight");
    } catch (e) {
      console.error("Erro ao guardar birthday:", e);
    }
  };

  const ScrollColumn = ({
    data,
    selectedValue,
    onValueChange,
  }: ScrollColumnProps) => {
    const initialIndex =
      data.indexOf(selectedValue) !== -1 ? data.indexOf(selectedValue) : 0;

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* Retângulo cinzento */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            height: ITEM_HEIGHT - 12,
            width: "80%",
            backgroundColor: "#2D2F33",
            borderRadius: 12,
            top: "50%",
            marginTop: -(ITEM_HEIGHT - 12) / 2,
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
            if (data[index]) {
              onValueChange(data[index]);
            }
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
                  fontSize: selectedValue === item ? 22 : 18,
                  fontWeight: selectedValue === item ? "700" : "400",
                  opacity: selectedValue === item ? 1 : 0.4,
                  textAlign: "center",
                }}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121417" }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingVertical: 32,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#fff",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Insert your birth date!
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 8,
              paddingHorizontal: 20,
            }}
          >
            This helps us tailor your workout plan to your age
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: "center", marginVertical: 32 }}>
          <View
            style={{ flexDirection: "row", width: "100%", marginBottom: 16 }}
          >
            {["Day", "Month", "Year"].map((label) => (
              <Text
                key={label}
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <View
            style={{
              height: ITEM_HEIGHT * 5,
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Linhas vermelhas */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: "100%",
                height: ITEM_HEIGHT,
                top: "50%",
                marginTop: -ITEM_HEIGHT / 2,
                borderTopWidth: 2,
                borderBottomWidth: 2,
                borderColor: "#E31C25",
                zIndex: 10,
              }}
            />
            <View
              style={{ flexDirection: "row", width: "100%", height: "100%" }}
            >
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

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#2D2F33",
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#E31C25",
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 999,
            }}
            onPress={handleNext}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginRight: 8,
              }}
            >
              Next
            </Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
