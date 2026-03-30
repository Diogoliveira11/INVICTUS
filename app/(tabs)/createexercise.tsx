import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { ArrowLeft, Check, Dumbbell, Target } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function CreateExerciseScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !muscleGroup.trim()) {
      Alert.alert("Erro", "Por favor, preenche todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const db = await SQLite.openDatabaseAsync("inicializedatabase.sqlite");

      // Insere o novo exercício.
      // Nota: deixamos o 'image' como null ou um caminho padrão por agora.
      await db.runAsync(
        "INSERT INTO exercises (name, muscle_group, image) VALUES (?, ?, ?)",
        [name, muscleGroup, null],
      );

      Alert.alert("Sucesso", "Exercício criado com sucesso!", [
        { text: "OK", onPress: () => router.push("/exercises") },
      ]);
    } catch (error) {
      console.error("Erro ao inserir exercício:", error);
      Alert.alert("Erro", "Não foi possível guardar o exercício.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
              onPress={() => router.push("/exercises")}
              className="p-2 -ml-2"
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">New Exercise</Text>
            <View className="w-10" />
          </View>

          {/* Formulário */}
          <View className="space-y-6">
            {/* Input Nome */}
            <View>
              <View className="flex-row items-center mb-2 gap-2">
                <Dumbbell size={18} color="#E31C25" />
                <Text className="text-zinc-400 font-medium">Exercise Name</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Leg Press 45º"
                placeholderTextColor="#52525b"
                className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 text-base focus:border-[#E31C25]"
              />
            </View>

            {/* Input Grupo Muscular */}
            <View className="mt-6">
              <View className="flex-row items-center mb-2 gap-2">
                <Target size={18} color="#E31C25" />
                <Text className="text-zinc-400 font-medium">Muscle Group</Text>
              </View>
              <TextInput
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                placeholder="Ex: Quads / Glutes"
                placeholderTextColor="#52525b"
                className="bg-zinc-900 text-white p-4 rounded-2xl border border-zinc-800 text-base focus:border-[#E31C25]"
              />
            </View>

            <View className="mt-10 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <Text className="text-zinc-500 text-xs leading-5">
                * By creating a custom exercise, it will be available in your
                local library to track your workouts.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Botão de Guardar (Fixo no fundo) */}
        <View className="p-6">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSubmitting}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center py-4 rounded-full ${
              isSubmitting ? "bg-zinc-800" : "bg-[#E31C25]"
            }`}
          >
            <Check color="white" size={20} className="mr-2" />
            <Text className="text-white font-bold text-lg">
              {isSubmitting ? "Saving..." : "Save Exercise"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
