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
  Zap
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

const RED = "#E31C25";

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

  const launchPicker = async (useCamera: boolean) => {
    if (useCamera) {
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

  const isFormValid =
    name.trim() && muscleGroup !== "Select" && equipment !== "Select";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#18181b",
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/workout/explore_exercises")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "#18181b",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#27272a",
          }}
        >
          <ArrowLeft color="white" size={20} />
        </TouchableOpacity>

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          New Exercise
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          style={{
            backgroundColor: isFormValid ? RED : "#27272a",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: isFormValid ? "white" : "#52525b",
              fontWeight: "900",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* ── Imagem ── */}
          <View
            style={{ alignItems: "center", paddingTop: 32, paddingBottom: 24 }}
          >
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              style={{
                width: 120,
                height: 120,
                borderRadius: 32,
                backgroundColor: "#111111",
                borderWidth: 2,
                borderColor: imageUri ? RED : "#27272a",
                borderStyle: imageUri ? "solid" : "dashed",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: "#1c1c1e",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CameraIcon color="#52525b" size={22} />
                  </View>
                  <Text
                    style={{
                      color: "#52525b",
                      fontSize: 10,
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Add Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {imageUri && (
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.2)",
                  gap: 6,
                }}
              >
                <Trash2 size={13} color="#ef4444" />
                <Text
                  style={{
                    color: "#ef4444",
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Formulário ── */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {/* Nome */}
            <View
              style={{
                backgroundColor: "#0f0f0f",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#1f1f1f",
                padding: 20,
              }}
            >
              <Text
                style={{
                  color: "#52525b",
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                Exercise Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Bench Press"
                placeholderTextColor="#3f3f46"
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "900",
                  padding: 0,
                }}
              />
              {name.length > 0 && (
                <View
                  style={{
                    height: 2,
                    backgroundColor: RED,
                    borderRadius: 1,
                    marginTop: 10,
                    width: `${Math.min(name.length * 4, 100)}%`,
                  }}
                />
              )}
            </View>

            {/* Equipment */}
            <TouchableOpacity
              onPress={() => openPicker("equipment")}
              style={{
                backgroundColor: "#0f0f0f",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: equipment !== "Select" ? "#2a1a1b" : "#1f1f1f",
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                  }}
                >
                  Equipment
                </Text>
                <Text
                  style={{
                    color: equipment === "Select" ? "#3f3f46" : "white",
                    fontSize: 20,
                    fontWeight: "900",
                  }}
                >
                  {equipment === "Select" ? "Choose equipment" : equipment}
                </Text>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor:
                    equipment !== "Select" ? "#E31C2520" : "#1c1c1e",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight
                  color={equipment !== "Select" ? RED : "#52525b"}
                  size={18}
                />
              </View>
            </TouchableOpacity>

            {/* Muscle Group */}
            <TouchableOpacity
              onPress={() => openPicker("muscle")}
              style={{
                backgroundColor: "#0f0f0f",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: muscleGroup !== "Select" ? "#2a1a1b" : "#1f1f1f",
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#52525b",
                    fontSize: 10,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    marginBottom: 6,
                  }}
                >
                  Muscle Group
                </Text>
                <Text
                  style={{
                    color: muscleGroup === "Select" ? "#3f3f46" : "white",
                    fontSize: 20,
                    fontWeight: "900",
                  }}
                >
                  {muscleGroup === "Select"
                    ? "Choose muscle group"
                    : muscleGroup}
                </Text>
              </View>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor:
                    muscleGroup !== "Select" ? "#E31C2520" : "#1c1c1e",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight
                  color={muscleGroup !== "Select" ? RED : "#52525b"}
                  size={18}
                />
              </View>
            </TouchableOpacity>

            {/* Dica de progresso */}
            {isFormValid && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#E31C2510",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E31C2525",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <Zap size={16} color={RED} />
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontSize: 12,
                    fontWeight: "700",
                    flex: 1,
                  }}
                >
                  Ready to save! Hit{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    SAVE
                  </Text>{" "}
                  to add this exercise to your library.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL ESCOLHA DE IMAGEM ── */}
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
                <CameraIcon color={RED} size={26} strokeWidth={2.5} />
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
                <ImageIcon color={RED} size={26} strokeWidth={2.5} />
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

      {/* ── MODAL PERMISSÃO NEGADA ── */}
      <Modal visible={permissionModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              padding: 32,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(245,158,11,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
                letterSpacing: 1,
              }}
            >
              Attention
            </Text>
            <Text
              style={{
                color: "#a1a1aa",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 20,
              }}
            >
              {permissionModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setPermissionModalVisible(false)}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL ALERTA VALIDAÇÃO ── */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              padding: 32,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(245,158,11,0.1)",
                padding: 16,
                borderRadius: 999,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.2)",
              }}
            >
              <AlertTriangle color="#f59e0b" size={32} strokeWidth={3} />
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Attention
            </Text>
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              {alertModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setAlertModalVisible(false)}
              style={{
                width: "100%",
                backgroundColor: RED,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 18,
                  textTransform: "uppercase",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL SELECÇÃO MÚSCULO / EQUIPAMENTO ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: "#0f0f0f",
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                borderTopWidth: 1,
                borderColor: "#1f1f1f",
                padding: 28,
                height: 520,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: "#27272a",
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: 24,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 22,
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {modalType === "muscle" ? "Muscle Group" : "Equipment"}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    backgroundColor: "#1c1c1e",
                    padding: 10,
                    borderRadius: 50,
                    borderWidth: 1,
                    borderColor: "#27272a",
                  }}
                >
                  <X size={16} color="#71717a" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {(modalType === "muscle" ? MUSCLE_GROUPS : EQUIPMENTS).map(
                  (opt) => {
                    const isSelected =
                      (modalType === "muscle" ? muscleGroup : equipment) ===
                      opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          if (modalType === "muscle") setMuscleGroup(opt);
                          else setEquipment(opt);
                          setModalVisible(false);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderRadius: 18,
                          marginBottom: 6,
                          backgroundColor: isSelected
                            ? "#E31C2512"
                            : "transparent",
                          borderWidth: 1,
                          borderColor: isSelected ? "#E31C2530" : "transparent",
                        }}
                      >
                        <View
                          style={{
                            width: 52,
                            height: 52,
                            marginRight: 16,
                            backgroundColor: "white",
                            borderRadius: 999,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: "#e4e4e7",
                          }}
                        >
                          {FILTER_ICONS[opt.toUpperCase()] ? (
                            <Image
                              source={FILTER_ICONS[opt.toUpperCase()]}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          ) : (
                            <View
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#27272a",
                              }}
                            />
                          )}
                        </View>
                        <Text
                          style={{
                            color: isSelected ? "white" : "#a1a1aa",
                            fontSize: 16,
                            fontWeight: "800",
                            textTransform: "uppercase",
                            flex: 1,
                            letterSpacing: 0.5,
                          }}
                        >
                          {opt}
                        </Text>
                        {isSelected && (
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              backgroundColor: RED,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check color="white" size={14} strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  },
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
