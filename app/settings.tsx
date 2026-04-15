import { useLocalSearchParams, useRouter } from "expo-router"; // Adicionado useLocalSearchParams
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Globe,
  HelpCircle,
  Info,
  Mail,
  Moon,
  Ruler,
  Share,
  Star,
  User,
} from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Componente para cada linha de configuração
const SettingItem = ({
  icon: Icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
  >
    <View className="flex-row items-center gap-4">
      <Icon size={22} color="#A1A1AA" />
      <Text className="text-zinc-200 text-base">{label}</Text>
    </View>
    <ChevronRight size={20} color="#3F3F46" />
  </TouchableOpacity>
);

// Componente para os títulos das secções
const SectionTitle = ({ title }: { title: string }) => (
  <View className="bg-zinc-900/50 px-5 py-3 mt-4">
    <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
      {title}
    </Text>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Captura o email que veio da tela anterior (ex: Profile ou Home)
  const params = useLocalSearchParams();
  const userEmail = params.email as string;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 10 }}
        className="flex-row items-center px-5 pb-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-xl flex-1 text-center mr-8">
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ACCOUNT SECTION */}
        <SectionTitle title="Account" />
        <View className="px-5">
          <SettingItem
            icon={User}
            label="Account"
            onPress={() =>
              router.push({
                pathname: "/accountsettings",
                params: { email: userEmail }, // Passa o email para a próxima tela
              })
            }
          />
        </View>

        {/* PREFERENCES SECTION */}
        <SectionTitle title="Preferences" />
        <View className="px-5">
          <SettingItem
            icon={Dumbbell}
            label="Workouts"
            onPress={() => router.push("/workoutsettings")}
          />

          <SettingItem icon={Ruler} label="Units" />
          <SettingItem icon={Globe} label="Language" />
          <SettingItem icon={Moon} label="Theme" />
          <SettingItem icon={Share} label="Export & Import Data" />
        </View>

        {/* GUIDES SECTION */}
        <SectionTitle title="Guides" />
        <View className="px-5">
          <SettingItem icon={Info} label="Getting Started Guide" />
          <SettingItem icon={ClipboardList} label="Routine Help" />
        </View>

        {/* HELP SECTION */}
        <SectionTitle title="Help" />
        <View className="px-5">
          <SettingItem icon={HelpCircle} label="Frequently Asked Questions" />
          <SettingItem icon={Mail} label="Contact Us" />
          <SettingItem icon={Star} label="Review Invictus on the App Store" />
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          className="mt-10 mb-10 items-center justify-center py-4"
          onPress={() => {
            console.log("Logout triggered");
            // Aqui você voltaria para o login, por exemplo:
            // router.replace("/auth/login");
          }}
        >
          <Text className="text-[#E31C25] font-bold text-xl">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
