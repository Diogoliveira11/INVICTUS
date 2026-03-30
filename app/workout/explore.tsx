import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Dumbbell,
    Home,
    Luggage,
    PersonStanding,
    Smartphone,
    Zap,
} from "lucide-react-native";
import React from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ExploreScreen() {
  const router = useRouter();

  const categories = [
    {
      id: "home",
      title: "At home",
      icon: <Home color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
    {
      id: "travel",
      title: "Travel",
      icon: <Luggage color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
    {
      id: "dumbbells",
      title: "Dumbbells Only",
      icon: <Dumbbell color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
    {
      id: "band",
      title: "Band",
      icon: <Zap color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
    {
      id: "cardio",
      title: "Cardio & HIIT",
      icon: <Smartphone color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
    {
      id: "gym",
      title: "Gym",
      icon: <PersonStanding color="#3b82f6" size={32} />,
      color: "bg-zinc-900",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Explore</Text>
      </View>

      <ScrollView className="px-5">
        <Text className="text-white text-2xl font-bold mb-6">Routines</Text>

        {/* Grid de Categorias */}
        <View className="flex-row flex-wrap justify-between">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className={`${cat.color} w-[48%] aspect-square rounded-3xl p-5 mb-4 border border-zinc-800 justify-between`}
              onPress={() => console.log("Filtrar por:", cat.id)}
            >
              <Text className="text-white text-lg font-bold leading-tight">
                {cat.title}
              </Text>
              <View className="items-end">{cat.icon}</View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
