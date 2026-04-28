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

const slides: {
  id: number;
  title: string;
  btn: string;
  img: any;
}[] = [
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
      router.replace("/auth/signup");
    }
  };

  const slide = slides[index];

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        key={index}
        source={slide.img}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)", "#000"]}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingBottom: 60,
          paddingHorizontal: 30,
        }}
      >
        <View className="items-center">
          <Text className="text-white text-3xl font-bold text-center mb-2">
            {slide.title}
          </Text>
          <Text className="text-gray-400 text-base mb-10 italic">
            Your Journey Begins Here
          </Text>
          {/* Indicadores */}
          <View className="flex-row mb-8">
            {slides.map((_, i) => (
              <View
                key={i}
                className={`h-1 mx-1 rounded-full ${i === index ? "w-7 bg-white" : "w-3 bg-gray-600"}`}
              />
            ))}
          </View>

          {/* Botão */}
          <TouchableOpacity
            className="w-full border-2 border-[#E31C25] py-4 rounded-full items-center"
            onPress={handlePress}
          >
            <Text className="text-white font-bold text-lg tracking-widest">
              {slide.btn}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}
