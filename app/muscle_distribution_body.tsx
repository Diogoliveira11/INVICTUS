import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Body, { Slug } from "react-native-body-highlighter";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── tipos ────────────────────────────────────────────────────────────────────
interface MuscleSet {
  muscle_group: string;
  sets: number;
}

interface WeekDay {
  letter: string;
  dayNum: number;
  date: Date;
  isToday: boolean;
  hasWorkout: boolean;
}

// ─── helpers semana ───────────────────────────────────────────────────────────
function getWeekDays(offset: number): {
  days: Omit<WeekDay, "hasWorkout">[];
  label: string;
  monday: Date;
  sunday: Date;
} {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const letters = ["M", "T", "W", "T", "F", "S", "S"];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      letter: letters[i],
      dayNum: d.getDate(),
      date: d,
      isToday: d.toDateString() === now.toDateString(),
    });
  }

  const sunday = days[6].date;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const start = days[0];
  const end = days[6];
  const label =
    start.date.getMonth() === end.date.getMonth()
      ? `${start.dayNum}-${end.dayNum} ${months[start.date.getMonth()]} ${start.date.getFullYear()}`
      : `${start.dayNum} ${months[start.date.getMonth()]} - ${end.dayNum} ${months[end.date.getMonth()]} ${end.date.getFullYear()}`;

  return { days, label, monday, sunday };
}

// ─── mapa: muscle_group da BD → Slug do body-highlighter ─────────────────────
const MUSCLE_SLUG_MAP: Record<string, Slug[]> = {
  chest: ["chest"],
  pectorals: ["chest"],
  shoulders: ["deltoids"],
  delts: ["deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  abs: ["abs"],
  abdominals: ["abs"],
  core: ["abs"],
  obliques: ["obliques"],
  back: ["upper-back", "lower-back"],
  "upper back": ["upper-back"],
  "lower back": ["lower-back"],
  lats: ["upper-back"],
  traps: ["trapezius"],
  trapezius: ["trapezius"],
  neck: ["neck"],
  quads: ["quadriceps"],
  quadriceps: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  "hip flexors": ["gluteal"],
  calves: ["calves"],
  adductors: ["adductors"],
  abductors: ["adductors"],
};

const MUSCLE_LIST = [
  "Abdominals",
  "Abductors",
  "Adductors",
  "Biceps",
  "Calves",
  "Cardio",
  "Chest",
  "Forearms",
  "Glutes",
  "Hamstrings",
  "Hip Flexors",
  "Lats",
  "Lower Back",
  "Neck",
  "Obliques",
  "Quads",
  "Shoulders",
  "Traps",
  "Triceps",
  "Upper Back",
];

function intensityLevel(intensity: number): 1 | 2 | 3 {
  if (intensity <= 0.33) return 1;
  if (intensity <= 0.66) return 2;
  return 3;
}

function intensityToColor(intensity: number): string {
  if (intensity <= 0.33) return "#8B0010";
  if (intensity <= 0.66) return "#C41C25";
  return "#E31C25";
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function MuscleDistributionBodyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(
    () => (new Date().getDay() + 6) % 7,
  );
  const [muscleSets, setMuscleSets] = useState<MuscleSet[]>([]);
  const [totalSets, setTotalSets] = useState(0);
  const [workoutDays, setWorkoutDays] = useState<Set<string>>(new Set());

  const { days: rawDays, label, monday, sunday } = getWeekDays(weekOffset);

  const days: WeekDay[] = rawDays.map((d) => ({
    ...d,
    hasWorkout: workoutDays.has(d.date.toISOString().split("T")[0]),
  }));

  const selectedDate = days[selectedDayIdx]?.date;

  const loadWorkoutDays = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!userRow) return;
      const mondayStr = monday.toISOString().split("T")[0];
      const sundayStr = sunday.toISOString().split("T")[0];
      const rows = await db.getAllAsync<{ date: string }>(
        `SELECT DISTINCT date(date) as date FROM workouts
         WHERE user_id = ? AND date(date) BETWEEN ? AND ?`,
        [userRow.id, mondayStr, sundayStr],
      );
      setWorkoutDays(new Set(rows.map((r) => r.date)));
    } catch (e) {
      console.error("[MuscleDistBody] loadWorkoutDays:", e);
    }
  }, [db, monday, sunday]);

  const loadData = useCallback(async () => {
    if (!selectedDate) return;
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!userRow) return;
      const dateStr = selectedDate.toISOString().split("T")[0];
      const rows = await db.getAllAsync<MuscleSet>(
        `SELECT e.muscle_group, COUNT(ws.id) as sets
         FROM workout_sets ws
         JOIN workout_exercises we ON ws.workout_exercise_id = we.id
         JOIN exercises e ON ws.exercise_id = e.id
         JOIN workouts w ON we.workout_id = w.id
         WHERE w.user_id = ? AND date(w.date) = ?
         GROUP BY e.muscle_group
         ORDER BY sets DESC`,
        [userRow.id, dateStr],
      );
      setMuscleSets(rows);
      setTotalSets(rows.reduce((acc, r) => acc + r.sets, 0));
    } catch (e) {
      console.error("[MuscleDistBody] loadData:", e);
    }
  }, [db, selectedDate]);

  useEffect(() => {
    loadWorkoutDays();
  }, [loadWorkoutDays]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxSets = Math.max(...muscleSets.map((m) => m.sets), 1);

  // Constrói bodyData com tipo correto: { slug: Slug; intensity: number; color: string }[]
  const bodyData: { slug: Slug; intensity: number; color: string }[] = [];
  const seenSlugs = new Set<Slug>();

  muscleSets.forEach((m) => {
    const slugs = MUSCLE_SLUG_MAP[m.muscle_group.toLowerCase()] ?? [];
    const intensity = m.sets / maxSets;
    const level = intensityLevel(intensity);
    slugs.forEach((slug) => {
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        bodyData.push({
          slug,
          intensity: level,
          color: level === 1 ? "#3D0000" : level === 2 ? "#C41C25" : "#FF1C25",
        });
      }
    });
  });

  const setsMap: Record<string, number> = {};
  muscleSets.forEach((m) => {
    setsMap[m.muscle_group] = m.sets;
  });

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 border-b border-[#1f1f1f] bg-[#0a0a0a]"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold">
          Body distribution
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* WEEK NAVIGATOR */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            onPress={() => setWeekOffset((o) => o - 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <ChevronLeft size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-sm font-bold">{label}</Text>
          <TouchableOpacity
            onPress={() => weekOffset < 0 && setWeekOffset((o) => o + 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <ChevronRight
              size={22}
              color={weekOffset < 0 ? "#fff" : "#3f3f46"}
            />
          </TouchableOpacity>
        </View>

        {/* DAY SELECTOR */}
        <View className="flex-row justify-between px-4 mb-4">
          {days.map((d, idx) => {
            const isSelected = selectedDayIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedDayIdx(idx)}
                className="items-center"
                style={{ width: 40 }}
              >
                <Text
                  className="text-xs font-bold mb-1"
                  style={{ color: isSelected ? "#fff" : "#6b7280" }}
                >
                  {d.letter}
                </Text>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? "#E31C25" : "transparent",
                  }}
                >
                  <Text
                    className="font-bold text-sm"
                    style={{ color: isSelected ? "#fff" : "#9ca3af" }}
                  >
                    {d.dayNum}
                  </Text>
                </View>
                {d.hasWorkout && !isSelected && (
                  <View className="w-1.5 h-1.5 rounded-full bg-[#E31C25] mt-1" />
                )}
                {d.isToday && !isSelected && !d.hasWorkout && (
                  <View className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BODY HIGHLIGHTER */}
        <View className="flex-row justify-center gap-x-4 bg-[#0d0d0d] mx-4 rounded-3xl py-6 mb-2 border border-[#1f1f1f]">
          <Body
            data={bodyData}
            gender="male"
            side="front"
            scale={0.8}
            colors={["#3D0000", "#C41C25", "#FF1C25"]}
            defaultFill="#1e1e22"
            border="none"
          />
          <Body
            data={bodyData}
            gender="male"
            side="back"
            scale={0.8}
            colors={["#3D0000", "#C41C25", "#FF1C25"]}
            defaultFill="#1e1e22"
            border="none"
          />
        </View>

        {/* LEGENDA */}
        <View className="flex-row items-center justify-center gap-x-5 mt-3 mb-1">
          {(["Low", "Mid", "Max"] as const).map((lbl, i) => {
            const colors = ["#8B0010", "#C41C25", "#E31C25"];
            return (
              <View key={lbl} className="flex-row items-center gap-x-1.5">
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    backgroundColor: colors[i],
                  }}
                />
                <Text className="text-zinc-600 text-[10px] font-bold uppercase">
                  {lbl}
                </Text>
              </View>
            );
          })}
        </View>

        {/* DIVIDER */}
        <View className="h-[1px] bg-[#1f1f1f] mx-4 mt-4" />

        {/* TABELA */}
        <View className="px-4 pt-2">
          <View className="flex-row justify-between py-3 border-b border-[#1f1f1f]">
            <Text className="text-zinc-500 text-xs font-bold uppercase">
              Muscle
            </Text>
            <Text className="text-zinc-500 text-xs font-bold uppercase">
              Sets
            </Text>
          </View>
          <View className="flex-row justify-between py-4 border-b border-[#1f1f1f]">
            <Text className="text-white font-bold text-sm">Total</Text>
            <Text className="text-[#E31C25] font-black text-sm">
              {totalSets}
            </Text>
          </View>
          {MUSCLE_LIST.map((muscle) => {
            const sets = setsMap[muscle] ?? 0;
            const intensity = maxSets > 0 ? sets / maxSets : 0;
            return (
              <View
                key={muscle}
                className="flex-row justify-between items-center py-4 border-b border-[#1f1f1f]"
              >
                <View className="flex-row items-center gap-x-3">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        sets > 0 ? intensityToColor(intensity) : "#2a2a2e",
                    }}
                  />
                  <Text
                    className="text-sm"
                    style={{ color: sets > 0 ? "#fff" : "#6b7280" }}
                  >
                    {muscle}
                  </Text>
                </View>
                <Text
                  className="text-sm font-bold"
                  style={{ color: sets > 0 ? "#E31C25" : "#3f3f46" }}
                >
                  {sets}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
