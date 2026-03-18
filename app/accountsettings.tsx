import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ArrowLeft,
    ChevronRight,
    Lock,
    Mail,
    User
} from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Reaproveitando o teu componente SettingItem para manter a consistência
const SettingItem = ({ 
  icon: Icon, 
  label, 
  onPress 
}: { 
  icon: any, 
  label: string, 
  onPress?: () => void 
}) => (
  <TouchableOpacity 
    onPress={onPress}
    className="flex-row items-center justify-between py-5 border-b border-zinc-900/50"
  >
    <View className="flex-row items-center gap-4">
      <Icon size={22} color="#A1A1AA" />
      <Text className="text-zinc-200 text-base">{label}</Text>
    </View>
    <ChevronRight size={20} color="#3F3F46" />
  </TouchableOpacity>
);

export default function AccountSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View 
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row items-center px-5 pb-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg flex-1 text-center mr-8">
          Account Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* OPTIONS SECTION */}
        <View className="px-5 mt-2">
          <SettingItem 
            icon={User} 
            label="Change Username" 
            onPress={() => console.log("Change Username")}
          />
          <SettingItem 
            icon={Mail} 
            label="Change Email" 
            onPress={() => console.log("Change Email")}
          />
          <SettingItem 
            icon={Lock} 
            label="Update Password" 
            onPress={() => console.log("Update Password")}
          />
        </View>

        {/* DELETE ACCOUNT BUTTON */}
        <TouchableOpacity 
          className="mt-10 mb-10 items-center justify-center py-4"
          onPress={() => console.log("Delete account triggered")}
        >
          <Text className="text-[#E31C25] font-bold text-xl">
            Delete account
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}