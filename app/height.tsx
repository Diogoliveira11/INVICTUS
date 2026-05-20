import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ArrowLeft, ChevronRight, Minus, Plus } from "lucide-react-native";
import React, { useCallback, useMemo, useRef } from "react";
import {
  Alert,
  PanResponder,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUnits } from "../context/units_context";
import { updateUserHeight } from "../src/database";

const CM_MIN = 120;
const CM_MAX = 220;
const FT_MIN = 4;
const FT_MAX = 8;
const IN_MIN = 0;
const IN_MAX = 11;

const HOLD_DELAY = 350;
const HOLD_INTERVAL = 80;
const TURBO_THRESHOLD = 10;
const TURBO_INTERVAL = 30;

export default function HeightSelection() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { heightUnit: unit } = useUnits();

  const [cmValue, setCmValue] = React.useState(170);
  const [ftValue, setFtValue] = React.useState(5);
  const [inValue, setInValue] = React.useState(7);

  const cmProgress = useMemo(
    () => (cmValue - CM_MIN) / (CM_MAX - CM_MIN),
    [cmValue],
  );
  const ftProgress = useMemo(
    () => (ftValue - FT_MIN) / (FT_MAX - FT_MIN),
    [ftValue],
  );
  const inProgress = useMemo(
    () => (inValue - IN_MIN) / (IN_MAX - IN_MIN),
    [inValue],
  );

  const handleNext = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "User session lost. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }

      let heightToSave: string;
      let numericValue: number;

      if (unit === "CM") {
        heightToSave = cmValue.toString();
        numericValue = cmValue;
      } else {
        heightToSave = `${ftValue}.${inValue}`;
        numericValue = ftValue + inValue / 10;
      }

      await updateUserHeight(db, userEmail, heightToSave);
      await AsyncStorage.setItem("userHeightUnit", unit);

      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          value REAL NOT NULL,
          type TEXT NOT NULL,
          recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      await db.runAsync(
        "INSERT INTO body_measurements (user_email, value, type, recorded_at) VALUES (?, ?, 'height', datetime('now'))",
        [userEmail, numericValue],
      );

      router.replace("/workoutschedule");
    } catch (e) {
      console.error("Error saving height:", e);
      Alert.alert("Error", "Could not save height.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121417]">
      <View className="flex-1 px-6 py-8 justify-between">
        {/* Title */}
        <View className="items-center mt-5">
          <Text className="text-3xl font-bold text-white text-center">
            What´s your height?
          </Text>
          <Text className="text-sm text-gray-400 text-center mt-2 px-5">
            This helps us create your personalized plan
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-1 justify-center gap-6 my-6">
          {unit === "CM" ? (
            <StepperCard
              label="Centimeters"
              value={cmValue}
              unit="cm"
              onIncrement={() => setCmValue((v) => Math.min(v + 1, CM_MAX))}
              onDecrement={() => setCmValue((v) => Math.max(v - 1, CM_MIN))}
              progress={cmProgress}
              canDecrement={cmValue > CM_MIN}
              canIncrement={cmValue < CM_MAX}
            />
          ) : (
            <>
              <StepperCard
                label="Feet"
                value={ftValue}
                unit="ft"
                onIncrement={() => setFtValue((v) => Math.min(v + 1, FT_MAX))}
                onDecrement={() => setFtValue((v) => Math.max(v - 1, FT_MIN))}
                progress={ftProgress}
                canDecrement={ftValue > FT_MIN}
                canIncrement={ftValue < FT_MAX}
              />
              <StepperCard
                label="Inches"
                value={inValue}
                unit="in"
                onIncrement={() => setInValue((v) => Math.min(v + 1, IN_MAX))}
                onDecrement={() => setInValue((v) => Math.max(v - 1, IN_MIN))}
                progress={inProgress}
                canDecrement={inValue > IN_MIN}
                canIncrement={inValue < IN_MAX}
              />
            </>
          )}
        </View>

        {/* Unit badge */}
        <View className="items-center mb-6">
          <View className="bg-[#2D2F33] rounded-full px-8 py-3">
            <Text className="text-white font-bold text-base">{unit}</Text>
          </View>
        </View>

        {/* Navigation */}
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity
            className="bg-[#2D2F33] w-14 h-14 rounded-full justify-center items-center"
            onPress={() => router.push("/weight")}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#E31C25] flex-row items-center py-4 px-8 rounded-full"
            onPress={handleNext}
          >
            <Text className="text-white text-lg font-bold mr-2">Next</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface HoldButtonProps {
  onAction: () => void;
  disabled: boolean;
  children: React.ReactNode;
  baseColor: string;
  pressedColor: string;
}

function HoldButton({
  onAction,
  disabled,
  children,
  baseColor,
  pressedColor,
}: HoldButtonProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef(0);
  const activeRef = useRef(false);
  const [pressed, setPressed] = React.useState(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stepsRef.current = 0;
    setPressed(false);
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    if (activeRef.current) return;

    activeRef.current = true;
    setPressed(true);

    onAction();

    timeoutRef.current = setTimeout(() => {
      if (!activeRef.current) return;
      stepsRef.current = 0;

      intervalRef.current = setInterval(() => {
        if (!activeRef.current) {
          stop();
          return;
        }
        onAction();
        stepsRef.current += 1;

        if (stepsRef.current === TURBO_THRESHOLD) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!activeRef.current) return;
          intervalRef.current = setInterval(() => {
            if (!activeRef.current) {
              stop();
              return;
            }
            onAction();
          }, TURBO_INTERVAL);
        }
      }, HOLD_INTERVAL);
    }, HOLD_DELAY);
  }, [disabled, onAction, stop]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: () => false,
        onPanResponderGrant: () => {
          start();
        },
        onPanResponderRelease: () => {
          stop();
        },
        onPanResponderTerminate: () => {
          stop();
        },
        onPanResponderTerminationRequest: () => true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: pressed ? pressedColor : baseColor,
        justifyContent: "center",
        alignItems: "center",
        opacity: disabled ? 0.3 : 1,
      }}
    >
      {children}
    </View>
  );
}

interface StepperCardProps {
  label: string;
  value: number;
  unit: string;
  onIncrement: () => void;
  onDecrement: () => void;
  progress: number;
  canIncrement: boolean;
  canDecrement: boolean;
}

function StepperCard({
  label,
  value,
  unit,
  onIncrement,
  onDecrement,
  progress,
  canIncrement,
  canDecrement,
}: StepperCardProps) {
  return (
    <View className="bg-[#1E2025] rounded-3xl px-6 py-5">
      <Text className="text-gray-400 text-sm font-medium mb-4">{label}</Text>

      <View className="flex-row items-center justify-between mb-5">
        <HoldButton
          onAction={onDecrement}
          disabled={!canDecrement}
          baseColor="#2D2F33"
          pressedColor="#3a3d42"
        >
          <Minus color="white" size={22} />
        </HoldButton>

        <View className="items-center">
          <Text
            className="text-white font-bold"
            style={{ fontSize: 56, lineHeight: 64 }}
          >
            {value}
          </Text>
          <Text className="text-gray-500 text-base font-medium -mt-1">
            {unit}
          </Text>
        </View>

        <HoldButton
          onAction={onIncrement}
          disabled={!canIncrement}
          baseColor="#E31C25"
          pressedColor="#ff2f38"
        >
          <Plus color="white" size={22} />
        </HoldButton>
      </View>

      <View className="h-1.5 bg-[#2D2F33] rounded-full overflow-hidden">
        <View
          className="h-full bg-[#E31C25] rounded-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
    </View>
  );
}
