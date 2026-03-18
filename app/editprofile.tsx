import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, HelpCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados para os campos (podes carregar estes dados da tua DB)
  const [name, setName] = useState("Diogo Oliveira");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("https://example.com");

  const redColor = "#E31C25";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View 
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row justify-between items-center px-5 pb-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text className="text-white font-bold text-lg">Edit Profile</Text>
        
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-zinc-500 font-bold text-lg">Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AVATAR SECTION */}
        <View className="items-center mt-8">
          <View className="w-28 h-28 rounded-full bg-zinc-800 overflow-hidden">
            <Image
              source={{ uri: "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg" }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <TouchableOpacity className="mt-4">
            <Text style={{ color: redColor }} className="font-bold text-base">
              Change Picture
            </Text>
          </TouchableOpacity>
        </View>

        {/* PUBLIC DATA SECTION */}
        <View className="px-5 mt-10">
          <Text className="text-zinc-500 text-sm mb-4">Public profile data</Text>
          
          {/* Campo Nome */}
          <View className="flex-row py-4 border-b border-zinc-900">
            <Text className="text-white w-20 font-medium">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#3f3f46"
              className="text-white flex-1"
            />
          </View>

          {/* Campo Bio */}
          <View className="flex-row py-4 border-b border-zinc-900">
            <Text className="text-white w-20 font-medium">Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Describe yourself"
              placeholderTextColor="#3f3f46"
              multiline
              className="text-white flex-1"
            />
          </View>

          {/* Campo Link */}
          <View className="flex-row py-4 border-b border-zinc-900">
            <Text className="text-white w-20 font-medium">Link</Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="Add a link"
              placeholderTextColor="#3f3f46"
              className="text-white flex-1"
            />
          </View>
        </View>

        {/* PRIVATE DATA SECTION */}
        <View className="px-5 mt-10 mb-10">
          <View className="flex-row items-center mb-4 gap-2">
            <Text className="text-zinc-500 text-sm">Private data</Text>
            <HelpCircle size={16} color="#52525b" />
          </View>

          {/* Campo Sexo */}
          <TouchableOpacity className="flex-row justify-between py-4 border-b border-zinc-900">
            <Text className="text-white font-medium">Sex</Text>
            <Text style={{ color: redColor }} className="font-medium">Male</Text>
          </TouchableOpacity>

          {/* Campo Aniversário */}
          <TouchableOpacity className="flex-row justify-between py-4 border-b border-zinc-900">
            <Text className="text-white font-medium">Birthday</Text>
            <Text style={{ color: redColor }} className="font-medium">Oct 30, 2005</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}