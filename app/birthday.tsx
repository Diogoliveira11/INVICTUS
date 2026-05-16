import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateUserBirthday } from "../src/database";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function BirthdaySelection() {
  const router = useRouter();
  const [showYearPicker, setShowYearPicker] = useState(false);
  const db = useSQLiteContext();

  const today = new Date();
  const maxYear = today.getFullYear() - 12;
  const minYear = maxYear - 90;

  const [viewYear, setViewYear] = useState(maxYear);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const goBack = () => {
    if (viewMonth === 0) {
      if (viewYear <= minYear) return;
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };

  const goForward = () => {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (nextYear > maxYear) return;
    if (nextYear === maxYear && nextMonth > today.getMonth()) return;
    setViewMonth(nextMonth);
    setViewYear(nextYear);
    setSelectedDay(null);
  };

  const canGoForward =
    viewYear < maxYear ||
    (viewYear === maxYear && viewMonth < today.getMonth());

  const canGoBack =
    viewYear > minYear || (viewYear === minYear && viewMonth > 0);

  const handleNext = async () => {
    if (!selectedDay) {
      Alert.alert("Select a date", "Please pick your birth date.");
      return;
    }
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "User session lost. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }
      const birthday = `${viewYear}-${pad(viewMonth + 1)}-${pad(selectedDay)}`;
      await updateUserBirthday(db, userEmail, birthday);
      router.replace("/weight");
    } catch (e) {
      console.error("[Onboarding] Error saving birthday:", e);
      Alert.alert("Error", "Could not save your birthday.");
    }
  };

  const formattedDate = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[viewMonth]} ${viewYear}`
    : "Select your birth date";

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
        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#fff",
              textAlign: "center",
            }}
          >
            When were you born?
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

        {/* Selected date pill */}
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <View
            style={{
              backgroundColor: selectedDay ? "#E31C25" : "#2D2F33",
              borderRadius: 999,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View
          style={{
            backgroundColor: "#1A1D22",
            borderRadius: 24,
            padding: 20,
            marginTop: 24,
          }}
        >
          {/* Month nav */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={goBack}
              disabled={!canGoBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: canGoBack ? "#2D2F33" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                opacity: canGoBack ? 1 : 0.2,
              }}
            >
              <ChevronLeft color="#fff" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowYearPicker(!showYearPicker)}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                {MONTH_NAMES[viewMonth]} {viewYear} ▾
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goForward}
              disabled={!canGoForward}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: canGoForward ? "#2D2F33" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                opacity: canGoForward ? 1 : 0.2,
              }}
            >
              <ChevronRight color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          {showYearPicker && (
            <ScrollView
              style={{ maxHeight: 200, marginBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {Array.from(
                { length: maxYear - minYear + 1 },
                (_, i) => maxYear - i,
              ).map((year) => (
                <TouchableOpacity
                  key={year}
                  onPress={() => {
                    setViewYear(year);
                    setSelectedDay(null);
                    setShowYearPicker(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor:
                      year === viewYear ? "#E31C25" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: year === viewYear ? "700" : "400",
                      fontSize: 15,
                    }}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Day labels */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {DAY_LABELS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{ color: "#6B7280", fontSize: 12, fontWeight: "600" }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: "row", marginBottom: 6 }}>
              {row.map((day, ci) => {
                const isSelected = day === selectedDay;
                return (
                  <TouchableOpacity
                    key={ci}
                    onPress={() => day && setSelectedDay(day)}
                    disabled={!day}
                    style={{
                      flex: 1,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      backgroundColor:
                        isSelected && day ? "#E31C25" : "transparent",
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: isSelected ? "700" : "400",
                        opacity: day ? 1 : 0,
                      }}
                    >
                      {day ?? "·"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Navigation */}
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
            onPress={() => router.push("/gender")}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: selectedDay ? "#E31C25" : "#2D2F33",
              paddingVertical: 16,
              paddingHorizontal: 40,
              borderRadius: 999,
              opacity: selectedDay ? 1 : 0.5,
            }}
            onPress={handleNext}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
