import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";

import {
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Pencil,
  Settings,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { useUnits } from "../../context/units_context";
import { useWorkout } from "../../context/workoutcontext";

const SCREEN_W = Dimensions.get("window").width;
const RED = "#E31C25";

// ─── tipos ───────
type MetricFilter = "Duration" | "Volume" | "Reps";
type TimeFilter = "3 Months" | "Year" | "All time";

type BarPoint = {
  label: string;
  value: number;
};

function parseTimerToSeconds(s: string): number {
  if (!s) return 0;
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0min";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatMetricValue(
  value: number,
  metric: MetricFilter,
  weightUnit: string,
): string {
  if (metric === "Duration") return formatDuration(value);
  if (metric === "Volume") {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k ${weightUnit}`;
    return `${Math.round(value)} ${weightUnit}`;
  }
  return `${value} reps`;
}

// Gerar intervalos semanais para um número específico de semanas anteriores
function getWeekBuckets(
  weeks: number,
): { label: string; monday: string; sunday: string }[] {
  const buckets = [];
  const now = new Date();
  // Veja a segunda-feira desta semana
  const day = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - ((day + 6) % 7));
  thisMonday.setHours(0, 0, 0, 0);

  for (let i = weeks - 1; i >= 0; i--) {
    const monday = new Date(thisMonday);
    monday.setDate(thisMonday.getDate() - i * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const label = monday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.push({
      label,
      monday: monday.toISOString().slice(0, 10),
      sunday: sunday.toISOString().slice(0, 10),
    });
  }
  return buckets;
}

// ─── GRÁFICO DE BARRAS ─────────
function ProfileBarChart({
  data,
  metric,
  weightUnit,
}: {
  data: BarPoint[];
  metric: MetricFilter;
  weightUnit: string;
}) {
  const W = SCREEN_W - 64;
  const H = 130;
  const PAD_LEFT = 36;
  const PAD_RIGHT = 4;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 24;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <View
        style={{
          height: H,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color: "#3f3f46",
            fontWeight: "bold",
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          No data
        </Text>
      </View>
    );
  }

  const maxV = Math.max(...data.map((d) => d.value), 1);

  // Nice Y max
  const niceMax = (() => {
    if (maxV <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(maxV)));
    const candidates = [1, 2, 2.5, 5, 10].map((s) => s * mag);
    return candidates.find((c) => c >= maxV) ?? maxV;
  })();

  const yLines = [0, niceMax / 2, niceMax];

  const barW = Math.max(6, Math.min(18, (chartW / data.length) * 0.6));
  const gap = chartW / data.length;
  const toX = (i: number) => PAD_LEFT + gap * i + gap / 2;
  const toBarH = (v: number) => Math.max(2, (v / niceMax) * chartH);
  const toBarY = (v: number) => PAD_TOP + chartH - toBarH(v);

  const monthChangeIndices: number[] = [];
  data.forEach((d, i) => {
    if (i === 0) {
      monthChangeIndices.push(i);
      return;
    }
    const prevMonth = data[i - 1].label.split(" ")[0];
    const currMonth = d.label.split(" ")[0];
    if (currMonth !== prevMonth) monthChangeIndices.push(i);
  });

  const showLabel = (i: number) => {
    const pos = monthChangeIndices.indexOf(i);
    if (pos === -1) return false;
    if (data.length <= 52) return true;
    return pos % 3 === 0;
  };

  const getXLabel = (label: string, i: number): string => {
    if (data.length <= 52) return label.split(" ")[0];
    const weeksBack = data.length - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - weeksBack * 7);
    const yr = String(d.getFullYear()).slice(2);
    return `${label.split(" ")[0]}'${yr}`;
  };

  const formatYLabel = (v: number) => {
    if (metric === "Duration") {
      const h = Math.floor(v / 3600);
      const m = Math.floor((v % 3600) / 60);
      if (v === 0) return "0";
      if (h === 0) return `${m}m`;
      return m === 0 ? `${h}h` : `${h}h`;
    }
    if (metric === "Volume") {
      if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
      return `${Math.round(v)}`;
    }
    return `${Math.round(v)}`;
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Svg width={W} height={H}>
        {yLines.map((v, i) => {
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
                fontSize={8}
                fill="#52525b"
                textAnchor="end"
                fontWeight="bold"
              >
                {formatYLabel(v)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Rect
              x={toX(i) - barW / 2}
              y={toBarY(d.value)}
              width={barW}
              height={toBarH(d.value)}
              rx={3}
              fill={d.value > 0 ? RED : "#1f1f1f"}
            />
            {showLabel(i) && (
              <SvgText
                x={toX(i)}
                y={H - 4}
                fontSize={7.5}
                fill="#52525b"
                textAnchor="middle"
                fontWeight="bold"
              >
                {getXLabel(d.label, i)}
              </SvgText>
            )}
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

// ─── ECRÃ PRINCIPAL ───────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const { weightUnit: weightUnitRaw } = useUnits();
  const weightUnit = weightUnitRaw.toLowerCase();
  const { isActive, stopWorkout } = useWorkout();

  const [userData, setUserData] = useState<{
    username: string;
    email: string;
    created_count: string;
    profile_picture?: string;
  } | null>(null);

  const [workoutCount, setWorkoutCount] = useState(0);
  const [activeMetric, setActiveMetric] = useState<MetricFilter>("Duration");
  const [activeTime, setActiveTime] = useState<TimeFilter>("3 Months");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [chartData, setChartData] = useState<BarPoint[]>([]);
  const [summaryValue, setSummaryValue] = useState(0);
  const [showLogoutBlockedModal, setShowLogoutBlockedModal] = useState(false);

  const timeFilters: TimeFilter[] = ["3 Months", "Year", "All time"];

  const loadProfileData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const userRow = await db.getFirstAsync<any>(
        "SELECT username, email, created_count, profile_picture FROM users WHERE email = ?",
        [email],
      );
      if (userRow) {
        setUserData(userRow);
        const countResult = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM workouts WHERE user_id = (SELECT id FROM users WHERE email = ?)",
          [email],
        );
        setWorkoutCount(countResult?.count ?? 0);
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    }
  }, [db]);

  const loadChartData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (!userRow) return;

      // Decida quantas semanas mostrar
      const weeks =
        activeTime === "3 Months" ? 13 : activeTime === "Year" ? 52 : 104;
      const buckets = getWeekBuckets(weeks);

      // ✅ DEPOIS — queries sequenciais
      const points: BarPoint[] = [];

      for (const b of buckets) {
        let value = 0;

        if (activeMetric === "Duration") {
          const rows = await db.getAllAsync<{ duration: string }>(
            `SELECT duration FROM workouts
       WHERE user_id = ? AND date(date) BETWEEN ? AND ? AND duration IS NOT NULL`,
            [userRow.id, b.monday, b.sunday],
          );
          value = rows.reduce(
            (acc, r) => acc + parseTimerToSeconds(r.duration ?? ""),
            0,
          );
        } else if (activeMetric === "Volume") {
          const row = await db.getFirstAsync<{ vol: number }>(
            `SELECT SUM(ws.weight * ws.reps) as vol
       FROM workout_sets ws
       JOIN workout_exercises we ON ws.workout_exercise_id = we.id
       JOIN workouts w ON we.workout_id = w.id
       WHERE w.user_id = ? AND date(w.date) BETWEEN ? AND ?`,
            [userRow.id, b.monday, b.sunday],
          );
          value = Math.round(row?.vol ?? 0);
        } else {
          const row = await db.getFirstAsync<{ cnt: number }>(
            `SELECT SUM(ws.reps) as cnt
       FROM workout_sets ws
       JOIN workout_exercises we ON ws.workout_exercise_id = we.id
       JOIN workouts w ON we.workout_id = w.id
       WHERE w.user_id = ? AND date(w.date) BETWEEN ? AND ?`,
            [userRow.id, b.monday, b.sunday],
          );
          value = row?.cnt ?? 0;
        }

        points.push({ label: b.label, value });
      }

      setChartData(points);
      setSummaryValue(points.reduce((acc, p) => acc + p.value, 0));
    } catch (e) {
      console.error("Error loading chart:", e);
    }
  }, [db, activeMetric, activeTime]);

  useEffect(() => {
    if (isFocused) {
      loadProfileData();
      loadChartData();
    }
  }, [isFocused, loadProfileData, loadChartData]);

  const handleLogout = async () => {
    if (isActive) {
      setShowLogoutBlockedModal(true);
      return;
    }
    await AsyncStorage.removeItem("userEmail");
    router.replace("/auth/login");
  };

  const formatDate = (dateString: string) => {
    const date = dateString ? new Date(dateString) : new Date();
    if (isNaN(date.getTime())) return "Apr 2026";
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const FilterButton = ({ label }: { label: MetricFilter }) => {
    const isActive = activeMetric === label;
    return (
      <TouchableOpacity
        onPress={() => setActiveMetric(label)}
        className={`px-5 py-2 rounded-full mr-2 border ${
          isActive
            ? "bg-[#E31C25] border-[#E31C25]"
            : "bg-zinc-900 border-zinc-800"
        }`}
      >
        <Text
          className={`font-black text-[10px] uppercase ${isActive ? "text-white" : "text-zinc-500"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const ActionButton = ({
    label,
    onPress,
  }: {
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center justify-between bg-zinc-900/50 w-full py-5 px-8 rounded-3xl mb-3 border border-zinc-800"
    >
      <Text className="text-white font-black text-lg uppercase tracking-tighter">
        {label}
      </Text>
      <ChevronRight size={20} color="#E31C25" strokeWidth={3} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <Text className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">
            Athlete Profile
          </Text>
          <View className="flex-row items-center gap-x-3">
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800"
            >
              <Text className="text-[#E31C25] font-black text-[10px] uppercase">
                Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/editprofile")}
              className="bg-zinc-900/80 w-10 h-10 rounded-xl items-center justify-center border border-zinc-800"
            >
              <Pencil size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: { email: userData?.email },
                })
              }
              className="bg-zinc-900/80 w-10 h-10 rounded-xl items-center justify-center border border-zinc-800"
            >
              <Settings size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* INFORMAÇÃO PERFIL */}
        <View className="px-6 mt-6 flex-row items-center">
          <View className="w-[105px] h-[105px] rounded-full border-[3px] border-[#E31C25] items-center justify-center">
            <View className="w-[92px] h-[92px] rounded-full border-2 border-black overflow-hidden bg-zinc-900">
              <Image
                source={{
                  uri:
                    userData?.profile_picture ||
                    "https://i.pinimg.com/736x/56/01/35/5601357bcf2b7fd819ce64424351a19d.jpg",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          <View className="flex-1 ml-6">
            <View className="mb-3">
              <Text className="text-white text-4xl font-black leading-[34px] tracking-tighter">
                {userData?.username?.split(" ")[0] || "User"}
              </Text>
              <Text className="text-[#E31C25] text-2xl font-black tracking-tighter opacity-90 mt-[-2px]">
                {userData?.username?.split(" ").slice(1).join(" ") || ""}
              </Text>
            </View>
            <View className="flex-row gap-x-5 border-t border-zinc-900 pt-3">
              <View>
                <Text className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">
                  Joined
                </Text>
                <Text className="text-zinc-100 font-bold text-xs uppercase">
                  {formatDate(userData?.created_count || "")}
                </Text>
              </View>
              <View>
                <Text className="text-zinc-600 text-[9px] uppercase font-black tracking-widest">
                  Workouts
                </Text>
                <Text className="text-zinc-100 font-bold text-xs uppercase">
                  {workoutCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FICHA DE GRÁFICO */}
        <View className="bg-zinc-900/30 mx-4 p-5 rounded-[35px] mt-10 border border-zinc-800/60 shadow-2xl">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-white font-black text-2xl tracking-tighter uppercase">
                {summaryValue > 0
                  ? formatMetricValue(summaryValue, activeMetric, weightUnit)
                  : "No Data"}
              </Text>
              <Text className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                {activeMetric === "Duration"
                  ? "this period"
                  : activeMetric === "Volume"
                    ? "total volume"
                    : "total reps"}
              </Text>
            </View>

            {/* botão de filtro de tempo */}
            <TouchableOpacity
              onPress={() => setShowTimeModal(true)}
              className="flex-row items-center gap-1 bg-zinc-800/50 px-4 py-1.5 rounded-full border border-zinc-700/50"
            >
              <Text className="text-zinc-300 text-[10px] font-bold uppercase">
                {activeTime}
              </Text>
              <ChevronDown size={12} color="#E31C25" strokeWidth={4} />
            </TouchableOpacity>
          </View>

          <ProfileBarChart
            data={chartData}
            metric={activeMetric}
            weightUnit={weightUnit}
          />

          <View className="flex-row mt-6 justify-center">
            <FilterButton label="Duration" />
            <FilterButton label="Volume" />
            <FilterButton label="Reps" />
          </View>
        </View>

        {/* PRINCIPAIS AÇÕES */}
        <View className="px-6 mt-10 mb-20">
          <ActionButton
            label="Statistics"
            onPress={() => router.push("/statistics")}
          />
          <ActionButton
            label="Body Measures"
            onPress={() => router.push("/body_measures")}
          />
          <ActionButton
            label="Workout History"
            onPress={() => router.push("/workouthistory")}
          />
        </View>
      </ScrollView>

      {/* MODAL DE FILTRO DE TEMPO */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setShowTimeModal(false)}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#18181b",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: 40,
            paddingTop: 8,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#3f3f46",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          {timeFilters.map((tf) => (
            <TouchableOpacity
              key={tf}
              onPress={() => {
                setActiveTime(tf);
                setShowTimeModal(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 24,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: "#27272a",
              }}
            >
              <Text
                style={{
                  color: activeTime === tf ? RED : "#fff",
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                {tf}
              </Text>
              {activeTime === tf && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: RED,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      {/* MODAL LOGOUT BLOQUEADO */}
      <Modal
        visible={showLogoutBlockedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutBlockedModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              borderRadius: 32,
              padding: 32,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#27272a",
            }}
          >
            {/* Ícone */}
            <View
              style={{
                backgroundColor: "rgba(227,28,37,0.12)",
                padding: 20,
                borderRadius: 999,
                marginBottom: 24,
              }}
            >
              <Dumbbell color="#E31C25" size={36} />
            </View>

            {/* Título */}
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: -0.5,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Workout in Progress
            </Text>

            {/* Descrição */}
            <Text
              style={{
                color: "#71717a",
                fontSize: 13,
                fontWeight: "700",
                textTransform: "uppercase",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 32,
              }}
            >
              You must finish or discard your current workout before logging
              out.
            </Text>

            {/* Botões */}
            <View style={{ flexDirection: "row", width: "100%", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowLogoutBlockedModal(false);
                  stopWorkout(true);
                  AsyncStorage.removeItem("userEmail");
                  router.replace("/auth/login");
                }}
                style={{
                  width: "48%",
                  backgroundColor: "#27272a",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#3f3f46",
                }}
              >
                <Text
                  style={{
                    color: "#ef4444",
                    fontWeight: "900",
                    fontSize: 12,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Discard{"\n"}Workout
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowLogoutBlockedModal(false);
                  router.push("/workout/log_workout");
                }}
                style={{
                  width: "48%",
                  backgroundColor: "#E31C25",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 12,
                    textTransform: "uppercase",
                    textAlign: "center",
                  }}
                >
                  Go to{"\n"}Workout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
