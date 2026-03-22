import React from "react";
import { Image, StyleSheet, View } from "react-native";

// O caminho foi ajustado com base na tua árvore de pastas:
// De: app/(tabs)/video.tsx
// Para: assets/exercises_gifs/...
const exerciseGif = require("../../assets/exercises_gifs/00331201-Barbell-Decline-Bench-Press_Chest.gif");

export default function ExerciseVideo() {
  return (
    <View style={styles.container}>
      <Image
        source={exerciseGif}
        style={styles.gif}
        // "contain" garante que o exercício aparece todo sem cortes
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    backgroundColor: "#FFFFFF", // Fundo branco para combinar com o fundo do GIF
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    // Sombra leve para dar um ar de "card" (opcional)
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gif: {
    width: "90%", // Um pouco menor que o container para dar margem
    height: "90%",
  },
});
