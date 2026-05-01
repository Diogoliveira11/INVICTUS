import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Camera,
  Clock,
  ImagePlus,
  Trophy,
  Weight,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [data, setData] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const fetchSummary = async () => {
    try {
      const lastWorkout = await db.getFirstAsync<any>(
        "SELECT * FROM workouts ORDER BY id DESC LIMIT 1",
      );
      if (lastWorkout) {
        const setsResult = await db.getFirstAsync<any>(
          "SELECT COUNT(*) as count FROM workout_sets WHERE workout_id = ?",
          [lastWorkout.id],
        );
        setData({ ...lastWorkout, setsCount: setsResult?.count || 0 });
      }
    } catch (e) {
      console.error("Erro ao carregar resumo:", e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [db]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à galeria para guardar fotos do treino.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso à câmara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="flex-1 px-6 pt-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Cabeçalho de Sucesso */}
        <View className="items-center mb-10">
          <View className="bg-amber-500/20 p-6 rounded-full mb-4 border border-amber-500/20">
            <Trophy size={60} color="#f59e0b" />
          </View>
          <Text className="text-white text-3xl font-black mb-1">Good job!</Text>
          <Text className="text-zinc-500 text-base">
            Training session completed successfully
          </Text>
        </View>

        {/* Grelha de Stats */}
        <View className="flex-row flex-wrap justify-between mb-8">
          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] mb-4 border border-zinc-800 items-center">
            <Clock size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.duration || "00:00"}
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Time
            </Text>
          </View>
          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] mb-4 border border-zinc-800 items-center">
            <Weight size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.total_volume || "0"} kg
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Volume
            </Text>
          </View>
          <View className="bg-[#121417] w-[48%] p-6 rounded-[32px] border border-zinc-800 items-center">
            <Zap size={24} color="#E31C25" />
            <Text className="text-white text-xl font-black mt-2">
              {data?.setsCount || "0"}
            </Text>
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">
              Series
            </Text>
          </View>
        </View>

        {/* ── SECÇÃO DE FOTOS ── */}
        <View className="mb-8">
          <Text className="text-white text-lg font-black uppercase tracking-tighter mb-1">
            Fotos do Treino
          </Text>
          <Text className="text-zinc-500 text-xs mb-4">
            Guarda uma memória deste treino
          </Text>

          {/* Botões câmara / galeria */}
          <View className="flex-row gap-x-3 mb-4">
            <TouchableOpacity
              onPress={takePhoto}
              className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl py-4 gap-x-2"
            >
              <Camera size={18} color="#E31C25" />
              <Text className="text-white font-black text-xs uppercase">
                Câmara
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              className="flex-1 flex-row items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl py-4 gap-x-2"
            >
              <ImagePlus size={18} color="#E31C25" />
              <Text className="text-white font-black text-xs uppercase">
                Galeria
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid de fotos selecionadas */}
          {photos.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {photos.map((uri, index) => (
                <View key={index} className="relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 100, height: 100, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                  >
                    <X size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {photos.length === 0 && (
            <View className="border border-dashed border-zinc-800 rounded-2xl py-8 items-center">
              <ImagePlus size={28} color="#3f3f46" />
              <Text className="text-zinc-600 text-xs font-bold uppercase mt-2">
                Nenhuma foto adicionada
              </Text>
            </View>
          )}
        </View>
        {/* ── FIM SECÇÃO FOTOS ── */}

        {/* Mensagem motivacional */}
        <View className="bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800 items-center">
          <Text className="text-zinc-400 text-center">
            Consistency is what turns the ordinary into the extraordinary.
          </Text>
        </View>
      </ScrollView>

      {/* Botão Concluído */}
      <View className="px-6 mb-10">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout")}
          className="bg-[#E31C25] w-full py-5 rounded-2xl items-center shadow-lg"
        >
          <Text className="text-white font-black text-lg uppercase tracking-widest">
            Completed
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
