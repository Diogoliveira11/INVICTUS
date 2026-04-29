import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 1. Componente para itens com seta e valor (ex: Default Rest Timer)
const SettingLink = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
  >
    <Text className="text-zinc-200 text-base">{label}</Text>
    <View className="flex-row items-center gap-2">
      {value && <Text className="text-zinc-500 text-base">{value}</Text>}
      <ChevronRight size={18} color="#3F3F46" />
    </View>
  </TouchableOpacity>
);

// 2. Componente para itens com Switch (Interruptor)
const SettingSwitch = ({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) => (
  <View className="py-4 border-b border-zinc-900/50">
    <View className="flex-row items-center justify-between">
      <Text className="text-zinc-200 text-base flex-1 mr-4">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#3f3f46", true: "#E31C25" }} // Fica vermelho quando ativo
        thumbColor={"#FFFFFF"}
        ios_backgroundColor="#3f3f46"
      />
    </View>
    {description && (
      <Text className="text-zinc-500 text-xs mt-1 leading-4">
        {description}
      </Text>
    )}
  </View>
);

export default function WorkoutSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados para os Switches
  const [keepAwake, setKeepAwake] = useState(false);
  const [plateCalc, setPlateCalc] = useState(true);
  const [rpeTracking, setRpeTracking] = useState(false);
  const [smartScroll, setSmartScroll] = useState(false);
  const [inlineTimer, setInlineTimer] = useState(true);
  const [livePR, setLivePR] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase italic"
        >
          Workout Settings
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-5">
        {/* SECÇÃO DE LINKS */}
        <View className="mt-2">
          <SettingLink label="Sounds" />
          <SettingLink label="Default Rest Timer" value="2min 0s" />
          <SettingLink label="First day of the week" value="Monday" />
          <SettingLink label="Previous Workout Values" value="Default" />
          <SettingLink label="Warm-up Sets" />
        </View>

        {/* SECÇÃO DE SWITCHES */}
        <View className="mt-4">
          <SettingSwitch
            label="Keep Awake During Workout"
            description="Enable this if you don't want your phone to sleep while you're in a workout"
            value={keepAwake}
            onValueChange={setKeepAwake}
          />
          <SettingSwitch
            label="Plate Calculator"
            description="A plate calculator calculates the plates needed on a bar to achieve a specific weight."
            value={plateCalc}
            onValueChange={setPlateCalc}
          />
          <SettingSwitch
            label="RPE Tracking"
            description="RPE (Rated Perceived Exertion) is a measure of the intensity of an exercise."
            value={rpeTracking}
            onValueChange={setRpeTracking}
          />
          <SettingSwitch
            label="Smart Superset Scrolling"
            description="When you complete a set, it'll automatically scroll to the next exercise in the superset."
            value={smartScroll}
            onValueChange={setSmartScroll}
          />
          <SettingSwitch
            label="Inline Timer"
            description="Duration exercises have a built-in stopwatch for tracking time for each set."
            value={inlineTimer}
            onValueChange={setInlineTimer}
          />
          <SettingSwitch
            label="Live Personal Record Notification"
            description="When enabled, it'll notify you when you achieve a Personal Record."
            value={livePR}
            onValueChange={setLivePR}
          />
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
