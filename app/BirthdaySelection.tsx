import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BirthdaySelection() {
  const router = useRouter();

  // Estados para os valores selecionados
  const [day, setDay] = useState("4");
  const [month, setMonth] = useState("April");
  const [year, setYear] = useState("1998");

  // Dados para os seletores
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
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
  const years = Array.from({ length: 50 }, (_, i) => (2010 - i).toString());

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insert your birth date!</Text>
          <Text style={styles.subtitle}>
            To give you a better experience we need to know your gender
          </Text>
        </View>

        {/* Labels dos Seletores */}
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Day</Text>
          <Text style={styles.labelText}>Month</Text>
          <Text style={styles.labelText}>Year</Text>
        </View>

        {/* Seletores com as linhas vermelhas */}
        <View style={styles.pickerWrapper}>
          {/* Linhas Vermelhas de Seleção (Style do Figma) */}
          <View style={styles.selectionLines} />

          <View style={styles.pickersContainer}>
            <Picker
              selectedValue={day}
              onValueChange={(itemValue) => setDay(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {days.map((d) => (
                <Picker.Item key={d} label={d} value={d} color="white" />
              ))}
            </Picker>

            <Picker
              selectedValue={month}
              onValueChange={(itemValue) => setMonth(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {months.map((m) => (
                <Picker.Item key={m} label={m} value={m} color="white" />
              ))}
            </Picker>

            <Picker
              selectedValue={year}
              onValueChange={(itemValue) => setYear(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {years.map((y) => (
                <Picker.Item key={y} label={y} value={y} color="white" />
              ))}
            </Picker>
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push("/WeightSelection")}
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
    paddingVertical: 40,
    justifyContent: "space-between",
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
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 40,
  },
  labelText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  pickerWrapper: {
    height: 250,
    justifyContent: "center",
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    fontSize: 22,
    fontWeight: "bold",
  },
  selectionLines: {
    position: "absolute",
    height: 50,
    width: "100%",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FF0000", // Vermelho do Figma
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#2D2F33",
    width: 60,
    height: 60,
    borderRadius: 30,
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
