import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* 1. Imagem de fundo absoluta */}
      <Image
        key={index}
        source={slides[index].img}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* 2. Gradiente e Conteúdo */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)", "#000"]}
        // O justifyContent: 'flex-end' garante que o conteúdo desça para o fundo no iOS
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingBottom: 60,
          paddingHorizontal: 30,
        }}
      >
        <View className="items-center">
          <Text className="text-white text-3xl font-bold text-center mb-2">
            {slides[index].title}
          </Text>

          <Text className="text-gray-400 text-base mb-10 italic">
            Your Journey Begins Here
          </Text>

          {/* Indicadores (Barras de progresso) */}
          <View className="flex-row mb-8">
            {slides.map((_, i) => (
              <View
                key={i}
                className={`h-1 mx-1 rounded-full ${
                  i === index ? "w-7 bg-white" : "w-3 bg-gray-600"
                }`}
              />
            ))}
          </View>

          {/* Botão */}
          <TouchableOpacity
            className="w-full border-2 border-[#E31C25] py-4 rounded-full items-center"
            onPress={handlePress}
          >
            <Text className="text-white font-bold text-lg tracking-widest">
              {slides[index].btn}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}