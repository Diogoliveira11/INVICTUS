import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Importa o componente que acabaste de instalar
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    title: "Make Every Rep Count",
    btn: "Next",
    img: require("../assets/images/onboarding1.jpg"),
  },
  {
    id: 2,
    title: "Build Your Workout Paradise",
    btn: "Next",
    img: require("../assets/images/onboarding2.jpg"),
  },
  {
    id: 3,
    title: "Embrace the Burn",
    btn: "SIGN UP",
    img: require("../assets/images/onboarding3.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const handlePress = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      router.push("/auth/signup");
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        key={index} // Força a atualização da imagem
        source={slides[index].img}
        style={styles.container}
        resizeMode="cover"
      >
        {/* O Gradiente que cria a parte escura vinda de baixo */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", "#000"]}
          style={styles.overlay}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>{slides[index].title}</Text>
            <Text style={styles.subtitle}>Your Journey Begins Here</Text>

            {/* Tracinhos indicadores */}
            <View style={styles.indicatorRow}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === index && styles.activeDot]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>{slides[index].btn}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  textContainer: {
    padding: 30,
    paddingBottom: 60,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 40,
    fontStyle: "italic",
  },
  indicatorRow: { flexDirection: "row", marginBottom: 30 },
  dot: { width: 12, height: 3, backgroundColor: "#555", marginHorizontal: 4 },
  activeDot: { backgroundColor: "#fff", width: 25 },
  button: {
    width: "100%",
    borderColor: "#E31C25",
    borderWidth: 2,
    padding: 18,
    borderRadius: 35,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});
