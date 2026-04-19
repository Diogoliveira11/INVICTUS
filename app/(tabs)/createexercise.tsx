import * as ImagePicker from "expo-image-picker"; // Importar o ImagePicker
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  Camera as CameraIcon,
  Check,
  ChevronRight,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MUSCLE_GROUPS = [
  "Abdominals",
  "Abductors",
  "Adductors",
  "Biceps",
  "Calves",
  "Chest",
  "Forearms",
  "Full Body",
  "Glutes",
  "Hamstrings",
  "Lats",
  "Lower Back",
  "Quads",
  "Shoulders",
  "Triceps",
  "Upper Back",
];

const EQUIPMENTS = [
  "None",
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Machine",
  "Plate",
  "Resistance Band",
  "Suspension Band",
  "Other",
];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Select");
  const [equipment, setEquipment] = useState("Select");
  const [imageUri, setImageUri] = useState<string | null>(null); // Estado para a imagem
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  // Função para escolher a imagem
  const handlePickImage = async () => {
    Alert.alert("Exercise Image", "Choose a source:", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Permission denied",
              "We need camera access to take photos.",
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });
          if (!result.canceled) setImageUri(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || muscleGroup === "Select" || equipment === "Select") {
      Alert.alert("Erro", "Por favor, preenche todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Gerar ID Manual (visto que a tua tabela não tem Autoincrement)
      const lastExercise = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM exercises ORDER BY id DESC LIMIT 1",
      );
      const nextId = (lastExercise?.id || 0) + 1;

      // 2. Inserir (Garante que os nomes vão em Trim para a pesquisa funcionar)
      await db.runAsync(
        "INSERT INTO exercises (id, name, muscle_group, equipment, image, is_custom) VALUES (?, ?, ?, ?, ?, ?)",
        [nextId, name.trim(), muscleGroup, equipment, imageUri, 1],
      );

      console.log("Exercício criado com ID:", nextId);

      Alert.alert("Sucesso", "Exercício criado!", [
        {
          text: "OK",
          onPress: () => {
            // Voltamos para o explore forçando o refresh
            router.replace("/workout/explore_exercises");
          },
        },
      ]);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Não foi possível salvar o exercício.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPicker = (type: "muscle" | "equipment") => {
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black uppercase italic">
          New Exercise
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
          <Text className="text-[#E31C25] font-black uppercase italic">
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
          {/* FOTO CIRCLE - AGORA FUNCIONAL */}
          <View className="items-center my-8">
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-28 h-28 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center border-dashed overflow-hidden"
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View className="items-center">
                  <CameraIcon color="#52525b" size={30} />
                  <Text className="text-zinc-500 text-[10px] font-black uppercase mt-1">
                    Add Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                className="mt-2"
              >
                <Text className="text-[#E31C25] text-[10px] font-bold uppercase">
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* NOME DO EXERCÍCIO */}
          <View className="mb-8">
            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">
              Exercise Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Bench Press"
              placeholderTextColor="#3f3f46"
              className="text-white text-xl font-bold border-b border-zinc-800 pb-2"
            />
          </View>

          {/* EQUIPAMENTO */}
          <TouchableOpacity
            onPress={() => openPicker("equipment")}
            className="flex-row items-center justify-between py-5 border-b border-zinc-900"
          >
            <View>
              <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Equipment
              </Text>
              <Text
                className={`text-lg font-bold ${equipment === "Select" ? "text-zinc-700" : "text-white"}`}
              >
                {equipment}
              </Text>
            </View>
            <ChevronRight color="#27272a" size={20} />
          </TouchableOpacity>

          {/* GRUPO MUSCULAR */}
          <TouchableOpacity
            onPress={() => openPicker("muscle")}
            className="flex-row items-center justify-between py-5 border-b border-zinc-900"
          >
            <View>
              <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
                Primary Muscle Group
              </Text>
              <Text
                className={`text-lg font-bold ${muscleGroup === "Select" ? "text-zinc-700" : "text-white"}`}
              >
                {muscleGroup}
              </Text>
            </View>
            <ChevronRight color="#27272a" size={20} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/90 justify-end">
          <View className="bg-zinc-900 rounded-t-[40px] h-[70%]">
            <View className="w-12 h-1 bg-zinc-800 rounded-full self-center my-4" />
            <Text className="text-white text-center font-black uppercase italic mb-4">
              Select {modalType === "muscle" ? "Muscle" : "Equipment"}
            </Text>

            <FlatList
              data={modalType === "muscle" ? MUSCLE_GROUPS : EQUIPMENTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (modalType === "muscle") setMuscleGroup(item);
                    else setEquipment(item);
                    setModalVisible(false);
                  }}
                  className="flex-row items-center px-8 py-4 border-b border-zinc-800/50"
                >
                  <Text className="text-white text-lg font-bold flex-1">
                    {item}
                  </Text>
                  {(modalType === "muscle" ? muscleGroup : equipment) ===
                    item && <Check color="#E31C25" size={20} />}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="m-6 bg-zinc-800 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold uppercase">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
