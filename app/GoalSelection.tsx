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

export default function GoalSelection() {
  const router = useRouter();

  const [selectedGoal, setSelectedGoal] = useState("gain");

  const goals = [
    { label: "Lose weight", value: "lose" },
    { label: "Gain Weight", value: "gain" },
    { label: "Build Muscle", value: "muscle" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What’s your goal?</Text>
          <Text style={styles.subtitle}>
            This helps us create your personalized plan
          </Text>
        </View>

        {/* Área do Seletor */}
        <View style={styles.pickerWrapper}>
          <View style={styles.selectionLines} />

          <View style={styles.pickersContainer}>
            <Picker
              selectedValue={selectedGoal}
              onValueChange={(itemValue) => setSelectedGoal(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="transparent"
            >
              {goals.map((goal) => (
                <Picker.Item
                  key={goal.value}
                  label={goal.label}
                  value={goal.value}
                  // MUDANÇA AQUI: Cor branca sólida (sem transparência)
                  // para destacar ao máximo as palavras
                  color="#FFFFFF"
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => {
              console.log("Objetivo:", selectedGoal);
              router.push("/WorkOutSchedule");
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
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  pickerWrapper: {
    height: 250,
    justifyContent: "center",
  },
  pickersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    width: "100%",
  },
  pickerItem: {
    // Aumentamos o tamanho da fonte para destacar ainda mais
    fontSize: 30,
    fontWeight: "bold",
    height: 160,
  },
  selectionLines: {
    position: "absolute",
    height: 75, // Ajuste leve na altura das linhas
    width: "85%",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FF0000",
    alignSelf: "center",
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
    paddingHorizontal: 35,
    borderRadius: 30,
    height: 56,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 5,
  },
});
