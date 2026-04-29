import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  AlertTriangle,
  ArrowLeft,
  Camera as CameraIcon,
  Check,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
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
  "Abs",
  "Abductors",
  "Adductors",
  "Biceps",
  "Calves",
  "Chest",
  "Forearms",
  "Glutes",
  "Hamstrings",
  "Lats",
  "Quadriceps",
  "Shoulders",
  "Triceps",
];

const EQUIPMENTS = ["Barbell", "Cable", "Dumbbell", "Machine", "Other"];

export default function CreateExerciseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();

  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("Select");
  const [equipment, setEquipment] = useState("Select");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");
  const [showImageModal, setShowImageModal] = useState(false);

  // Custom permission modal (estilo ATTENTION)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalMessage, setPermissionModalMessage] = useState("");

  // Custom alert modal (estilo ATTENTION — para validação do formulário)
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState("");

  const redColor = "#E31C25";

  const pickImage = async (useCamera: boolean) => {
    setShowImageModal(false);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== "granted") {
      if (permission.canAskAgain === false) {
        // iOS: permissão negada permanentemente, redirecionar para definições
        setPermissionModalMessage(
          useCamera
            ? "CAMERA ACCESS WAS DENIED. PLEASE ENABLE IT IN YOUR DEVICE SETTINGS."
            : "GALLERY ACCESS WAS DENIED. PLEASE ENABLE IT IN YOUR DEVICE SETTINGS.",
        );
        setPermissionModalVisible(true);
        // Abre as definições após fechar o modal
        setTimeout(() => Linking.openSettings(), 1500);
      } else {
        setPermissionModalMessage(
          useCamera
            ? "WE NEED CAMERA ACCESS TO ADD AN EXERCISE PHOTO!"
            : "WE NEED GALLERY ACCESS TO CHOOSE AN EXERCISE PHOTO!",
        );
        setPermissionModalVisible(true);
      }
      return;
    }
    const result = await (useCamera
      ? ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        })
      : ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        }));

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || muscleGroup === "Select" || equipment === "Select") {
      setAlertModalMessage("PLEASE FILL IN ALL FIELDS BEFORE SAVING!");
      setAlertModalVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const lastExercise = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM exercises ORDER BY id DESC LIMIT 1",
      );
      const nextId = (lastExercise?.id || 0) + 1;

      await db.runAsync(
        "INSERT INTO exercises (id, name, muscle_group, equipment, image, is_custom) VALUES (?, ?, ?, ?, ?, ?)",
        [nextId, name.trim(), muscleGroup, equipment, imageUri, 1],
      );

      // Reset form so next time the screen opens it's blank
      setName("");
      setMuscleGroup("Select");
      setEquipment("Select");
      setImageUri(null);

      router.replace("/workout/explore_exercises");
    } catch (error) {
      console.error("Save error:", error);
      setAlertModalMessage("COULD NOT SAVE THE EXERCISE. PLEASE TRY AGAIN!");
      setAlertModalVisible(true);
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

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout/explore_exercises")}
        >
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
          {/* FOTO CIRCLE */}
          <View className="items-center my-8">
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
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

      {/* MODAL CHOOSE SOURCE */}
      <Modal visible={showImageModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowImageModal(false)}
        >
          <View className="bg-[#121212] p-10 rounded-t-[40px] border-t border-zinc-800">
            <Text className="text-white text-center font-black uppercase italic mb-8 tracking-widest text-sm">
              Choose Source
            </Text>
            <View className="flex-row justify-around mb-6">
              <TouchableOpacity
                onPress={() => pickImage(true)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-5 rounded-3xl mb-2 border border-zinc-800 shadow-md">
                  <CameraIcon color={redColor} size={32} />
                </View>
                <Text className="text-zinc-400 font-black uppercase italic text-[10px]">
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pickImage(false)}
                className="items-center"
              >
                <View className="bg-zinc-900 p-5 rounded-3xl mb-2 border border-zinc-800 shadow-md">
                  <ImageIcon color={redColor} size={32} />
                </View>
                <Text className="text-zinc-400 font-black uppercase italic text-[10px]">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL PERMISSÃO NEGADA — estilo ATTENTION */}
      <Modal visible={permissionModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-10">
          <View className="bg-[#1a1a1a] w-full p-8 rounded-[32px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase italic mb-3 tracking-wider">
              Attention
            </Text>
            <Text className="text-zinc-400 text-center text-sm font-black uppercase italic mb-8 leading-5">
              {permissionModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setPermissionModalVisible(false)}
              className="w-full py-4 rounded-2xl items-center"
              style={{ backgroundColor: redColor }}
            >
              <Text className="text-white font-black uppercase italic text-lg tracking-wider">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ALERTA VALIDAÇÃO — estilo ATTENTION */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-10">
          <View className="bg-[#1a1a1a] w-full p-8 rounded-[32px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase italic mb-3 tracking-wider">
              Attention
            </Text>
            <Text className="text-zinc-400 text-center text-sm font-black uppercase italic mb-8 leading-5">
              {alertModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setAlertModalVisible(false)}
              className="w-full py-4 rounded-2xl items-center"
              style={{ backgroundColor: redColor }}
            >
              <Text className="text-white font-black uppercase italic text-lg tracking-wider">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SELECÇÃO MÚSCULO / EQUIPAMENTO */}
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
