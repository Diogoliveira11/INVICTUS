import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Importar o router
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const DAYS = [
  { id: "Mon", label: "Monday" },
  { id: "Tue", label: "Tuesday" },
  { id: "Wed", label: "Wednesday" },
  { id: "Thu", label: "Thursday" },
  { id: "Fri", label: "Friday" },
  { id: "Sat", label: "Saturday" },
  { id: "Sun", label: "Sunday" },
];

export default function WorkOutDays() {
  const router = useRouter(); // Inicializar o router

  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
  ]);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {/* Texto entre chavetas para evitar erro de caracteres especiais */}
          <Text style={styles.title}>{"What's your workout plan?"}</Text>
          <Text style={styles.subtitle}>
            Select the days you want to train during the week
          </Text>
        </View>

        {/* Days List */}
        <View style={styles.daysContainer}>
          {DAYS.map((day) => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <TouchableOpacity
                key={day.id}
                activeOpacity={0.7}
                onPress={() => toggleDay(day.id)}
                style={[styles.dayRow, isSelected && styles.dayRowSelected]}
              >
                <Text
                  style={[styles.dayText, isSelected && styles.dayTextSelected]}
                >
                  {day.label}
                </Text>

                <View
                  style={[
                    styles.circle,
                    isSelected
                      ? styles.circleSelected
                      : styles.circleUnselected,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()} // Botão voltar a funcionar
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              console.log("Dias selecionados:", selectedDays);
              // router.push("/ProximoPasso");
            }}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121417",
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  daysContainer: {
    marginTop: 20,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2F33",
  },
  dayRowSelected: {},
  dayText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  dayTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  circleUnselected: {
    borderColor: "#4B5563",
    backgroundColor: "transparent",
  },
  circleSelected: {
    borderColor: "#FF0000",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#2D2F33",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#FF0000",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 5,
  },
});
