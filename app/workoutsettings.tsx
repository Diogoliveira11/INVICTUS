import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkoutSettings } from "../context/settings_context";

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
        trackColor={{ false: "#3f3f46", true: "#E31C25" }}
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

const REST_OPTIONS = [30, 60, 90, 120, 180, 240, 300];

export default function WorkoutSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { keepAwake, defaultRestTimer, setKeepAwake, setDefaultRestTimer } =
    useWorkoutSettings();

  const [showRestPicker, setShowRestPicker] = useState(false);

  const formatRestTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}min` : `${m}min ${s}s`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4"
        >
          Workout Settings
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-5">
        <View className="mt-4">
          <SettingSwitch
            label="Keep Awake During Workout"
            description="Enable this if you don't want your phone to sleep while you're in a workout."
            value={keepAwake}
            onValueChange={setKeepAwake}
          />
        </View>

        <TouchableOpacity
          onPress={() => setShowRestPicker(true)}
          className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
        >
          <Text className="text-zinc-200 text-base">Default Rest Timer</Text>
          <Text className="text-zinc-500 text-base">
            {formatRestTimer(defaultRestTimer)}
          </Text>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>

      {showRestPicker && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#121212",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            borderTopWidth: 1,
            borderColor: "#27272a",
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#3f3f46",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 16,
              textTransform: "uppercase",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Default Rest Timer
          </Text>
          {REST_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setDefaultRestTimer(s);
                setShowRestPicker(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#27272a",
              }}
            >
              <Text
                style={{
                  color: defaultRestTimer === s ? "#E31C25" : "white",
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                {formatRestTimer(s)}
              </Text>
              {defaultRestTimer === s && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#E31C25",
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowRestPicker(false)}
            style={{ paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#71717a", fontWeight: "800" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
