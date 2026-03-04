import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 1. Definir os slides (o que falta no teu código)
const slides = [
  { id: 1, title: "Make Every Rep Count", btn: "Next" },
  { id: 2, title: "Build Your Workout Paradise", btn: "Next" },
  { id: 3, title: "Embrace the Burn", btn: "SIGN UP" },
];

export default function OnboardingScreen() {
  const router = useRouter();

  // 2. Definir o Estado (o que faz o 'index' e 'setIndex' funcionarem)
  const [index, setIndex] = useState(0);

  // 3. A função que estavas a tentar colar
  const handlePress = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      router.push("/auth/signup");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{slides[index].title}</Text>
        <Text style={styles.subtitle}>Your Journey Begins Here</Text>

        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>{slides[index].btn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 40,
    paddingBottom: 60,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    borderColor: "#E31C25",
    borderWidth: 2,
    padding: 18,
    borderRadius: 35,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
