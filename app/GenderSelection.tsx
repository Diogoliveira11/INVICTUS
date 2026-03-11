import { useRouter } from "expo-router";
import { ChevronRight, Mars, Venus } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GenderSelection() {
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const router = useRouter();

  // Verifica se o género foi selecionado para habilitar o botão
  const isReady = gender !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself!</Text>
          <Text style={styles.subtitle}>
            To give you a better experience we need to know your gender
          </Text>
        </View>

        {/* Selection Area */}
        <View style={styles.selectionContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setGender("male")}
            style={[
              styles.genderCircle,
              gender === "male" ? styles.activeCircle : styles.inactiveCircle,
            ]}
          >
            <Mars color="white" size={60} strokeWidth={2.5} />
            <Text style={styles.genderLabel}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setGender("female")}
            style={[
              styles.genderCircle,
              gender === "female" ? styles.activeCircle : styles.inactiveCircle,
            ]}
          >
            <Venus color="white" size={60} strokeWidth={2.5} />
            <Text style={styles.genderLabel}>Female</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            // Desativa o botão se nenhum género for selecionado
            disabled={!isReady}
            style={[
              styles.nextButton,
              // Estilo visual para botão desativado (opacidade 30%)
              !isReady && { opacity: 0.3 },
            ]}
            onPress={() => router.push("/BirthdaySelection")}
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
    paddingHorizontal: 30,
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 22,
  },
  selectionContainer: {
    alignItems: "center",
    gap: 40,
  },
  genderCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  activeCircle: {
    backgroundColor: "#FF0000",
  },
  inactiveCircle: {
    backgroundColor: "#2D2F33",
  },
  genderLabel: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "flex-end",
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
