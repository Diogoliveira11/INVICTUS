import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useUnits } from "./(tabs)/context/units_context";

const RED = "#E31C25";
const SCREEN_W = Dimensions.get("window").width;

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MetricKey = "Workouts" | "Duration" | "Volume" | "Sets";

type MonthPoint = {
  monthLabel: string; // "Jan", "Feb", ...
  year: number;
  month: number; // 1-12
  value: number;
};

type Summary = {
  workouts: number;
  durationSec: number;
  volumeKg: number;
  sets: number;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const MONTH_LABELS = [
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

// Parses "MM:SS" → seconds, "H:MM:SS" → seconds
function parseTimerToSeconds(s: string): number {
  if (!s) return 0;
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0min";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k kg`;
  return `${Math.round(kg)} kg`;
}

function getDiffLabel(
  current: number,
  previous: number,
): { text: string; up: boolean } | null {
  if (previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  return {
    text: diff > 0 ? `↑ ${Math.abs(diff)}` : `↓ ${Math.abs(diff)}`,
    up: diff > 0,
  };
}

function getDiffLabelFormatted(
  current: number,
  previous: number,
  metric: MetricKey,
): { text: string; up: boolean } | null {
  if (previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const up = diff > 0;
  let text = "";
  if (metric === "Duration") {
    text = `${up ? "↑" : "↓"} ${formatDuration(Math.abs(diff))}`;
  } else if (metric === "Volume") {
    text = `${up ? "↑" : "↓"} ${formatVolume(Math.abs(diff))}`;
  } else {
    text = `${up ? "↑" : "↓"} ${Math.abs(diff)}`;
  }
  return { text, up };
}

// ─── BAR CHART ───────────────────────────────────────────────────────────────
function BarChart({
  data,
  currentMonth,
  currentYear,
  metric,
}: {
  data: MonthPoint[];
  currentMonth: number;
  currentYear: number;
  metric: MetricKey;
}) {
  const W = SCREEN_W - 32;
  const H = 180;
  const PAD_LEFT = 36;
  const PAD_RIGHT = 8;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 28;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  if (data.length === 0) {
    return (
      <View
        style={{ height: H, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#3f3f46", fontWeight: "bold", fontSize: 12 }}>
          No data
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxV = Math.max(...values, 1);

  // Nice Y labels: 0, mid, max
  const niceMax = (() => {
    const raw = maxV;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const candidates = [1, 2, 2.5, 5, 10].map((s) => s * mag);
    return candidates.find((c) => c >= raw) ?? raw;
  })();
  const yLabels = [0, Math.round(niceMax / 2), Math.round(niceMax)];

  const barW = Math.max(4, Math.min(22, (chartW / data.length) * 0.55));
  const gap = chartW / data.length;

  const toX = (i: number) => PAD_LEFT + gap * i + gap / 2;
  const toBarH = (v: number) => (v / niceMax) * chartH;
  const toBarY = (v: number) => PAD_TOP + chartH - toBarH(v);

  return (
    <Svg width={W} height={H}>
      {/* Y grid + labels */}
      {yLabels.map((v, i) => {
        const y = PAD_TOP + chartH - (v / niceMax) * chartH;
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_LEFT}
              y1={y}
              x2={W - PAD_RIGHT}
              y2={y}
              stroke="#27272a"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <SvgText
              x={PAD_LEFT - 4}
              y={y + 4}
              fontSize={9}
              fill="#52525b"
              textAnchor="end"
              fontWeight="bold"
            >
              {v}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const isSelected = d.month === currentMonth && d.year === currentYear;
        const bH = Math.max(2, toBarH(d.value));
        const bY = toBarY(d.value);
        const x = toX(i) - barW / 2;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={bY}
              width={barW}
              height={bH}
              rx={4}
              fill={isSelected ? RED : "#27272a"}
            />
            {/* X label */}
            <SvgText
              x={toX(i)}
              y={H - 4}
              fontSize={8.5}
              fill={isSelected ? RED : "#52525b"}
              textAnchor="middle"
              fontWeight="bold"
            >
              {d.monthLabel[0]}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  diff,
}: {
  label: string;
  value: string;
  diff: { text: string; up: boolean } | null;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#27272a",
        padding: 16,
        minHeight: 90,
      }}
    >
      <Text
        style={{
          color: "#71717a",
          fontSize: 11,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>
        {value}
      </Text>
      {diff && (
        <Text
          style={{
            color: diff.up ? "#22c55e" : "#ef4444",
            fontSize: 12,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {diff.text}
        </Text>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function MonthlyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const { weightUnit } = useUnits();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [activeMetric, setActiveMetric] = useState<MetricKey>("Workouts");

  const [chartData, setChartData] = useState<MonthPoint[]>([]);
  const [currentSummary, setCurrentSummary] = useState<Summary>({
    workouts: 0,
    durationSec: 0,
    volumeKg: 0,
    sets: 0,
  });
  const [prevSummary, setPrevSummary] = useState<Summary>({
    workouts: 0,
    durationSec: 0,
    volumeKg: 0,
    sets: 0,
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

      // ── Last 12 months of bar chart data ────────────────────────────────
      const points: MonthPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const monthStr = String(m).padStart(2, "0");

        let value = 0;
        if (activeMetric === "Workouts") {
          const row = await db.getFirstAsync<{ cnt: number }>(
            `SELECT COUNT(*) as cnt FROM workouts
             WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
            [userRow.id, `${y}-${monthStr}`],
          );
          value = row?.cnt ?? 0;
        } else if (activeMetric === "Duration") {
          const rows = await db.getAllAsync<{ duration: string }>(
            `SELECT duration FROM workouts
             WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND duration IS NOT NULL`,
            [userRow.id, `${y}-${monthStr}`],
          );
          // duration stored as "MM:SS" (e.g. "45:23") or "H:MM:SS" (e.g. "1:23:45")
          value = rows.reduce((acc, r) => {
            return acc + parseTimerToSeconds(r.duration ?? "");
          }, 0);
        } else if (activeMetric === "Volume") {
          const row = await db.getFirstAsync<{ vol: number }>(
            `SELECT SUM(ws.weight * ws.reps) as vol
             FROM workout_sets ws
             JOIN workout_exercises we ON ws.workout_exercise_id = we.id
             JOIN workouts w ON we.workout_id = w.id
             WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
            [userRow.id, `${y}-${monthStr}`],
          );
          value = Math.round(row?.vol ?? 0);
        } else if (activeMetric === "Sets") {
          const row = await db.getFirstAsync<{ cnt: number }>(
            `SELECT COUNT(*) as cnt
             FROM workout_sets ws
             JOIN workout_exercises we ON ws.workout_exercise_id = we.id
             JOIN workouts w ON we.workout_id = w.id
             WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
            [userRow.id, `${y}-${monthStr}`],
          );
          value = row?.cnt ?? 0;
        }

        points.push({
          monthLabel: MONTH_LABELS[m - 1],
          year: y,
          month: m,
          value,
        });
      }
      setChartData(points);

      // ── Current month summary ────────────────────────────────────────────
      const curMonthStr = `${year}-${String(month).padStart(2, "0")}`;
      const [wRow, volRow, setsRow, durRows] = await Promise.all([
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
          [userRow.id, curMonthStr],
        ),
        db.getFirstAsync<{ vol: number }>(
          `SELECT SUM(ws.weight * ws.reps) as vol
           FROM workout_sets ws JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
          [userRow.id, curMonthStr],
        ),
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt
           FROM workout_sets ws JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
          [userRow.id, curMonthStr],
        ),
        db.getAllAsync<{ duration: string }>(
          `SELECT duration FROM workouts WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND duration IS NOT NULL`,
          [userRow.id, curMonthStr],
        ),
      ]);

      const parseDur = (rows: { duration: string }[]) =>
        rows.reduce((acc, r) => acc + parseTimerToSeconds(r.duration ?? ""), 0);

      setCurrentSummary({
        workouts: wRow?.cnt ?? 0,
        durationSec: parseDur(durRows),
        volumeKg: Math.round(volRow?.vol ?? 0),
        sets: setsRow?.cnt ?? 0,
      });

      // ── Previous month summary ────────────────────────────────────────────
      const prevDate = new Date(year, month - 2, 1);
      const prevY = prevDate.getFullYear();
      const prevM = prevDate.getMonth() + 1;
      const prevMonthStr = `${prevY}-${String(prevM).padStart(2, "0")}`;

      const [pwRow, pvolRow, psetsRow, pdurRows] = await Promise.all([
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? AND strftime('%Y-%m', date) = ?`,
          [userRow.id, prevMonthStr],
        ),
        db.getFirstAsync<{ vol: number }>(
          `SELECT SUM(ws.weight * ws.reps) as vol
           FROM workout_sets ws JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
          [userRow.id, prevMonthStr],
        ),
        db.getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) as cnt
           FROM workout_sets ws JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE w.user_id = ? AND strftime('%Y-%m', w.date) = ?`,
          [userRow.id, prevMonthStr],
        ),
        db.getAllAsync<{ duration: string }>(
          `SELECT duration FROM workouts WHERE user_id = ? AND strftime('%Y-%m', date) = ? AND duration IS NOT NULL`,
          [userRow.id, prevMonthStr],
        ),
      ]);

      setPrevSummary({
        workouts: pwRow?.cnt ?? 0,
        durationSec: parseDur(pdurRows),
        volumeKg: Math.round(pvolRow?.vol ?? 0),
        sets: psetsRow?.cnt ?? 0,
      });
    } catch (e) {
      console.error("[MonthlyReport] loadData:", e);
    }
  }, [db, year, month, activeMetric]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    const nextIsInFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (nextIsInFuture) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  // ── Metric chart value ────────────────────────────────────────────────────
  const chartValue = (() => {
    const cur = chartData.find((d) => d.month === month && d.year === year);
    return cur?.value ?? 0;
  })();

  const metricValueStr = (() => {
    if (activeMetric === "Workouts") return `${currentSummary.workouts}`;
    if (activeMetric === "Duration")
      return formatDuration(currentSummary.durationSec);
    if (activeMetric === "Volume") return formatVolume(currentSummary.volumeKg);
    return `${currentSummary.sets}`;
  })();

  const metrics: MetricKey[] = ["Workouts", "Duration", "Volume", "Sets"];

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
        <Text className="flex-1 text-center text-white text-lg font-bold">
          Monthly Report
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── MONTH NAVIGATOR ── */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
          <TouchableOpacity onPress={goToPrevMonth} className="p-2">
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-white text-2xl font-black uppercase">
              {MONTH_LABELS[month - 1]} {year}
            </Text>
            {/* Current metric value for selected month */}
            <Text style={{ color: RED }} className="text-3xl font-black mt-1">
              {metricValueStr}
            </Text>
            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-0.5">
              {activeMetric}
            </Text>
          </View>
          <TouchableOpacity
            onPress={goToNextMonth}
            className="p-2"
            style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <ChevronRight size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── BAR CHART ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <BarChart
            data={chartData}
            currentMonth={month}
            currentYear={year}
            metric={activeMetric}
          />
        </View>

        {/* ── METRIC PILLS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            paddingVertical: 12,
          }}
        >
          {metrics.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setActiveMetric(m)}
              style={{
                backgroundColor: activeMetric === m ? RED : "#27272a",
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingVertical: 9,
              }}
            >
              <Text
                style={{
                  color: activeMetric === m ? "#fff" : "#71717a",
                  fontWeight: "800",
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── DIVIDER ── */}
        <View className="h-px bg-zinc-900 mx-4 mb-5" />

        {/* ── SUMMARY SECTION ── */}
        <View className="px-4">
          <Text className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-4">
            Summary
          </Text>

          {/* Row 1: Workouts + Duration */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <SummaryCard
              label="Workouts"
              value={`${currentSummary.workouts}`}
              diff={getDiffLabel(currentSummary.workouts, prevSummary.workouts)}
            />
            <SummaryCard
              label="Duration"
              value={formatDuration(currentSummary.durationSec)}
              diff={getDiffLabelFormatted(
                currentSummary.durationSec,
                prevSummary.durationSec,
                "Duration",
              )}
            />
          </View>

          {/* Row 2: Volume + Sets */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <SummaryCard
              label="Volume"
              value={formatVolume(currentSummary.volumeKg)}
              diff={getDiffLabelFormatted(
                currentSummary.volumeKg,
                prevSummary.volumeKg,
                "Volume",
              )}
            />
            <SummaryCard
              label="Sets"
              value={`${currentSummary.sets}`}
              diff={getDiffLabel(currentSummary.sets, prevSummary.sets)}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
