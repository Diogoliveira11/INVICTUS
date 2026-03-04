import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HeightSelection() {
  const router = useRouter();

  // Unidade atual: CM ou FT
  const [unit, setUnit] = useState<"CM" | "FT">("CM");

  // O valor numérico muda conforme a unidade (cm ou polegadas totais)
  const [heightValue, setHeightValue] = useState(170);

  // Lista de CM (120 a 220)
  const cmItems = useMemo(
    () => Array.from({ length: 101 }, (_, i) => 120 + i),
    [],
  );

  // Lista de Polegadas totais para FT (aprox. 3'11" a 7'3")
  const ftItems = useMemo(
    () => Array.from({ length: 41 }, (_, i) => 47 + i),
    [],
  );

  // --- Lógica de Conversão ---
  const cmToInches = (cm: number) => Math.round(cm / 2.54);
  const inchesToCm = (inches: number) => Math.round(inches * 2.54);

  const formatToFeet = (totalInches: number) => {
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  };

  const toggleUnit = (newUnit: "CM" | "FT") => {
    if (unit === newUnit) return;

    if (newUnit === "FT") {
      setHeightValue(cmToInches(heightValue));
    } else {
      setHeightValue(inchesToCm(heightValue));
    }
    setUnit(newUnit);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What’s your height?</Text>
          <Text style={styles.subtitle}>
            To give you a better experience we need{"\n"}to know your gender
          </Text>
        </View>

        {/* Área do Seletor - Estilo BirthdaySelection */}
        <View style={styles.pickerWrapper}>
          <View style={styles.selectionLines} />

          <View style={styles.pickersContainer}>
            <Picker
              selectedValue={heightValue.toString()}
              onValueChange={(itemValue) => setHeightValue(parseInt(itemValue))}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {(unit === "CM" ? cmItems : ftItems).map((val) => (
                <Picker.Item
                  key={val}
                  label={unit === "CM" ? val.toString() : formatToFeet(val)}
                  value={val.toString()}
                  color="white"
                />
              ))}
            </Picker>

            {/* Rótulo da Unidade fixo ao lado */}
            <View style={styles.unitLabelWrapper}>
              <Text style={styles.unitLabelText}>
                {unit === "CM" ? "cm" : "ft"}
              </Text>
            </View>
          </View>
        </View>

        {/* Unit Switcher (Botões Vermelho/Cinza) */}
        <View style={styles.unitSwitcherContainer}>
          <View style={styles.unitSwitcherBg}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === "CM" && styles.unitButtonActive,
              ]}
              onPress={() => toggleUnit("CM")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === "CM" && styles.unitButtonTextActive,
                ]}
              >
                CM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === "FT" && styles.unitButtonActive,
              ]}
              onPress={() => toggleUnit("FT")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === "FT" && styles.unitButtonTextActive,
                ]}
              >
                FT
              </Text>
            </TouchableOpacity>
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
            onPress={() => router.push("/GoalSelection")}
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
    marginTop: 30,
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
    textAlign: "center",
    marginTop: 10,
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
    width: 180, // Largura suficiente para o formato 5'11"
  },
  pickerItem: {
    fontSize: 40,
    fontWeight: "bold",
  },
  selectionLines: {
    position: "absolute",
    height: 70,
    width: "100%",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FF0000",
    alignSelf: "center",
  },
  unitLabelWrapper: {
    marginLeft: 5,
    justifyContent: "center",
  },
  unitLabelText: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
    marginTop: 15,
  },
  unitSwitcherContainer: {
    alignItems: "center",
  },
  unitSwitcherBg: {
    flexDirection: "row",
    backgroundColor: "#2D2F33",
    borderRadius: 30,
    padding: 4,
    width: 220,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 25,
  },
  unitButtonActive: {
    backgroundColor: "#FF0000",
  },
  unitButtonText: {
    color: "#9CA3AF",
    fontWeight: "bold",
    fontSize: 16,
  },
  unitButtonTextActive: {
    color: "white",
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
