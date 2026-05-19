import AsyncStorage from "@react-native-async-storage/async-storage";
import * as KeepAwake from "expo-keep-awake";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const REST_OPTIONS = [30, 60, 90, 120, 180, 240, 300];

export default function WorkoutSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [keepAwake, setKeepAwake] = useState(false);
  const [livePR, setLivePR] = useState(true);
  const [defaultRestTimer, setDefaultRestTimer] = useState(120);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("Monday");
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showRestPicker, setShowRestPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.multiGet([
        "ws_keepAwake",
        "ws_livePR",
        "ws_defaultRestTimer",
        "ws_firstDayOfWeek",
      ]);
      const map = Object.fromEntries(saved.map(([k, v]) => [k, v]));
      if (map.ws_keepAwake !== null) setKeepAwake(map.ws_keepAwake === "true");
      if (map.ws_livePR !== null) setLivePR(map.ws_livePR === "true");
      if (map.ws_defaultRestTimer !== null)
        setDefaultRestTimer(Number(map.ws_defaultRestTimer));
      if (map.ws_firstDayOfWeek !== null)
        setFirstDayOfWeek(map.ws_firstDayOfWeek!);
    })();
  }, []);

  const handleKeepAwake = async (val: boolean) => {
    setKeepAwake(val);
    await AsyncStorage.setItem("ws_keepAwake", String(val));
    if (val) {
      KeepAwake.activateKeepAwakeAsync();
    } else {
      KeepAwake.deactivateKeepAwake();
    }
  };

  const handleLivePR = async (val: boolean) => {
    setLivePR(val);
    await AsyncStorage.setItem("ws_livePR", String(val));
  };

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
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase"
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
            onValueChange={handleKeepAwake}
          />
          <SettingSwitch
            label="Live Personal Record Notification"
            description="When enabled, it'll notify you when you achieve a Personal Record."
            value={livePR}
            onValueChange={handleLivePR}
          />
        </View>

        {/* DEFAULT REST TIMER */}
        <TouchableOpacity
          onPress={() => setShowRestPicker(true)}
          className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
        >
          <Text className="text-zinc-200 text-base">Default Rest Timer</Text>
          <Text className="text-zinc-500 text-base">
            {formatRestTimer(defaultRestTimer)}
          </Text>
        </TouchableOpacity>

        {/* FIRST DAY OF WEEK */}
        <TouchableOpacity
          onPress={() => setShowDayPicker(true)}
          className="flex-row items-center justify-between py-4 border-b border-zinc-900/50"
        >
          <Text className="text-zinc-200 text-base">First Day of the Week</Text>
          <Text className="text-zinc-500 text-base">{firstDayOfWeek}</Text>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>

      {/* PICKER - DEFAULT REST TIMER */}
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
              onPress={async () => {
                setDefaultRestTimer(s);
                await AsyncStorage.setItem("ws_defaultRestTimer", String(s));
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

      {/* PICKER - FIRST DAY OF WEEK */}
      {showDayPicker && (
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
            First Day of the Week
          </Text>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={async () => {
                setFirstDayOfWeek(day);
                await AsyncStorage.setItem("ws_firstDayOfWeek", day);
                setShowDayPicker(false);
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
                  color: firstDayOfWeek === day ? "#E31C25" : "white",
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                {day}
              </Text>
              {firstDayOfWeek === day && (
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
            onPress={() => setShowDayPicker(false)}
            style={{ paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: "#71717a", fontWeight: "800" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
