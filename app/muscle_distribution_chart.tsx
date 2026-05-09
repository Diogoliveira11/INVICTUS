import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

import { clearSeedData, seedOldWorkouts } from "./seedTestData";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Period =
  | "Last 7 days"
  | "Last 30 days"
  | "Last 3 months"
  | "Last year"
  | "All time";

interface MuscleData {
  muscle: string;
  label: string;
  current: number;
  previous: number;
}

interface StatsData {
  workouts: { current: number; previous: number };
  duration: { current: number; previous: number }; // minutos totais
  volume: { current: number; previous: number };
  sets: { current: number; previous: number };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const PERIODS: Period[] = [
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "Last year",
  "All time",
];

const MUSCLES_ORDER = ["back", "chest", "core", "shoulders", "arms", "legs"];
const MUSCLE_LABELS: Record<string, string> = {
  back: "Back",
  chest: "Chest",
  core: "Core",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
};

// Mapeamento exacto dos muscle_group da BD (lowercase) → grupo do radar
const MUSCLE_GROUP_MAP: Record<string, string> = {
  back: "back",
  lats: "back",
  traps: "back",
  chest: "chest",
  abs: "core",
  core: "core",
  obliques: "core",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  quadriceps: "legs",
  hamstrings: "legs",
  calves: "legs",
  glutes: "legs",
  abductors: "legs",
  adductors: "legs",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function periodToDays(period: Period): number | null {
  switch (period) {
    case "Last 7 days":
      return 7;
    case "Last 30 days":
      return 30;
    case "Last 3 months":
      return 90;
    case "Last year":
      return 365;
    default:
      return null;
  }
}

/**
 * Formato na BD: "M:SS" (ex: "0:56" = 0min 56seg, "45:30" = 45min 30seg)
 * Devolve total em minutos (float).
 */
function parseDurationRows(rows: { duration: string | null }[]): number {
  return rows.reduce((acc, r) => {
    if (!r.duration) return acc;
    const parts = r.duration.split(":").map(Number);
    if (parts.length === 2) {
      // "M:SS" → minutos + segundos/60
      return acc + parts[0] + parts[1] / 60;
    }
    if (parts.length === 3) {
      // "H:MM:SS"
      return acc + parts[0] * 60 + parts[1] + parts[2] / 60;
    }
    return acc + Number(r.duration) / 60;
  }, 0);
}

function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins}min`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}min`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(0)}k kg`;
  return `${Math.round(kg)} kg`;
}

function diffLabel(
  current: number,
  previous: number,
  fmt?: (n: number) => string,
): string {
  const diff = current - previous;
  if (diff === 0) return "—";
  const f = fmt ?? ((n: number) => `${Math.round(n)}`);
  return diff > 0 ? `↑ ${f(Math.abs(diff))}` : `↓ ${f(Math.abs(diff))}`;
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({
  data,
  size = 280,
}: {
  data: MuscleData[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const n = MUSCLES_ORDER.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const maxVal = Math.max(
    1,
    ...data.map((d) => d.current),
    ...data.map((d) => d.previous),
  );

  const pts = (key: "current" | "previous") =>
    MUSCLES_ORDER.map((m, i) => {
      const entry = data.find((d) => d.muscle === m);
      const ratio = entry ? entry[key] / maxVal : 0;
      const r = ratio * maxR;
      return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
    });

  const curPts = pts("current");
  const prevPts = pts("previous");

  return (
    <Svg width={size} height={size}>
      {[1, 2, 3, 4, 5].map((lvl) => {
        const r = (maxR / 5) * lvl;
        const gridPts = MUSCLES_ORDER.map(
          (_, i) =>
            `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`,
        ).join(" ");
        return (
          <Polygon
            key={lvl}
            points={gridPts}
            fill="none"
            stroke="#2a2a2e"
            strokeWidth={1}
          />
        );
      })}

      {MUSCLES_ORDER.map((_, i) => (
        <Line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxR * Math.cos(angle(i))}
          y2={cy + maxR * Math.sin(angle(i))}
          stroke="#2a2a2e"
          strokeWidth={1}
        />
      ))}

      <Polygon
        points={prevPts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(150,150,150,0.08)"
        stroke="#555"
        strokeWidth={1.5}
      />
      <Polygon
        points={curPts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(227,28,37,0.15)"
        stroke="#E31C25"
        strokeWidth={2}
      />
      {curPts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#E31C25" />
      ))}

      {MUSCLES_ORDER.map((m, i) => {
        const lx = cx + (maxR + 22) * Math.cos(angle(i));
        const ly = cy + (maxR + 22) * Math.sin(angle(i));
        return (
          <SvgText
            key={m}
            x={lx}
            y={ly + 4}
            fill="#6b7280"
            fontSize={10}
            fontWeight="bold"
            textAnchor={lx < cx - 5 ? "end" : lx > cx + 5 ? "start" : "middle"}
          >
            {MUSCLE_LABELS[m]}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  diff,
  positive,
}: {
  label: string;
  value: string;
  diff: string;
  positive: boolean | null;
}) {
  const diffColor =
    positive === null
      ? "text-gray-500"
      : positive
        ? "text-green-400"
        : "text-red-400";
  return (
    <View className="flex-1 bg-[#1a1a1a] rounded-2xl p-4 m-1 border border-zinc-900">
      <Text className="text-gray-400 text-[11px] font-bold uppercase mb-1">
        {label}
      </Text>
      <Text className="text-white text-[20px] font-black">{value}</Text>
      <Text className={`text-[12px] font-bold mt-1 ${diffColor}`}>{diff}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MuscleDistributionChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [period, setPeriod] = useState<Period>("Last 30 days");
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [muscleData, setMuscleData] = useState<MuscleData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    workouts: { current: 0, previous: 0 },
    duration: { current: 0, previous: 0 },
    volume: { current: 0, previous: 0 },
    sets: { current: 0, previous: 0 },
  });

  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!userRow) return;

      const allSets = await db.getAllAsync<{
        muscle_group: string;
        cnt: number;
      }>(
        `SELECT e.muscle_group, COUNT(*) as cnt
       FROM workout_sets ws
       JOIN workout_exercises we ON ws.workout_exercise_id = we.id
       JOIN exercises e ON ws.exercise_id = e.id
       JOIN workouts w ON we.workout_id = w.id
       WHERE w.user_id = ?
       GROUP BY e.muscle_group`,
        [userRow.id],
      );
      console.log("[DEBUG all sets by muscle]", JSON.stringify(allSets));

      const durCheck = await db.getAllAsync<{ duration: string | null }>(
        "SELECT duration FROM workouts WHERE duration IS NOT NULL LIMIT 5",
      );
      console.log("[DEBUG duration raw]", JSON.stringify(durCheck));

      const uid = userRow.id;

      const days = periodToDays(period);

      // Filtros JOIN (com alias w)
      const dJoin = days ? `AND w.date >= date('now', '-${days} days')` : "";
      const pJoin = days
        ? `AND w.date >= date('now', '-${days * 2} days') AND w.date < date('now', '-${days} days')`
        : "AND 1=0";

      // Filtros diretos (sem alias)
      const dDir = days ? `AND date >= date('now', '-${days} days')` : "";
      const pDir = days
        ? `AND date >= date('now', '-${days * 2} days') AND date < date('now', '-${days} days')`
        : "AND 1=0";

      // ── Sets por músculo ──
      const [mCur, mPrev] = await Promise.all([
        db.getAllAsync<{ muscle_group: string; total_sets: number }>(
          `SELECT e.muscle_group, COUNT(ws.id) AS total_sets
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN exercises e ON ws.exercise_id = e.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${dJoin}
             AND LOWER(e.muscle_group) != 'cardio'
           GROUP BY e.muscle_group`,
          [uid],
        ),
        db.getAllAsync<{ muscle_group: string; total_sets: number }>(
          `SELECT e.muscle_group, COUNT(ws.id) AS total_sets
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN exercises e ON ws.exercise_id = e.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${pJoin}
             AND LOWER(e.muscle_group) != 'cardio'
           GROUP BY e.muscle_group`,
          [uid],
        ),
      ]);

      const grouped: Record<string, { current: number; previous: number }> = {
        back: { current: 0, previous: 0 },
        chest: { current: 0, previous: 0 },
        core: { current: 0, previous: 0 },
        shoulders: { current: 0, previous: 0 },
        arms: { current: 0, previous: 0 },
        legs: { current: 0, previous: 0 },
      };

      mCur.forEach((r) => {
        const group = MUSCLE_GROUP_MAP[r.muscle_group.toLowerCase()];
        if (group) grouped[group].current += r.total_sets;
      });
      mPrev.forEach((r) => {
        const group = MUSCLE_GROUP_MAP[r.muscle_group.toLowerCase()];
        if (group) grouped[group].previous += r.total_sets;
      });

      console.log("[DEBUG grouped]", JSON.stringify(grouped));

      setMuscleData(
        MUSCLES_ORDER.map((m) => ({
          muscle: m,
          label: MUSCLE_LABELS[m],
          current: grouped[m].current,
          previous: grouped[m].previous,
        })),
      );

      // ── Workouts ──
      const [wC, wP] = await Promise.all([
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? ${dDir}`,
          [uid],
        ),
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? ${pDir}`,
          [uid],
        ),
      ]);

      // ── Duration (formato "M:SS") ──
      const [durCurRows, durPrevRows] = await Promise.all([
        db.getAllAsync<{ duration: string | null }>(
          `SELECT duration FROM workouts WHERE user_id = ? ${dDir}`,
          [uid],
        ),
        db.getAllAsync<{ duration: string | null }>(
          `SELECT duration FROM workouts WHERE user_id = ? ${pDir}`,
          [uid],
        ),
      ]);

      const durCur = parseDurationRows(durCurRows);
      const durPrev = parseDurationRows(durPrevRows);

      // ── Volume ──
      const [vC, vP] = await Promise.all([
        db.getFirstAsync<{ total: number }>(
          `SELECT SUM(CAST(ws.weight AS REAL) * CAST(ws.reps AS INTEGER)) as total
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${dJoin}`,
          [uid],
        ),
        db.getFirstAsync<{ total: number }>(
          `SELECT SUM(CAST(ws.weight AS REAL) * CAST(ws.reps AS INTEGER)) as total
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${pJoin}`,
          [uid],
        ),
      ]);

      // ── Sets total ──
      const [sC, sP] = await Promise.all([
        db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) as total
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${dJoin}`,
          [uid],
        ),
        db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(*) as total
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? ${pJoin}`,
          [uid],
        ),
      ]);

      setStats({
        workouts: { current: wC?.cnt ?? 0, previous: wP?.cnt ?? 0 },
        duration: { current: durCur, previous: durPrev },
        volume: { current: vC?.total ?? 0, previous: vP?.total ?? 0 },
        sets: { current: sC?.total ?? 0, previous: sP?.total ?? 0 },
      });
    } catch (e) {
      console.error("[MuscleDistributionChart] loadData:", e);
    }
  }, [db, period]);

  useEffect(() => {
    clearSeedData(db)
      .then(() => seedOldWorkouts(db))
      .then(() => loadData());
  }, [loadData]);

  const radarSize = Math.min(Dimensions.get("window").width - 40, 320);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/statistics")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-[17px] font-black uppercase tracking-tight">
          Muscle Distribution
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Period selector */}
        <View className="px-4 pt-5 pb-2 items-center">
          <TouchableOpacity
            onPress={() => setShowPeriodModal(true)}
            className="bg-[#1a1a1a] rounded-xl px-5 py-2.5 flex-row items-center gap-2 border border-zinc-800"
          >
            <Text className="text-white text-[14px] font-bold">{period}</Text>
            <ChevronDown size={14} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Radar */}
        <View className="items-center mt-6 mb-4">
          <RadarChart data={muscleData} size={radarSize} />
        </View>

        {/* Legend */}
        <View className="flex-row justify-center gap-6 mb-8">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-[#E31C25]" />
            <Text className="text-zinc-400 text-[11px] font-bold uppercase">
              Current
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-[#3f3f46]" />
            <Text className="text-zinc-400 text-[11px] font-bold uppercase">
              Previous
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="px-3">
          <View className="flex-row">
            <StatCard
              label="Workouts"
              value={`${stats.workouts.current}`}
              diff={diffLabel(stats.workouts.current, stats.workouts.previous)}
              positive={
                stats.workouts.current === stats.workouts.previous
                  ? null
                  : stats.workouts.current > stats.workouts.previous
              }
            />
            <StatCard
              label="Duration"
              value={formatDuration(stats.duration.current)}
              diff={diffLabel(
                stats.duration.current,
                stats.duration.previous,
                formatDuration,
              )}
              positive={
                stats.duration.current === stats.duration.previous
                  ? null
                  : stats.duration.current > stats.duration.previous
              }
            />
          </View>
          <View className="flex-row">
            <StatCard
              label="Volume"
              value={formatVolume(stats.volume.current)}
              diff={diffLabel(
                stats.volume.current,
                stats.volume.previous,
                formatVolume,
              )}
              positive={
                stats.volume.current === stats.volume.previous
                  ? null
                  : stats.volume.current > stats.volume.previous
              }
            />
            <StatCard
              label="Sets"
              value={`${stats.sets.current}`}
              diff={diffLabel(stats.sets.current, stats.sets.previous)}
              positive={
                stats.sets.current === stats.sets.previous
                  ? null
                  : stats.sets.current > stats.sets.previous
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* Period modal */}
      <Modal visible={showPeriodModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/80 justify-end"
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View
            className="bg-[#1a1a1a] rounded-t-3xl px-4 pt-4 border-t border-zinc-800"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-12 h-1.5 bg-zinc-800 rounded-full self-center mb-6" />
            <Text className="text-white text-[18px] font-black uppercase mb-4 px-2">
              Select Period
            </Text>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  setPeriod(p);
                  setShowPeriodModal(false);
                }}
                className="py-4 px-2 border-b border-zinc-900 flex-row items-center justify-between"
              >
                <Text
                  className={`text-[16px] font-bold ${period === p ? "text-[#E31C25]" : "text-zinc-400"}`}
                >
                  {p}
                </Text>
                {period === p && (
                  <View className="w-2.5 h-2.5 rounded-full bg-[#E31C25]" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
