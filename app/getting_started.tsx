import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BarChart2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ListChecks,
  Plus,
  Repeat2,
  Ruler,
  User,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RED = "#E31C25";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Step = {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tips: string[];
};

const STEPS: Step[] = [
  {
    icon: User,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.12)",
    title: "Set Up Your Profile",
    description:
      "Start by configuring your account and personal preferences so INVICTUS is tailored to you.",
    tips: [
      "Go to Settings → Account to update your name and email.",
      "Choose your preferred units (kg/lbs, km/mi) in Settings → Units.",
      "Your data stays local and private on your device.",
    ],
  },
  {
    icon: Dumbbell,
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.12)",
    title: "Start a Workout",
    description:
      "Log your first workout session. You can start from scratch or follow a routine.",
    tips: [
      'Tap the "+" button on the home screen to start a new workout.',
      "Give your workout a title to keep things organised.",
      "You can add notes to any workout for extra context.",
    ],
  },
  {
    icon: Plus,
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.12)",
    title: "Add Exercises",
    description:
      "Search from hundreds of exercises and add them to your workout with a single tap.",
    tips: [
      "Use the search bar to find any exercise by name or muscle group.",
      "Exercises are organised by category (chest, back, legs, etc.).",
      "You can reorder exercises by dragging them up or down.",
    ],
  },
  {
    icon: ListChecks,
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.12)",
    title: "Log Your Sets",
    description:
      "For each exercise, record your sets, reps, and weight. INVICTUS tracks your progress automatically.",
    tips: [
      "Tap '+ Add Set' below any exercise to log a new set.",
      "Change the set type: Normal, Warm-up, Drop set, or Failure.",
      "Personal records (PRs) are detected and highlighted automatically.",
    ],
  },
  {
    icon: Repeat2,
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.12)",
    title: "Build a Routine",
    description:
      "Create recurring workout plans so you always know what to train next.",
    tips: [
      'Go to the Routines tab and tap "New Routine".',
      "Add workout days and assign exercises to each day.",
      "You can follow a routine directly from your home screen.",
    ],
  },
  {
    icon: BarChart2,
    iconColor: "#facc15",
    iconBg: "rgba(250,204,21,0.12)",
    title: "Track Your Progress",
    description:
      "View your stats, volume over time, and personal records to stay motivated.",
    tips: [
      "Open the Stats tab to see your total volume and workout history.",
      "Tap any exercise to see your strength progression over time.",
      "Your PRs are saved automatically every time you beat a record.",
    ],
  },
  {
    icon: Ruler,
    iconColor: "#22d3ee",
    iconBg: "rgba(34,211,238,0.12)",
    title: "Back Up Your Data",
    description:
      "Export your workout data at any time and import it back whenever you need.",
    tips: [
      "Go to Settings → Export Data to save a JSON file of all your workouts.",
      "Use Settings → Import Data to restore from a previous backup.",
      "Keep your export file somewhere safe like iCloud or Google Drive.",
    ],
  },
];

const StepCard = ({ step }: { step: Step }) => {
  const Icon = step.icon;
  return (
    <View
      style={{ width: SCREEN_WIDTH - 32 }}
      className="bg-zinc-900 rounded-3xl p-7 mx-4"
    >
      {/* Icon */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor: step.iconBg,
          borderWidth: 1,
          borderColor: step.iconColor + "33",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        }}
      >
        <Icon size={32} color={step.iconColor} strokeWidth={2} />
      </View>

      {/* Title */}
      <Text
        style={{
          color: "#fff",
          fontSize: 22,
          fontWeight: "900",
          textTransform: "uppercase",
          marginBottom: 10,
          letterSpacing: 0.5,
        }}
      >
        {step.title}
      </Text>

      {/* Description */}
      <Text
        style={{
          color: "#a1a1aa",
          fontSize: 14,
          lineHeight: 22,
          marginBottom: 28,
          fontWeight: "600",
        }}
      >
        {step.description}
      </Text>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: "#27272a",
          marginBottom: 24,
        }}
      />

      {/* Tips */}
      <View style={{ gap: 14 }}>
        {step.tips.map((tip, i) => (
          <View
            key={i}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <CheckCircle2
              size={18}
              color={step.iconColor}
              strokeWidth={2.5}
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <Text
              style={{
                color: "#d4d4d8",
                fontSize: 13,
                lineHeight: 20,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {tip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function GettingStartedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goTo = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const isLast = currentIndex === STEPS.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/settings")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide">
          Getting Started
        </Text>
        <View className="w-9" />
      </View>

      {/* Step counter */}
      <View className="flex-row items-center justify-center pt-5 pb-4 gap-2">
        {STEPS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: i === currentIndex ? RED : "#3f3f46",
              }}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Step label */}
      <Text
        style={{
          color: RED,
          fontSize: 11,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 2,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Step {currentIndex + 1} of {STEPS.length}
      </Text>

      {/* Cards */}
      <FlatList
        ref={flatListRef}
        data={STEPS}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <StepCard step={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        style={{ flexGrow: 0 }}
      />

      {/* Navigation buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 24,
          gap: 12,
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          style={{
            flex: 1,
            backgroundColor: currentIndex === 0 ? "#18181b" : "#27272a",
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            opacity: currentIndex === 0 ? 0.4 : 1,
            borderWidth: 1,
            borderColor: "#3f3f46",
          }}
        >
          <ChevronLeft size={18} color="#a1a1aa" />
          <Text
            style={{
              color: "#a1a1aa",
              fontWeight: "800",
              fontSize: 14,
              textTransform: "uppercase",
            }}
          >
            Back
          </Text>
        </TouchableOpacity>

        {/* Next / Done button */}
        <TouchableOpacity
          onPress={() => {
            if (isLast) {
              router.replace("/settings");
            } else {
              goTo(currentIndex + 1);
            }
          }}
          style={{
            flex: 2,
            backgroundColor: RED,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize: 14,
              textTransform: "uppercase",
            }}
          >
            {isLast ? "Let's Go!" : "Next"}
          </Text>
          {!isLast && <ChevronRight size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
