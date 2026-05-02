import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Image as RNImage,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "./(tabs)/context/units_context";

// @ts-ignore
import InvictusLogo from "../assets/images/logo_invictus.jpeg";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { weightUnit, heightUnit } = useUnits();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(""); // read-only, updated via Body Measures
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalMessage, setPermissionModalMessage] = useState("");

  const redColor = "#E31C25";

  useEffect(() => {
    async function loadUserData() {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        if (!email) return;

        const userRow = await db.getFirstAsync<any>(
          "SELECT username, weight, height, profile_picture, gender, birthday FROM users WHERE email = ?",
          [email],
        );

        if (userRow) {
          setName(userRow.username || "");
          setWeight(userRow.weight ? String(userRow.weight) : "");
          setHeight(userRow.height ? String(userRow.height) : "");
          setProfileImage(userRow.profile_picture || null);
          setGender(userRow.gender || "Not set");

          if (userRow.birthday) {
            const date = new Date(userRow.birthday);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            setBirthday(formattedDate);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [db]);

  const launchPicker = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setPermissionModalMessage(
          "WE NEED CAMERA ACCESS TO TAKE YOUR PROFILE PHOTO!",
        );
        setPermissionModalVisible(true);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        mediaTypes: ["images"],
      });
      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } else {
      if (Platform.OS === "ios") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          setPermissionModalMessage(
            "WE NEED GALLERY ACCESS TO CHOOSE YOUR PROFILE PHOTO!",
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
        setProfileImage(result.assets[0].uri);
      }
    }
  };

  const handleImageOption = (useCamera: boolean) => {
    setShowImageModal(false);
    const delay = Platform.OS === "ios" ? 800 : 100;
    setTimeout(() => launchPicker(useCamera), delay);
  };

  const handleSave = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      await db.runAsync(
        "UPDATE users SET weight = ?, height = ?, profile_picture = ? WHERE email = ?",
        [weight, height, profileImage, email],
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color={redColor} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row justify-between items-center px-6 pb-5 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={28} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white font-black uppercase text-xl tracking-tighter">
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            style={{ color: redColor }}
            className="font-black uppercase text-xl tracking-tighter"
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="items-center mt-6">
          <View className="w-24 h-24 rounded-full border-2 border-[#E31C25] p-1">
            <View className="w-full h-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
              {profileImage ? (
                <RNImage
                  key={profileImage}
                  source={{ uri: profileImage }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={InvictusLogo}
                  className="w-full h-full"
                  contentFit="contain"
                />
              )}
            </View>
          </View>
          <TouchableOpacity
            className="mt-3"
            onPress={() => setShowImageModal(true)}
          >
            <Text
              style={{ color: redColor }}
              className="font-black uppercase text-[10px]"
            >
              Change Picture
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 mt-10">
          <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest mb-4 ">
            Athlete Data
          </Text>
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Username
            </Text>
            <Text className="text-white font-bold text-lg text-right">
              {name}
            </Text>
          </View>
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Weight ({weightUnit})
            </Text>
            <Text className="text-white font-bold text-lg text-right">
              {weight || "—"}
            </Text>
          </View>
          <View className="flex-row py-5 border-b border-zinc-900 items-center justify-between">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Height ({heightUnit})
            </Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              className="text-white font-bold text-lg text-right flex-1 ml-4"
              selectionColor={redColor}
            />
          </View>
        </View>

        <View className="px-6 mt-10">
          <View className="flex-row items-center mb-5 gap-2">
            <Text className="text-zinc-600 text-[11px] font-black uppercase tracking-widest ">
              Personal Info
            </Text>
            <HelpCircle size={14} color="#52525b" />
          </View>
          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Gender
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase text-sm"
            >
              {gender}
            </Text>
          </View>
          <View className="flex-row justify-between py-5 border-b border-zinc-900">
            <Text className="text-zinc-400 font-bold uppercase text-xs">
              Birthday
            </Text>
            <Text
              style={{ color: redColor }}
              className="font-black uppercase text-sm"
            >
              {birthday}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* MODAL CHOOSE SOURCE */}
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
                  Profile Photo
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

            {/* Camera */}
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
                <Camera color={redColor} size={26} strokeWidth={2.5} />
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

            {/* Gallery */}
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

      {/* MODAL PERMISSÃO NEGADA — estilo "ATTENTION" */}
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

      {/* MODAL SUCESSO */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center px-6">
          <View className="bg-[#121212] w-full p-8 rounded-[40px] border border-zinc-800 items-center">
            <View className="bg-green-500/10 p-4 rounded-full mb-6 border border-green-500/20">
              <Check color="#22c55e" size={32} />
            </View>
            <Text className="text-white text-center text-xl font-black uppercase mb-3">
              Success!
            </Text>
            <Text className="text-zinc-500 text-center text-sm font-bold uppercase mb-8">
              Profile updated successfully.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              className="w-full bg-[#E31C25] py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-black uppercase text-lg">
                Great!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
