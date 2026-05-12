import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Trophy,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnits } from "./(tabs)/context/units_context";

const RED = "#E31C25";

// ─── TIPOS ─────────
type WorkoutDay = {
  workoutId: number;
  date: string;
  title: string;
  duration: string;
  total_volume: number;
  notes: string;
  photo: string | null;
  muscles: string[];
};

type CalendarDay = {
  day: number;
  dateStr: string;
  isToday: boolean;
  workout: WorkoutDay | null;
};

type WorkoutExercise = {
  exercise_name: string;
  muscle_group: string;
  weight: number;
  reps: number;
  set_type: string;
  index_order: number;
  is_personal_record: number;
  distance: number | null;
  time: string | null;
};

const MONTH_LABELS = [
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
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_LETTERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function abbrevMuscle(m: string): string {
  const map: Record<string, string> = {
    chest: "CHEST",
    back: "BACK",
    shoulders: "SHLD",
    biceps: "BICE",
    triceps: "TRI",
    legs: "LEGS",
    quads: "QUAD",
    hamstrings: "HAMS",
    glutes: "GLUT",
    calves: "CALV",
    abs: "ABS",
    core: "CORE",
    lats: "LATS",
    traps: "TRAP",
    forearms: "FORE",
    "upper back": "U.BACK",
    "lower back": "L.BACK",
  };
  return map[m.toLowerCase()] ?? m.slice(0, 4).toUpperCase();
}

function buildCalendarGrid(year: number, month: number): CalendarDay[][] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(year, month - 1, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarDay[] = [];
  for (let i = 0; i < startDow; i++)
    cells.push({ day: 0, dateStr: "", isToday: false, workout: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const dateStr = `${year}-${mm}-${dd}`;
    cells.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      workout: null,
    });
  }
  while (cells.length % 7 !== 0)
    cells.push({ day: 0, dateStr: "", isToday: false, workout: null });
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil(
    (new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

function getSetTypeStyle(set_type: string) {
  switch (set_type) {
    case "W":
      return { label: "WARMUP", bg: "bg-amber-500/10", text: "text-amber-500" };
    case "D":
      return {
        label: "DROP SET",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
      };
    case "F":
      return { label: "FAILURE", bg: "bg-red-500/10", text: "text-red-500" };
    default:
      return { label: "NORMAL", bg: "bg-zinc-800", text: "text-zinc-400" };
  }
}

const isCardio = (mg: string) => mg?.toLowerCase() === "cardio";

function DayCell({
  cell,
  onPress,
}: {
  cell: CalendarDay;
  onPress: () => void;
}) {
  if (cell.day === 0) return <View style={{ flex: 1 }} />;
  const hasWorkout = cell.workout !== null;
  const muscles = cell.workout?.muscles ?? [];
  const muscleLabel = muscles.slice(0, 2).map(abbrevMuscle).join(" | ");

  return (
    <TouchableOpacity
      style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}
      onPress={hasWorkout ? onPress : undefined}
      activeOpacity={hasWorkout ? 0.7 : 1}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: hasWorkout ? RED : "transparent",
          borderWidth: cell.isToday && !hasWorkout ? 1.5 : 0,
          borderColor: cell.isToday ? RED : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: hasWorkout ? "#fff" : cell.isToday ? RED : "#a1a1aa",
            fontWeight: hasWorkout ? "900" : "600",
            fontSize: 14,
          }}
        >
          {cell.day}
        </Text>
      </View>
      {hasWorkout && muscleLabel ? (
        <Text
          style={{
            color: "#52525b",
            fontSize: 7.5,
            fontWeight: "700",
            textTransform: "uppercase",
            marginTop: 3,
            textAlign: "center",
            letterSpacing: 0.2,
          }}
          numberOfLines={1}
        >
          {muscleLabel}
        </Text>
      ) : (
        <View style={{ height: 13 }} />
      )}
    </TouchableOpacity>
  );
}

export default function MonthlyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const { weightUnit } = useUnits();
  const weightUnitLower = weightUnit.toLowerCase();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [joinYear, setJoinYear] = useState(now.getFullYear());
  const [joinMonth, setJoinMonth] = useState(1);

  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDay | null>(
    null,
  );
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    [],
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const isJoinMonth = year === joinYear && month === joinMonth;

  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const userRow = await db.getFirstAsync<{
        id: number;
        created_count: string;
      }>("SELECT id, created_count FROM users WHERE email = ?", [email]);
      if (!userRow) return;

      if (userRow.created_count) {
        const joinDate = new Date(userRow.created_count);
        if (!isNaN(joinDate.getTime())) {
          setJoinYear(joinDate.getFullYear());
          setJoinMonth(joinDate.getMonth() + 1);
        }
      }

      const monthStr = `${year}-${String(month).padStart(2, "0")}`;

      const workoutRows = await db.getAllAsync<{
        id: number;
        date: string;
        title: string;
        duration: string;
        total_volume: number;
        notes: string;
        photo: string | null;
      }>(
        `SELECT id, date(date) as date, title, duration, total_volume, notes, photo
         FROM workouts
         WHERE user_id = ? AND strftime('%Y-%m', date) = ?
         ORDER BY date ASC`,
        [userRow.id, monthStr],
      );

      const wDays: WorkoutDay[] = await Promise.all(
        workoutRows.map(async (w) => {
          const muscleRows = await db.getAllAsync<{ muscle_group: string }>(
            `SELECT DISTINCT e.muscle_group
             FROM workout_exercises we
             JOIN exercises e ON e.id = we.exercise_id
             WHERE we.workout_id = ? AND e.muscle_group != 'Cardio'`,
            [w.id],
          );
          return {
            workoutId: w.id,
            date: w.date,
            title: w.title,
            duration: w.duration,
            total_volume: w.total_volume,
            notes: w.notes,
            photo: w.photo,
            muscles: muscleRows.map((r) => r.muscle_group).slice(0, 3),
          };
        }),
      );
      setWorkoutDays(wDays);
    } catch (e) {
      console.error("[MonthlyReport]", e);
    }
  }, [db, year, month]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  // ── DETALHES TREINO ABERTO ───
  const openWorkout = async (w: WorkoutDay) => {
    setSelectedWorkout(w);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const details = await db.getAllAsync<WorkoutExercise>(
        `SELECT e.name as exercise_name, e.muscle_group,
                ws.weight, ws.reps, ws.distance, ws.time,
                ws.set_type, ws.index_order, ws.is_personal_record
         FROM workout_sets ws
         JOIN workout_exercises we ON ws.workout_exercise_id = we.id
         JOIN exercises e ON ws.exercise_id = e.id
         WHERE we.workout_id = ?
         ORDER BY we.index_order ASC, ws.index_order ASC`,
        [w.workoutId],
      );
      setWorkoutExercises(details ?? []);
    } catch (e) {
      console.error("[openWorkout]", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Calendario ─────
  const workoutMap: Record<string, WorkoutDay> = {};
  workoutDays.forEach((w) => {
    workoutMap[w.date] = w;
  });

  const weeks = buildCalendarGrid(year, month).map((week) =>
    week.map((cell) => ({
      ...cell,
      workout: cell.dateStr ? (workoutMap[cell.dateStr] ?? null) : null,
    })),
  );

  // ── Navegação ───────
  const goToPrev = () => {
    if (isJoinMonth) return;
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // ── Grupo exercisios ─────
  const exerciseGroups = Object.values(
    workoutExercises.reduce(
      (acc, obj) => {
        const key = obj.exercise_name;
        if (!acc[key]) acc[key] = { name: key, sets: [] };
        acc[key].sets.push(obj);
        return acc;
      },
      {} as Record<string, { name: string; sets: WorkoutExercise[] }>,
    ),
  );

  // ── Estatisticas ─────
  const workoutCount = workoutDays.length;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 border-b border-zinc-900 bg-black"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center justify-center gap-x-3">
          <TouchableOpacity
            onPress={goToPrev}
            className="p-1"
            style={{ opacity: isJoinMonth ? 0.3 : 1 }}
          >
            <ChevronLeft size={18} color="#71717a" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-black uppercase tracking-wide">
            {MONTH_SHORT[month - 1]} {year}
          </Text>
          <TouchableOpacity
            onPress={goToNext}
            className="p-1"
            style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <ChevronRight size={18} color="#71717a" />
          </TouchableOpacity>
        </View>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* STATS */}
        <View className="flex-row mx-4 gap-x-3 mt-5 mb-5">
          {[
            { label: "Workouts", value: `${workoutCount}` },
            {
              label: "Days trained",
              value: `${workoutCount} / ${new Date(year, month, 0).getDate()}`,
            },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: "#111",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#27272a",
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: "#52525b",
                  fontSize: 10,
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {s.label}
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* CALENDARIO */}
        <View className="mx-4 bg-zinc-900/20 rounded-[28px] border border-zinc-800 overflow-hidden">
          <Text
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize: 22,
              textTransform: "uppercase",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {MONTH_LABELS[month - 1]} {year}
          </Text>

          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 8,
              paddingBottom: 4,
            }}
          >
            {DAY_LETTERS.map((l) => (
              <Text
                key={l}
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: "#3f3f46",
                  fontSize: 11,
                  fontWeight: "800",
                  textTransform: "uppercase",
                }}
              >
                {l}
              </Text>
            ))}
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: "#27272a",
              marginHorizontal: 12,
              marginBottom: 4,
            }}
          />

          {weeks.map((week, wi) => (
            <View
              key={wi}
              style={{ flexDirection: "row", paddingHorizontal: 8 }}
            >
              {week.map((cell, di) => (
                <DayCell
                  key={di}
                  cell={cell}
                  onPress={() => cell.workout && openWorkout(cell.workout)}
                />
              ))}
            </View>
          ))}
          <View style={{ height: 12 }} />
        </View>
      </ScrollView>

      {/* ── MODAL DETALHES TREINO ── */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View className="flex-1 bg-black/95 justify-end">
          <View className="h-[92%] bg-[#050505] rounded-t-[50px] border-t border-[#E31C25]/40">
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mt-4" />

            {/* Modal header */}
            <View className="px-8 pt-8 pb-6">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setShowDetail(false)}
                  className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800"
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
                <View className="items-end flex-1 ml-4">
                  <Text className="text-[#E31C25] text-[9px] font-black uppercase tracking-widest mb-1">
                    {selectedWorkout ? formatDate(selectedWorkout.date) : ""}
                  </Text>
                  <Text
                    className="text-white text-2xl font-black tracking-tighter"
                    numberOfLines={1}
                  >
                    {selectedWorkout?.title || "Workout"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color={RED} />
                    <Text
                      style={{ color: RED }}
                      className="text-xs font-black uppercase ml-1"
                    >
                      {selectedWorkout?.duration || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Volume + Date row */}
              <View className="flex-row mt-6 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-900 justify-around">
                <View className="items-center">
                  <Text className="text-zinc-500 text-[8px] font-black uppercase mb-1">
                    Volume Total
                  </Text>
                  <Text className="text-white font-black">
                    {selectedWorkout?.total_volume ?? 0}
                    {weightUnitLower}
                  </Text>
                </View>
                <View className="w-[1px] bg-zinc-800" />
                <View className="items-center">
                  <Text className="text-zinc-500 text-[8px] font-black uppercase mb-1">
                    Date
                  </Text>
                  <Text className="text-white font-black">
                    {selectedWorkout
                      ? new Date(selectedWorkout.date).toLocaleDateString(
                          "en-US",
                        )
                      : "--"}
                  </Text>
                </View>
              </View>

              {selectedWorkout?.photo && (
                <View className="mt-4 rounded-3xl overflow-hidden border border-zinc-800">
                  <Image
                    source={{ uri: selectedWorkout.photo }}
                    style={{ width: "100%", height: 180 }}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>

            {/* Exercisios */}
            {detailLoading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color={RED} size="large" />
              </View>
            ) : (
              <ScrollView
                className="px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {exerciseGroups.map((group, idx) => (
                  <View
                    key={idx}
                    className="mb-6 bg-zinc-900/20 rounded-[32px] p-6 border border-zinc-900"
                  >
                    {/* Nome exercício */}
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-[#E31C25] text-lg font-black uppercase tracking-tighter flex-1 mr-2">
                        {group.name}
                      </Text>
                    </View>

                    {/* Sets header */}
                    <View className="flex-row mb-3 px-2">
                      <Text className="text-zinc-600 text-[8px] font-black uppercase w-8">
                        Set
                      </Text>
                      <Text className="text-zinc-600 text-[8px] font-black uppercase flex-1 text-center">
                        Type
                      </Text>
                      <Text className="text-zinc-600 text-[8px] font-black uppercase w-20 text-center">
                        {isCardio(group.sets[0]?.muscle_group)
                          ? "Dist."
                          : "Weight"}
                      </Text>
                      <Text className="text-zinc-600 text-[8px] font-black uppercase w-24 text-right">
                        {isCardio(group.sets[0]?.muscle_group)
                          ? "Time"
                          : "Reps"}
                      </Text>
                    </View>

                    {/* Sets rows */}
                    {group.sets.map((set, sIdx) => {
                      const { label, bg, text } = getSetTypeStyle(set.set_type);
                      return (
                        <View
                          key={sIdx}
                          className="flex-row items-center py-3 border-b border-zinc-800/30 px-2"
                        >
                          <Text className="text-zinc-500 font-black w-8">
                            {sIdx + 1}
                          </Text>
                          <View className="flex-1 items-center">
                            <View className={`px-2 py-0.5 rounded-md ${bg}`}>
                              <Text className={`text-[8px] font-black ${text}`}>
                                {label}
                              </Text>
                            </View>
                          </View>
                          <View className="w-20 flex-row items-center justify-center">
                            <Text
                              className="text-white font-black text-center"
                              numberOfLines={1}
                            >
                              {isCardio(set.muscle_group)
                                ? `${parseFloat(String(set.distance ?? set.weight ?? 0).replace(",", "."))}km`
                                : `${set.weight}${weightUnitLower}`}
                            </Text>
                            {set.is_personal_record === 1 && (
                              <Trophy
                                size={10}
                                color="#FFD700"
                                style={{ marginLeft: 2 }}
                              />
                            )}
                          </View>
                          <Text
                            className="text-zinc-200 font-black w-24 text-right"
                            numberOfLines={1}
                          >
                            {isCardio(set.muscle_group)
                              ? (set.time ?? "00:00:00")
                              : set.reps}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {selectedWorkout?.notes ? (
                  <View className="mt-2 p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-[32px]">
                    <Text className="text-zinc-500 text-[10px] font-black uppercase mb-2">
                      Notes
                    </Text>
                    <Text className="text-zinc-300 text-sm">{`"${selectedWorkout.notes}"`}</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
