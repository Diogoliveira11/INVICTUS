import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  AlertTriangle,
  ArrowLeft,
  Camera as CameraIcon,
  Check,
  ChevronRight,
  Image as ImageIcon,
  Trash2,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
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

import { FILTER_ICONS } from "../../constants/exercise_filters";

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

  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalMessage, setPermissionModalMessage] = useState("");

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState("");

  const redColor = "#E31C25";

  const launchPicker = async (useCamera: boolean) => {
    if (useCamera) {
      // Câmara — sempre pede permissão
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setPermissionModalMessage(
          "WE NEED CAMERA ACCESS TO ADD AN EXERCISE PHOTO!",
        );
        setPermissionModalVisible(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        mediaTypes: ["images"],
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } else {
      // Galeria — no Android 13+ não precisa de permissão
      if (Platform.OS === "ios") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setPermissionModalMessage(
            "WE NEED GALLERY ACCESS TO CHOOSE AN EXERCISE PHOTO!",
          );
          setPermissionModalVisible(true);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.5,
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    }
  };

  const handleImageOption = (useCamera: boolean) => {
    setShowImageModal(false);
    const delay = Platform.OS === "ios" ? 800 : 100;
    setTimeout(() => launchPicker(useCamera), delay);
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

      <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-900">
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout/explore_exercises")}
        >
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black uppercase">
          New Exercise
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
          <Text className="text-[#E31C25] font-black uppercase">Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
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

            {imageUri && (
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                className="mt-3 flex-row items-center bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20"
              >
                <Trash2 size={14} color="#ef4444" />
                <Text className="text-red-400 text-[10px] font-black uppercase ml-2">
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

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

      {/* MODAL CHOOSE SOURCE — igual em iOS e Android */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#0f0f0f",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderTopWidth: 1,
              borderColor: "#27272a",
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 48,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#3f3f46",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 24,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View>
                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Add Photo
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  Choose how to add your image
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={{
                  backgroundColor: "#27272a",
                  padding: 10,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: "#3f3f46",
                }}
              >
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* Camera option */}
            <TouchableOpacity
              onPress={() => handleImageOption(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#27272a",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#E31C2518",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <CameraIcon color={redColor} size={26} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    fontSize: 15,
                    letterSpacing: 0.5,
                  }}
                >
                  Take Photo
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 3,
                  }}
                >
                  Use your camera
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#27272a",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <ChevronRight color="#52525b" size={18} />
              </View>
            </TouchableOpacity>

            {/* Gallery option */}
            <TouchableOpacity
              onPress={() => handleImageOption(false)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                padding: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#27272a",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#E31C2518",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <ImageIcon color={redColor} size={26} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    fontSize: 15,
                    letterSpacing: 0.5,
                  }}
                >
                  Choose from Gallery
                </Text>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginTop: 3,
                  }}
                >
                  Pick from your photos
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#27272a",
                  padding: 8,
                  borderRadius: 12,
                }}
              >
                <ChevronRight color="#52525b" size={18} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PERMISSÃO NEGADA */}
      <Modal visible={permissionModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-10">
          <View className="bg-[#1a1a1a] w-full p-8 rounded-[32px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase mb-3 tracking-wider">
              Attention
            </Text>
            <Text className="text-zinc-400 text-center text-sm font-black uppercase mb-8 leading-5">
              {permissionModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setPermissionModalVisible(false)}
              className="w-full py-4 rounded-2xl items-center"
              style={{ backgroundColor: redColor }}
            >
              <Text className="text-white font-black uppercase text-lg tracking-wider">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ALERTA VALIDAÇÃO */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-10">
          <View className="bg-[#1a1a1a] w-full p-8 rounded-[32px] border border-zinc-800 items-center">
            <View className="bg-amber-500/10 p-4 rounded-full mb-6 border border-amber-500/20">
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase mb-3 tracking-wider">
              Attention
            </Text>
            <Text className="text-zinc-400 text-center text-sm font-black uppercase mb-8 leading-5">
              {alertModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setAlertModalVisible(false)}
              className="w-full py-4 rounded-2xl items-center"
              style={{ backgroundColor: redColor }}
            >
              <Text className="text-white font-black uppercase text-lg tracking-wider">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL SELECÇÃO MÚSCULO / EQUIPAMENTO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/80 justify-end"
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              className="bg-[#121212] rounded-t-[40px] p-8 border-t border-zinc-800"
              style={{ height: 500 }}
            >
              <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-6" />
              <Text className="text-white text-xl font-black uppercase mb-6">
                {modalType === "muscle" ? "Muscles" : "Equipment"}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Opção ALL */}
                <TouchableOpacity
                  onPress={() => {
                    if (modalType === "muscle") setMuscleGroup("Select");
                    else setEquipment("Select");
                    setModalVisible(false);
                  }}
                  className="flex-row items-center py-4 border-b border-zinc-900"
                >
                  <View className="w-16 h-16 mr-6 bg-white rounded-full items-center justify-center overflow-hidden border border-zinc-800">
                    <Image
                      source={FILTER_ICONS["ALL"]}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                  <Text className="text-white text-lg flex-1 font-bold uppercase">
                    All
                  </Text>
                  {(modalType === "muscle"
                    ? muscleGroup === "Select"
                    : equipment === "Select") && (
                    <Check color="#E31C25" size={24} />
                  )}
                </TouchableOpacity>

                {/* Opções dinâmicas */}
                {(modalType === "muscle" ? MUSCLE_GROUPS : EQUIPMENTS).map(
                  (opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        if (modalType === "muscle") setMuscleGroup(opt);
                        else setEquipment(opt);
                        setModalVisible(false);
                      }}
                      className="flex-row items-center py-4 border-b border-zinc-900"
                    >
                      <View className="w-16 h-16 mr-6 bg-white rounded-full items-center justify-center overflow-hidden border border-zinc-800">
                        {FILTER_ICONS[opt.toUpperCase()] ? (
                          <Image
                            source={FILTER_ICONS[opt.toUpperCase()]}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View className="w-full h-full bg-zinc-800" />
                        )}
                      </View>
                      <Text className="text-white text-lg flex-1 font-bold uppercase">
                        {opt}
                      </Text>
                      {(modalType === "muscle" ? muscleGroup : equipment) ===
                        opt && <Check color="#E31C25" size={24} />}
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
