import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  Target,
  Trash2,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { useUnits } from "../context/units_context";

// ─── GIF MAP ────────────────────────────────────────────────────────────────
const GIF_MAP: { [key: string]: any } = {
  "assets/exercises_gifs/back_extension.gif": require("../../../assets/exercises_gifs/back_extension.gif"),
  "assets/exercises_gifs/back_extension_machine.gif": require("../../../assets/exercises_gifs/back_extension_machine.gif"),
  "assets/exercises_gifs/back_extension_weighted_hyperextension.gif": require("../../../assets/exercises_gifs/back_extension_weighted_hyperextension.gif"),
  "assets/exercises_gifs/barbell_row.gif": require("../../../assets/exercises_gifs/barbell_row.gif"),
  "assets/exercises_gifs/barbell_shrug.gif": require("../../../assets/exercises_gifs/barbell_shrug.gif"),
  "assets/exercises_gifs/behind_back_wrist_curl_barbell.gif": require("../../../assets/exercises_gifs/behind_back_wrist_curl_barbell.gif"),
  "assets/exercises_gifs/bench_press_barbell.gif": require("../../../assets/exercises_gifs/bench_press_barbell.gif"),
  "assets/exercises_gifs/bench_press_cable.gif": require("../../../assets/exercises_gifs/bench_press_cable.gif"),
  "assets/exercises_gifs/bench_press_dumbbell.gif": require("../../../assets/exercises_gifs/bench_press_dumbbell.gif"),
  "assets/exercises_gifs/bench_press_smith_machine.gif": require("../../../assets/exercises_gifs/bench_press_smith_machine.gif"),
  "assets/exercises_gifs/bicep_curl_barbell.gif": require("../../../assets/exercises_gifs/bicep_curl_barbell.gif"),
  "assets/exercises_gifs/bicep_curl_cable.gif": require("../../../assets/exercises_gifs/bicep_curl_cable.gif"),
  "assets/exercises_gifs/bicep_curl_dumbbell.gif": require("../../../assets/exercises_gifs/bicep_curl_dumbbell.gif"),
  "assets/exercises_gifs/bicep_curl_machine.gif": require("../../../assets/exercises_gifs/bicep_curl_machine.gif"),
  "assets/exercises_gifs/bulgarian_split_squat.gif": require("../../../assets/exercises_gifs/bulgarian_split_squat.gif"),
  "assets/exercises_gifs/butterfly_pec_deck.gif": require("../../../assets/exercises_gifs/butterfly_pec_deck.gif"),
  "assets/exercises_gifs/cable_crunch.gif": require("../../../assets/exercises_gifs/cable_crunch.gif"),
  "assets/exercises_gifs/cable_fly_crossovers.gif": require("../../../assets/exercises_gifs/cable_fly_crossovers.gif"),
  "assets/exercises_gifs/calf_extension_machine.gif": require("../../../assets/exercises_gifs/calf_extension_machine.gif"),
  "assets/exercises_gifs/calf_press_machine.gif": require("../../../assets/exercises_gifs/calf_press_machine.gif"),
  "assets/exercises_gifs/chest_dip_weighted.gif": require("../../../assets/exercises_gifs/chest_dip_weighted.gif"),
  "assets/exercises_gifs/chest_fly_dumbbell.gif": require("../../../assets/exercises_gifs/chest_fly_dumbbell.gif"),
  "assets/exercises_gifs/chest_fly_machine.gif": require("../../../assets/exercises_gifs/chest_fly_machine.gif"),
  "assets/exercises_gifs/chest_press_machine.gif": require("../../../assets/exercises_gifs/chest_press_machine.gif"),
  "assets/exercises_gifs/chin_up.gif": require("../../../assets/exercises_gifs/chin_up.gif"),
  "assets/exercises_gifs/concentration_curl.gif": require("../../../assets/exercises_gifs/concentration_curl.gif"),
  "assets/exercises_gifs/crunch_machine.gif": require("../../../assets/exercises_gifs/crunch_machine.gif"),
  "assets/exercises_gifs/crunch_weighted.gif": require("../../../assets/exercises_gifs/crunch_weighted.gif"),
  "assets/exercises_gifs/deadlift_barbell.gif": require("../../../assets/exercises_gifs/deadlift_barbell.gif"),
  "assets/exercises_gifs/deadlift_dumbbell.gif": require("../../../assets/exercises_gifs/deadlift_dumbbell.gif"),
  "assets/exercises_gifs/deadlift_smith_machine.gif": require("../../../assets/exercises_gifs/deadlift_smith_machine.gif"),
  "assets/exercises_gifs/decline_bench_press_barbell.gif": require("../../../assets/exercises_gifs/decline_bench_press_barbell.gif"),
  "assets/exercises_gifs/decline_bench_press_dumbbell.gif": require("../../../assets/exercises_gifs/decline_bench_press_dumbbell.gif"),
  "assets/exercises_gifs/decline_bench_press_machine.gif": require("../../../assets/exercises_gifs/decline_bench_press_machine.gif"),
  "assets/exercises_gifs/decline_bench_press_smith_machine.gif": require("../../../assets/exercises_gifs/decline_bench_press_smith_machine.gif"),
  "assets/exercises_gifs/decline_chest_fly_dumbbell.gif": require("../../../assets/exercises_gifs/decline_chest_fly_dumbbell.gif"),
  "assets/exercises_gifs/decline_crunch_weighted.gif": require("../../../assets/exercises_gifs/decline_crunch_weighted.gif"),
  "assets/exercises_gifs/dumbbell_row.gif": require("../../../assets/exercises_gifs/dumbbell_row.gif"),
  "assets/exercises_gifs/dumbbell_shrug.gif": require("../../../assets/exercises_gifs/dumbbell_shrug.gif"),
  "assets/exercises_gifs/elliptical_trainer.gif": require("../../../assets/exercises_gifs/elliptical_trainer.gif"),
  "assets/exercises_gifs/ez_bar_biceps_curl.gif": require("../../../assets/exercises_gifs/ez_bar_biceps_curl.gif"),
  "assets/exercises_gifs/full_squat.gif": require("../../../assets/exercises_gifs/full_squat.gif"),
  "assets/exercises_gifs/glute_kickback_machine.gif": require("../../../assets/exercises_gifs/glute_kickback_machine.gif"),
  "assets/exercises_gifs/hack_squat_machine.gif": require("../../../assets/exercises_gifs/hack_squat_machine.gif"),
  "assets/exercises_gifs/hammer_curl_cable.gif": require("../../../assets/exercises_gifs/hammer_curl_cable.gif"),
  "assets/exercises_gifs/hammer_curl_dumbbell.gif": require("../../../assets/exercises_gifs/hammer_curl_dumbbell.gif"),
  "assets/exercises_gifs/hanging_leg_raise.gif": require("../../../assets/exercises_gifs/hanging_leg_raise.gif"),
  "assets/exercises_gifs/hip_abduction_machine.gif": require("../../../assets/exercises_gifs/hip_abduction_machine.gif"),
  "assets/exercises_gifs/hip_adduction_machine.gif": require("../../../assets/exercises_gifs/hip_adduction_machine.gif"),
  "assets/exercises_gifs/hip_thrust_barbell.gif": require("../../../assets/exercises_gifs/hip_thrust_barbell.gif"),
  "assets/exercises_gifs/hip_thrust_machine.gif": require("../../../assets/exercises_gifs/hip_thrust_machine.gif"),
  "assets/exercises_gifs/incline_bench_press_barbell.gif": require("../../../assets/exercises_gifs/incline_bench_press_barbell.gif"),
  "assets/exercises_gifs/incline_bench_press_dumbbell.gif": require("../../../assets/exercises_gifs/incline_bench_press_dumbbell.gif"),
  "assets/exercises_gifs/incline_bench_press_smith_machine.gif": require("../../../assets/exercises_gifs/incline_bench_press_smith_machine.gif"),
  "assets/exercises_gifs/incline_chest_fly_dumbbell.gif": require("../../../assets/exercises_gifs/incline_chest_fly_dumbbell.gif"),
  "assets/exercises_gifs/iso_lateral_chest_press_machine.gif": require("../../../assets/exercises_gifs/iso_lateral_chest_press_machine.gif"),
  "assets/exercises_gifs/iso_lateral_high_row_machine.gif": require("../../../assets/exercises_gifs/iso_lateral_high_row_machine.gif"),
  "assets/exercises_gifs/iso_lateral_row_machine.gif": require("../../../assets/exercises_gifs/iso_lateral_row_machine.gif"),
  "assets/exercises_gifs/lat_pulldown_cable.gif": require("../../../assets/exercises_gifs/lat_pulldown_cable.gif"),
  "assets/exercises_gifs/lat_pulldown_close_grip_cable.gif": require("../../../assets/exercises_gifs/lat_pulldown_close_grip_cable.gif"),
  "assets/exercises_gifs/lat_pulldown_machine.gif": require("../../../assets/exercises_gifs/lat_pulldown_machine.gif"),
  "assets/exercises_gifs/lateral_raise_cable.gif": require("../../../assets/exercises_gifs/lateral_raise_cable.gif"),
  "assets/exercises_gifs/lateral_raise_dumbbell.gif": require("../../../assets/exercises_gifs/lateral_raise_dumbbell.gif"),
  "assets/exercises_gifs/lateral_raise_machine.gif": require("../../../assets/exercises_gifs/lateral_raise_machine.gif"),
  "assets/exercises_gifs/leg_extension_machine.gif": require("../../../assets/exercises_gifs/leg_extension_machine.gif"),
  "assets/exercises_gifs/leg_press_horizontal_machine.gif": require("../../../assets/exercises_gifs/leg_press_horizontal_machine.gif"),
  "assets/exercises_gifs/leg_press_machine.gif": require("../../../assets/exercises_gifs/leg_press_machine.gif"),
  "assets/exercises_gifs/leg_raise_parallel_bars.gif": require("../../../assets/exercises_gifs/leg_raise_parallel_bars.gif"),
  "assets/exercises_gifs/low_cable_fly_crossovers.gif": require("../../../assets/exercises_gifs/low_cable_fly_crossovers.gif"),
  "assets/exercises_gifs/lying_leg_curl_machine.gif": require("../../../assets/exercises_gifs/lying_leg_curl_machine.gif"),
  "assets/exercises_gifs/lying_leg_raise.gif": require("../../../assets/exercises_gifs/lying_leg_raise.gif"),
  "assets/exercises_gifs/overhead_press_barbell.gif": require("../../../assets/exercises_gifs/overhead_press_barbell.gif"),
  "assets/exercises_gifs/overhead_press_dumbbell.gif": require("../../../assets/exercises_gifs/overhead_press_dumbbell.gif"),
  "assets/exercises_gifs/overhead_press_smith_machine.gif": require("../../../assets/exercises_gifs/overhead_press_smith_machine.gif"),
  "assets/exercises_gifs/overhead_triceps_extension_cable.gif": require("../../../assets/exercises_gifs/overhead_triceps_extension_cable.gif"),
  "assets/exercises_gifs/plank.gif": require("../../../assets/exercises_gifs/plank.gif"),
  "assets/exercises_gifs/preacher_curl_barbell.gif": require("../../../assets/exercises_gifs/preacher_curl_barbell.gif"),
  "assets/exercises_gifs/preacher_curl_dumbbell.gif": require("../../../assets/exercises_gifs/preacher_curl_dumbbell.gif"),
  "assets/exercises_gifs/preacher_curl_machine.gif": require("../../../assets/exercises_gifs/preacher_curl_machine.gif"),
  "assets/exercises_gifs/pullover_dumbbell.gif": require("../../../assets/exercises_gifs/pullover_dumbbell.gif"),
  "assets/exercises_gifs/pullover_machine.gif": require("../../../assets/exercises_gifs/pullover_machine.gif"),
  "assets/exercises_gifs/rear_delt_reverse_fly_cable.gif": require("../../../assets/exercises_gifs/rear_delt_reverse_fly_cable.gif"),
  "assets/exercises_gifs/rear_delt_reverse_fly_machine.gif": require("../../../assets/exercises_gifs/rear_delt_reverse_fly_machine.gif"),
  "assets/exercises_gifs/rear_kick_machine.gif": require("../../../assets/exercises_gifs/rear_kick_machine.gif"),
  "assets/exercises_gifs/reverse_fly_single_arm_cable.gif": require("../../../assets/exercises_gifs/reverse_fly_single_arm_cable.gif"),
  "assets/exercises_gifs/reverse_grip_lat_pulldown_cable.gif": require("../../../assets/exercises_gifs/reverse_grip_lat_pulldown_cable.gif"),
  "assets/exercises_gifs/romanian_deadlift_barbell.gif": require("../../../assets/exercises_gifs/romanian_deadlift_barbell.gif"),
  "assets/exercises_gifs/romanian_deadlift_dumbbell.gif": require("../../../assets/exercises_gifs/romanian_deadlift_dumbbell.gif"),
  "assets/exercises_gifs/rope_straight_arm_pulldown.gif": require("../../../assets/exercises_gifs/rope_straight_arm_pulldown.gif"),
  "assets/exercises_gifs/rowing_machine.gif": require("../../../assets/exercises_gifs/rowing_machine.gif"),
  "assets/exercises_gifs/seated_cable_row_bar_wide_grip.gif": require("../../../assets/exercises_gifs/seated_cable_row_bar_wide_grip.gif"),
  "assets/exercises_gifs/seated_cable_row_v_grip.gif": require("../../../assets/exercises_gifs/seated_cable_row_v_grip.gif"),
  "assets/exercises_gifs/seated_calf_raise.gif": require("../../../assets/exercises_gifs/seated_calf_raise.gif"),
  "assets/exercises_gifs/seated_chest_flys_cable.gif": require("../../../assets/exercises_gifs/seated_chest_flys_cable.gif"),
  "assets/exercises_gifs/seated_dip_machine.gif": require("../../../assets/exercises_gifs/seated_dip_machine.gif"),
  "assets/exercises_gifs/seated_leg_curl_machine.gif": require("../../../assets/exercises_gifs/seated_leg_curl_machine.gif"),
  "assets/exercises_gifs/seated_palms_up_wrist_curl.gif": require("../../../assets/exercises_gifs/seated_palms_up_wrist_curl.gif"),
  "assets/exercises_gifs/seated_wrist_extension_barbell.gif": require("../../../assets/exercises_gifs/seated_wrist_extension_barbell.gif"),
  "assets/exercises_gifs/shoulder_press_dumbbell.gif": require("../../../assets/exercises_gifs/shoulder_press_dumbbell.gif"),
  "assets/exercises_gifs/shrug_barbell.gif": require("../../../assets/exercises_gifs/shrug_barbell.gif"),
  "assets/exercises_gifs/shrug_cable.gif": require("../../../assets/exercises_gifs/shrug_cable.gif"),
  "assets/exercises_gifs/shrug_dumbbell.gif": require("../../../assets/exercises_gifs/shrug_dumbbell.gif"),
  "assets/exercises_gifs/side_plank.gif": require("../../../assets/exercises_gifs/side_plank.gif"),
  "assets/exercises_gifs/single_arm_cable_crossover.gif": require("../../../assets/exercises_gifs/single_arm_cable_crossover.gif"),
  "assets/exercises_gifs/single_arm_triceps_pushdown_cable.gif": require("../../../assets/exercises_gifs/single_arm_triceps_pushdown_cable.gif"),
  "assets/exercises_gifs/single_leg_hip_thrust_dumbbell.gif": require("../../../assets/exercises_gifs/single_leg_hip_thrust_dumbbell.gif"),
  "assets/exercises_gifs/single_leg_standing_calf_raise_machine.gif": require("../../../assets/exercises_gifs/single_leg_standing_calf_raise_machine.gif"),
  "assets/exercises_gifs/skullcrusher_barbell.gif": require("../../../assets/exercises_gifs/skullcrusher_barbell.gif"),
  "assets/exercises_gifs/stair_machine_steps.gif": require("../../../assets/exercises_gifs/stair_machine_steps.gif"),
  "assets/exercises_gifs/standing_cable_glute_kickbacks.gif": require("../../../assets/exercises_gifs/standing_cable_glute_kickbacks.gif"),
  "assets/exercises_gifs/standing_calf_raise_machine.gif": require("../../../assets/exercises_gifs/standing_calf_raise_machine.gif"),
  "assets/exercises_gifs/standing_calf_raise_smith.gif": require("../../../assets/exercises_gifs/standing_calf_raise_smith.gif"),
  "assets/exercises_gifs/standing_leg_curls.gif": require("../../../assets/exercises_gifs/standing_leg_curls.gif"),
  "assets/exercises_gifs/straight_arm_lat_pulldown_cable.gif": require("../../../assets/exercises_gifs/straight_arm_lat_pulldown_cable.gif"),
  "assets/exercises_gifs/straight_leg_deadlift.gif": require("../../../assets/exercises_gifs/straight_leg_deadlift.gif"),
  "assets/exercises_gifs/sumo_deadlift.gif": require("../../../assets/exercises_gifs/sumo_deadlift.gif"),
  "assets/exercises_gifs/treadmill.gif": require("../../../assets/exercises_gifs/treadmill.gif"),
  "assets/exercises_gifs/triceps_pushdown.gif": require("../../../assets/exercises_gifs/triceps_pushdown.gif"),
  "assets/exercises_gifs/triceps_rope_pushdown.gif": require("../../../assets/exercises_gifs/triceps_rope_pushdown.gif"),
  "assets/exercises_gifs/upright_row_cable.gif": require("../../../assets/exercises_gifs/upright_row_cable.gif"),
  "assets/exercises_gifs/wrist_roller.gif": require("../../../assets/exercises_gifs/wrist_roller.gif"),
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
type ExerciseDetails = {
  id: number;
  name: string;
  muscle_group: string;
  image: string | null;
  gif: string | null;
  instructions: string | null;
  is_custom: number;
};

type RawSet = {
  weight: number;
  reps: number;
  date: string; // from workouts.date
};

type ChartPoint = { date: string; value: number };

type MetricKey =
  | "Heaviest Weight"
  | "One Rep Max"
  | "Best Set Volume"
  | "Session Volume"
  | "Total Reps";

type TimeFilter = "Last 3 months" | "Year" | "All time";

type PersonalRecords = {
  heaviestWeight: number;
  best1RM: number;
  bestSetVolume: { weight: number; reps: number };
  bestSessionVolume: number;
  setRecords: { reps: number; weight: number }[];
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function filterByTime(sets: RawSet[], filter: TimeFilter): RawSet[] {
  const now = new Date();
  return sets.filter((s) => {
    const d = new Date(s.date);
    if (filter === "Last 3 months") {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      return d >= cutoff;
    }
    if (filter === "Year") {
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return d >= cutoff;
    }
    return true;
  });
}

function buildChartPoints(sets: RawSet[], metric: MetricKey): ChartPoint[] {
  // Group by date
  const grouped: { [date: string]: RawSet[] } = {};
  for (const s of sets) {
    const key = s.date.slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  return Object.entries(grouped)
    .map(([date, rows]) => {
      let value = 0;
      if (metric === "Heaviest Weight") {
        value = Math.max(...rows.map((r) => r.weight));
      } else if (metric === "One Rep Max") {
        value = Math.max(...rows.map((r) => epley1RM(r.weight, r.reps)));
      } else if (metric === "Best Set Volume") {
        value = Math.max(...rows.map((r) => r.weight * r.reps));
      } else if (metric === "Session Volume") {
        value = rows.reduce((acc, r) => acc + r.weight * r.reps, 0);
      } else if (metric === "Total Reps") {
        value = rows.reduce((acc, r) => acc + r.reps, 0);
      }
      return { date, value: Math.round(value * 10) / 10 };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calcPersonalRecords(
  sets: RawSet[],
  weightUnit: string,
): PersonalRecords {
  if (sets.length === 0) {
    return {
      heaviestWeight: 0,
      best1RM: 0,
      bestSetVolume: { weight: 0, reps: 0 },
      bestSessionVolume: 0,
      setRecords: [],
    };
  }

  const heaviestWeight = Math.max(...sets.map((s) => s.weight));
  const best1RM = Math.max(...sets.map((s) => epley1RM(s.weight, s.reps)));

  let bestSetVolume = { weight: 0, reps: 0 };
  let bestVol = 0;
  for (const s of sets) {
    const v = s.weight * s.reps;
    if (v > bestVol) {
      bestVol = v;
      bestSetVolume = { weight: s.weight, reps: s.reps };
    }
  }

  // Session volume grouped by date
  const grouped: { [date: string]: number } = {};
  for (const s of sets) {
    const key = s.date.slice(0, 10);
    grouped[key] = (grouped[key] || 0) + s.weight * s.reps;
  }
  const bestSessionVolume = Math.max(...Object.values(grouped));

  // Set records per rep count
  const repMap: { [reps: number]: number } = {};
  for (const s of sets) {
    if (!repMap[s.reps] || s.weight > repMap[s.reps]) {
      repMap[s.reps] = s.weight;
    }
  }
  const setRecords = Object.entries(repMap)
    .map(([reps, weight]) => ({ reps: Number(reps), weight }))
    .sort((a, b) => a.reps - b.reps);

  return {
    heaviestWeight,
    best1RM,
    bestSetVolume,
    bestSessionVolume,
    setRecords,
  };
}

// ─── SPARKLINE CHART ────────────────────────────────────────────────────────
function formatYLabel(
  v: number,
  metric: MetricKey,
  weightUnit: string,
): string {
  if (metric === "Total Reps") return `${Math.round(v)}`;
  // Show integer if no fractional part, otherwise 1 decimal
  const rounded = Math.round(v * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function niceYLabels(minV: number, maxV: number): number[] {
  if (minV === maxV) {
    // Only one unique value — show it centered with ±1 padding
    return [maxV + 1, maxV, minV - 1];
  }
  const range = maxV - minV;
  // Pick a step that gives clean round numbers
  const rawStep = range / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 2.5, 5, 10].map((s) => s * magnitude);
  const step = niceSteps.find((s) => s >= rawStep) ?? rawStep;

  const niceMin = Math.floor(minV / step) * step;
  const niceMax = Math.ceil(maxV / step) * step;

  const labels: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 0.01; v += step) {
    labels.push(Math.round(v * 100) / 100);
  }
  // Return 3 evenly spaced: top, mid, bottom
  if (labels.length >= 3) {
    const last = labels.length - 1;
    const mid = Math.round(last / 2);
    return [labels[last], labels[mid], labels[0]];
  }
  return labels.reverse().slice(0, 3);
}

function SparkChart({
  points,
  metric,
  weightUnit,
}: {
  points: ChartPoint[];
  metric: MetricKey;
  weightUnit: string;
}) {
  const W = Dimensions.get("window").width - 48;
  const H = 180;
  const PAD_LEFT = 46;
  const PAD_RIGHT = 16;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 40;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  if (points.length === 0) {
    return (
      <View
        style={{ height: H, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ color: "#52525b", fontWeight: "bold", fontSize: 12 }}>
          No data yet
        </Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  // Add vertical padding so line never touches top/bottom edge
  const padding = rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.15;
  const minV = rawMin - padding;
  const maxV = rawMax + padding;
  const rangeV = maxV - minV;

  const toX = (i: number) =>
    PAD_LEFT + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (v: number) => PAD_TOP + chartH - ((v - minV) / rangeV) * chartH;

  // Polyline
  const polyPoints = points
    .map((p, i) => `${toX(i)},${toY(p.value)}`)
    .join(" ");

  // Area fill path
  const firstX = toX(0);
  const lastX = toX(points.length - 1);
  const baseY = PAD_TOP + chartH;
  const areaPath =
    `M${firstX},${baseY} ` +
    points.map((p, i) => `L${toX(i)},${toY(p.value)}`).join(" ") +
    ` L${lastX},${baseY} Z`;

  // Y axis: nice round labels based on actual data range
  const yLabelValues = niceYLabels(rawMin, rawMax);
  const yLabels = yLabelValues.map((v) => ({
    text: formatYLabel(v, metric, weightUnit),
    y: toY(v),
  }));

  // X axis: show up to 4 dates, always first + last
  const formatDate = (dateStr: string) => {
    // Handle both "YYYY-MM-DD" and ISO strings
    const parts = dateStr.slice(0, 10).split("-");
    const d = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2]),
    );
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  let xIndices: number[];
  if (points.length === 1) {
    xIndices = [0];
  } else if (points.length === 2) {
    xIndices = [0, 1];
  } else if (points.length <= 5) {
    xIndices = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  } else {
    // 4 labels: first, 1/3, 2/3, last
    xIndices = [
      0,
      Math.round((points.length - 1) / 3),
      Math.round(((points.length - 1) * 2) / 3),
      points.length - 1,
    ];
  }

  // Unit suffix for Y axis
  const unitSuffix = metric === "Total Reps" ? " rep" : ` ${weightUnit}`;

  return (
    <Svg width={W} height={H}>
      {/* Y grid lines + labels */}
      {yLabels.map((yl, i) => (
        <React.Fragment key={i}>
          <Line
            x1={PAD_LEFT}
            y1={yl.y}
            x2={W - PAD_RIGHT}
            y2={yl.y}
            stroke="#27272a"
            strokeWidth={1}
            strokeDasharray="4,3"
          />
          <SvgText
            x={PAD_LEFT - 5}
            y={yl.y + 4}
            fontSize={10}
            fill="#71717a"
            textAnchor="end"
            fontWeight="bold"
          >
            {yl.text}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Area fill */}
      <Path d={areaPath} fill="#E31C25" fillOpacity={0.1} />

      {/* Line */}
      <Polyline
        points={polyPoints}
        fill="none"
        stroke="#E31C25"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots on each data point */}
      {points.map((p, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(p.value)} r={3.5} fill="#E31C25" />
      ))}

      {/* X axis date labels */}
      {xIndices.map((idx) => (
        <SvgText
          key={idx}
          x={toX(idx)}
          y={PAD_TOP + chartH + 20}
          fontSize={10}
          fill="#71717a"
          textAnchor={
            idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle"
          }
          fontWeight="bold"
        >
          {formatDate(points[idx].date)}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from: string }>();
  const db = useSQLiteContext();
  const { weightUnit: weightUnitRaw } = useUnits();
  const weightUnit = weightUnitRaw.toLowerCase();
  const isFocused = useIsFocused();

  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [allSets, setAllSets] = useState<RawSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  // Summary tab state
  const [activeMetric, setActiveMetric] =
    useState<MetricKey>("Heaviest Weight");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last 3 months");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showPR, setShowPR] = useState(false);

  const metrics: MetricKey[] = [
    "Heaviest Weight",
    "One Rep Max",
    "Best Set Volume",
    "Session Volume",
    "Total Reps",
  ];

  const timeFilters: TimeFilter[] = ["Last 3 months", "Year", "All time"];

  // ── Load data ──
  useEffect(() => {
    async function loadData() {
      try {
        const result = await db.getFirstAsync<ExerciseDetails>(
          "SELECT * FROM exercises WHERE id = ?",
          [id as string],
        );
        if (result) {
          setExercise(result);
          setActiveTab(result.is_custom === 1 ? "History" : "Summary");
        }

        // Fetch sets with real workout date via joins
        const rows = await db.getAllAsync<RawSet>(
          `SELECT 
             ws.weight, 
             ws.reps, 
             w.date
           FROM workout_sets ws
           JOIN workout_exercises we ON ws.workout_exercise_id = we.id
           JOIN workouts w ON we.workout_id = w.id
           WHERE ws.exercise_id = ?
             AND ws.weight > 0
             AND ws.reps > 0
           ORDER BY w.date ASC`,
          [id as string],
        );
        setAllSets(rows);
      } catch (e) {
        console.error("loadData error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, db, isFocused]);

  // ── Derived data ──
  const filteredSets = useMemo(
    () => filterByTime(allSets, timeFilter),
    [allSets, timeFilter],
  );

  const chartPoints = useMemo(
    () => buildChartPoints(filteredSets, activeMetric),
    [filteredSets, activeMetric],
  );

  const personalRecords = useMemo(
    () => calcPersonalRecords(allSets, weightUnit),
    [allSets, weightUnit],
  );

  // Latest value for the metric header
  const latestPoint = chartPoints[chartPoints.length - 1] ?? null;
  const latestValue = latestPoint?.value ?? null;
  const latestDate = latestPoint?.date ?? null;

  const formatMetricValue = (v: number | null) => {
    if (v === null) return "—";
    if (activeMetric === "Total Reps") return `${v} reps`;
    return `${v} ${weightUnit}`;
  };

  // ── Handlers ──
  const handleBack = () => {
    if (from === "workout") {
      router.replace("/(tabs)/workout/log_workout" as any);
    } else if (from === "new_routine") {
      router.replace("/(tabs)/workout/new_routine" as any);
    } else {
      router.replace("/(tabs)/workout/explore_exercises" as any);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await db.runAsync("DELETE FROM exercises WHERE id = ?", [
              id as string,
            ]);
            router.replace("/workout/explore_exercises");
          } catch {
            Alert.alert("Error", "It could not be deleted.");
          }
        },
      },
    ]);
  };

  // ── Loading / not found ──
  if (loading)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );

  if (!exercise)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Exercise not found.</Text>
      </View>
    );

  const tabs =
    exercise.is_custom === 1
      ? ["History", "How to"]
      : ["Summary", "History", "How to"];

  const gifSource = exercise.gif ? (GIF_MAP[exercise.gif] ?? null) : null;

  // ── Render ──
  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="text-white text-lg font-black flex-1 text-center px-4 uppercase italic"
        >
          {exercise.name}
        </Text>
        {exercise.is_custom === 1 ? (
          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Trash2 color="#ef4444" size={22} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {/* TABS */}
      <View className="flex-row border-b border-zinc-900">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center ${activeTab === tab ? "border-b-2 border-[#E31C25]" : ""}`}
          >
            <Text
              className={`font-black uppercase text-[10px] tracking-widest ${activeTab === tab ? "text-[#E31C25]" : "text-zinc-600"}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ══════════════ SUMMARY TAB ══════════════ */}
        {activeTab === "Summary" && (
          <View>
            {/* GIF */}
            <View className="mx-5 mt-5 h-56 bg-white rounded-[32px] overflow-hidden items-center justify-center border-4 border-zinc-900">
              {gifSource ? (
                <Image
                  source={gifSource}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              ) : (
                <View className="items-center justify-center gap-2">
                  <Target size={40} color="#d4d4d8" />
                  <Text className="text-zinc-400 font-bold uppercase text-xs">
                    No preview
                  </Text>
                </View>
              )}
            </View>

            {/* Muscle tag */}
            <View className="mx-5 mt-3 bg-zinc-900/60 px-5 py-3 rounded-2xl border border-zinc-800 flex-row items-center justify-between">
              <Text className="text-zinc-500 uppercase font-black text-[10px]">
                Target Muscle
              </Text>
              <Text className="text-white font-black italic uppercase text-sm">
                {exercise.muscle_group}
              </Text>
            </View>

            {/* ── Chart Card ── */}
            <View className="mx-5 mt-4 bg-zinc-900/40 rounded-[28px] border border-zinc-800 overflow-hidden pb-4">
              {/* Header row: value + time filter */}
              <View className="flex-row items-start justify-between px-5 pt-5 pb-2">
                <View>
                  <Text className="text-[#E31C25] text-2xl font-black italic">
                    {formatMetricValue(latestValue)}
                    {latestDate && (
                      <Text className="text-zinc-500 text-sm font-bold">
                        {" "}
                        {new Date(latestDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    )}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase mt-0.5">
                    {activeMetric}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTimeModal(true)}
                  className="flex-row items-center bg-zinc-800 rounded-xl px-3 py-2 gap-1"
                >
                  <Text className="text-white font-bold text-xs">
                    {timeFilter}
                  </Text>
                  <ChevronDown size={12} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* Chart */}
              <View className="px-0 mt-2">
                <SparkChart
                  points={chartPoints}
                  metric={activeMetric}
                  weightUnit={weightUnit}
                />
              </View>

              {/* Metric selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 8,
                  paddingTop: 8,
                }}
              >
                {metrics.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setActiveMetric(m)}
                    style={{
                      backgroundColor:
                        activeMetric === m ? "#E31C25" : "#27272a",
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: activeMetric === m ? "#fff" : "#71717a",
                        fontWeight: "800",
                        fontSize: 11,
                        textTransform: "uppercase",
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Personal Records Card ── */}
            <View className="mx-5 mt-4 mb-8 bg-zinc-900/40 rounded-[28px] border border-zinc-800 overflow-hidden">
              <TouchableOpacity
                onPress={() => setShowPR(!showPR)}
                className="flex-row items-center justify-between px-5 py-4"
              >
                <View className="flex-row items-center gap-2">
                  <Trophy size={18} color="#E31C25" />
                  <Text className="text-white font-black uppercase italic text-sm ml-2">
                    Personal Records
                  </Text>
                </View>
                <ChevronDown
                  size={18}
                  color="#71717a"
                  style={{
                    transform: [{ rotate: showPR ? "180deg" : "0deg" }],
                  }}
                />
              </TouchableOpacity>

              {showPR && (
                <View className="px-5 pb-5">
                  {/* PR rows */}
                  {[
                    {
                      label: "Heaviest Weight",
                      value: `${personalRecords.heaviestWeight}${weightUnit}`,
                    },
                    {
                      label: "Best 1RM",
                      value: `${Math.round(personalRecords.best1RM * 10) / 10}${weightUnit}`,
                    },
                    {
                      label: "Best Set Volume",
                      value: `${personalRecords.bestSetVolume.weight}${weightUnit} × ${personalRecords.bestSetVolume.reps}`,
                    },
                    {
                      label: "Best Session Volume",
                      value: `${Math.round(personalRecords.bestSessionVolume)}${weightUnit}`,
                    },
                  ].map((row) => (
                    <View
                      key={row.label}
                      className="flex-row justify-between py-3 border-b border-zinc-800"
                    >
                      <Text className="text-zinc-400 font-bold text-sm">
                        {row.label}
                      </Text>
                      <Text className="text-[#E31C25] font-black text-sm">
                        {row.value}
                      </Text>
                    </View>
                  ))}

                  {/* Set Records */}
                  {personalRecords.setRecords.length > 0 && (
                    <View className="mt-4">
                      <Text className="text-zinc-500 uppercase font-black text-[10px] mb-3">
                        Set Records
                      </Text>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-zinc-600 font-black text-xs uppercase">
                          Reps
                        </Text>
                        <Text className="text-zinc-600 font-black text-xs uppercase">
                          Personal Best
                        </Text>
                      </View>
                      {personalRecords.setRecords.map((sr) => (
                        <View
                          key={sr.reps}
                          className="flex-row justify-between py-2 border-b border-zinc-900"
                        >
                          <Text className="text-white font-bold text-sm">
                            {sr.reps}
                          </Text>
                          <Text className="text-[#E31C25] font-black text-sm">
                            {sr.weight}
                            {weightUnit}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══════════════ HISTORY TAB ══════════════ */}
        {activeTab === "History" && (
          <View className="p-6">
            <Text className="text-white font-black uppercase italic text-lg mb-6">
              Recent Activity
            </Text>

            {allSets.length > 0 ? (
              // Group by date and show last 20 sets
              [...allSets]
                .reverse()
                .slice(0, 20)
                .map((item, index) => (
                  <View
                    key={index}
                    className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800 mb-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <View className="bg-zinc-800 p-2 rounded-lg mr-4">
                        <Calendar size={16} color="#E31C25" />
                      </View>
                      <View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                        <Text className="text-white font-black italic uppercase">
                          Completed Set
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#E31C25] font-black text-lg italic">
                        {item.weight}
                        <Text className="text-zinc-500 text-xs">
                          {weightUnit}
                        </Text>
                      </Text>
                      <Text className="text-zinc-400 text-xs font-bold">
                        {item.reps} Reps
                      </Text>
                    </View>
                  </View>
                ))
            ) : (
              <View className="items-center justify-center pt-10">
                <Trophy size={48} color="#3f3f46" />
                <Text className="text-zinc-500 text-center mt-4 font-bold uppercase italic">
                  No history found
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ══════════════ HOW TO TAB ══════════════ */}
        {activeTab === "How to" && (
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <BookOpen size={20} color="#E31C25" />
              <Text className="text-white font-black ml-2 uppercase italic text-lg">
                Execution Guide
              </Text>
            </View>
            <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-400 leading-6 text-base italic">
                {exercise.instructions && exercise.instructions.trim() !== ""
                  ? exercise.instructions
                  : "No instructions available."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Time Filter Modal ── */}
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
          {/* Handle */}
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
                setTimeFilter(tf);
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
                  color: timeFilter === tf ? "#E31C25" : "#fff",
                  fontWeight: "800",
                  fontSize: 16,
                }}
              >
                {tf}
              </Text>
              {timeFilter === tf && (
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
