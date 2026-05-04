import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Text as SvgText,
} from "react-native-svg";
import { useUnits } from "./context/units_context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RED = "#E31C25";

type Measurement = {
  id: number;
  value: number;
  recorded_at: string;
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── NICE Y LABELS ────────────────────────────────────────────────────────────
function niceYLabels(minV: number, maxV: number): number[] {
  if (minV === maxV) {
    const base = Math.round(minV);
    return [base + 1, base, base - 1];
  }
  const range = maxV - minV;
  const rawStep = range / 2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10].map((s) => s * magnitude);
  const step = candidates.find((s) => s >= rawStep) ?? rawStep;
  const r = (v: number) => Math.round(v * 100) / 100;
  const bottom = r(Math.floor(minV / step) * step);
  const mid = r(bottom + step);
  const top = r(bottom + step * 2);
  return [top, mid, bottom];
}

// ─── CHART — all time, single X row for ≤6 pts, alternating for >6 ──────────
function LineChartFull({ data, unit }: { data: Measurement[]; unit: string }) {
  const W = SCREEN_WIDTH - 48;
  const needsDoubleRow = data.length > 6;
  const H = needsDoubleRow ? 200 : 185;
  const PAD_LEFT = 46;
  const PAD_RIGHT = 16;
  const PAD_TOP = 12;
  const PAD_BOTTOM = needsDoubleRow ? 52 : 36;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  if (data.length === 0) {
    return (
      <View
        style={{ height: H, alignItems: "center", justifyContent: "center" }}
      >
        <Text
          style={{
            color: "#3f3f46",
            fontWeight: "bold",
            fontSize: 13,
            textTransform: "uppercase",
          }}
        >
          No data yet
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = rawMax === rawMin ? 1 : (rawMax - rawMin) * 0.12;
  const minV = rawMin - padding;
  const maxV = rawMax + padding;
  const rangeV = maxV - minV;

  // X positions: proportional to real elapsed time
  const timestamps = data.map((d) => new Date(d.recorded_at).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const rangeTime = maxTime - minTime || 1;

  const toX = (ts: number) => {
    if (data.length === 1) return PAD_LEFT + chartW / 2;
    return PAD_LEFT + ((ts - minTime) / rangeTime) * chartW;
  };
  const toY = (v: number) => PAD_TOP + chartH - ((v - minV) / rangeV) * chartH;

  const polyPoints = data
    .map((d) => `${toX(new Date(d.recorded_at).getTime())},${toY(d.value)}`)
    .join(" ");

  const firstX = toX(timestamps[0]);
  const lastX = toX(timestamps[timestamps.length - 1]);
  const baseY = PAD_TOP + chartH;
  const areaPath =
    `M${firstX},${baseY} ` +
    data
      .map((d) => `L${toX(new Date(d.recorded_at).getTime())},${toY(d.value)}`)
      .join(" ") +
    ` L${lastX},${baseY} Z`;

  // Y axis: always 3 clean round labels
  const yLabelValues = niceYLabels(rawMin, rawMax);
  const yLabels = yLabelValues.map((v) => ({
    text: `${Math.round(v * 10) / 10}`,
    y: toY(v),
  }));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // X labels: ≤6 → all same row; >6 → even indices same row, last odd on row below
  const xIndices: { idx: number; y: number }[] = [];
  if (data.length <= 6) {
    data.forEach((_, i) => xIndices.push({ idx: i, y: baseY + 20 }));
  } else {
    data.forEach((_, i) => {
      if (i % 2 === 0) xIndices.push({ idx: i, y: baseY + 20 });
    });
    const last = data.length - 1;
    if (last % 2 !== 0) xIndices.push({ idx: last, y: baseY + 36 });
  }

  return (
    <Svg width={W} height={H}>
      {/* Y grid + labels */}
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

      {/* Area */}
      <Path d={areaPath} fill={RED} fillOpacity={0.1} />

      {/* Line */}
      {data.length > 1 && (
        <Polyline
          points={polyPoints}
          fill="none"
          stroke={RED}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dots */}
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={toX(new Date(d.recorded_at).getTime())}
          cy={toY(d.value)}
          r={3.5}
          fill={RED}
        />
      ))}

      {/* X date labels — same row for ≤6 pts */}
      {xIndices.map(({ idx, y }) => {
        const x = toX(new Date(data[idx].recorded_at).getTime());
        const anchor =
          idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle";
        return (
          <SvgText
            key={idx}
            x={x}
            y={y}
            fontSize={9}
            fill="#71717a"
            textAnchor={anchor as any}
            fontWeight="bold"
          >
            {formatDate(data[idx].recorded_at)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function BodyMeasuresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const { weightUnit, heightUnit } = useUnits();
  const [activeTab, setActiveTab] = useState<"weight" | "height">("weight");
  const currentUnit = activeTab === "weight" ? weightUnit : heightUnit;

  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<Measurement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  // ── DB setup & load ───────────────────────────────────────────────────────
  const ensureTable = useCallback(async () => {
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS body_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        value REAL NOT NULL,
        type TEXT NOT NULL,
        recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }, [db]);

  const loadData = useCallback(async () => {
    try {
      await ensureTable();
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;
      const rows = await db.getAllAsync<Measurement>(
        `SELECT id, value, recorded_at
         FROM body_measurements
         WHERE user_email = ? AND type = ?
         ORDER BY recorded_at ASC`,
        [email, activeTab],
      );
      setAllData(rows);
    } catch (e) {
      console.error("Error loading measurements:", e);
    } finally {
      setLoading(false);
    }
  }, [db, ensureTable, activeTab]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  // ── Add measurement ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    const parsed = parseFloat(newValue.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      // Check if there is already a measurement of this type for today
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM body_measurements
         WHERE user_email = ? AND type = ? AND date(recorded_at) = ?`,
        [email, activeTab, today],
      );

      if (existing) {
        // Update the existing record for today instead of inserting a new one
        await db.runAsync(
          `UPDATE body_measurements
           SET value = ?, recorded_at = datetime('now')
           WHERE id = ?`,
          [parsed, existing.id],
        );
      } else {
        // No entry yet for today — insert normally
        await db.runAsync(
          `INSERT INTO body_measurements (user_email, value, type, recorded_at)
           VALUES (?, ?, ?, datetime('now'))`,
          [email, parsed, activeTab],
        );
      }

      // Always keep the users table in sync with the latest value
      if (activeTab === "weight") {
        await db.runAsync(`UPDATE users SET weight = ? WHERE email = ?`, [
          String(parsed),
          email,
        ]);
      } else {
        await db.runAsync(`UPDATE users SET height = ? WHERE email = ?`, [
          String(parsed),
          email,
        ]);
      }

      setNewValue("");
      setShowAddModal(false);
      await loadData();
    } catch (e) {
      console.error("Error saving measurement:", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const latest = allData.length > 0 ? allData[allData.length - 1] : null;

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color={RED} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center justify-between px-4 py-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/profile")}
          className="p-2"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black flex-1 text-center px-4 uppercase">
          Measurements
        </Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} className="p-2">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Metric toggle */}
        <View className="flex-row px-6 mt-6 gap-3">
          {(["weight", "height"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ backgroundColor: activeTab === tab ? RED : "#1c1c1e" }}
              className="px-6 py-2 rounded-full border border-zinc-800"
            >
              <Text
                style={{ color: activeTab === tab ? "white" : "#52525b" }}
                className="font-black uppercase text-sm"
              >
                {tab === "weight" ? "Weight" : "Height"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Latest value */}
        <View className="flex-row items-baseline gap-2 px-6 mt-5 mb-2">
          <Text className="text-white text-2xl font-black uppercase">
            {latest ? `${latest.value}${currentUnit}` : "—"}
          </Text>
          {latest && (
            <Text
              style={{ color: RED }}
              className="text-sm font-black uppercase"
            >
              {formatAxisDate(latest.recorded_at)}
            </Text>
          )}
        </View>

        {/* Chart — all time, no filter */}
        <View className="px-6 mt-2">
          <LineChartFull data={allData} unit={currentUnit} />
        </View>

        {/* History */}
        <View className="px-6 mt-8">
          <Text className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-4">
            {activeTab} History
          </Text>
          {allData.length === 0 ? (
            <Text className="text-zinc-700 font-bold uppercase text-sm">
              No entries yet.
            </Text>
          ) : (
            [...allData].reverse().map((m) => (
              <View
                key={m.id}
                className="flex-row justify-between items-center py-4 border-b border-zinc-900"
              >
                <Text className="text-white font-bold text-base uppercase">
                  {formatHistoryDate(m.recorded_at)}
                </Text>
                <Text className="text-white font-black text-base">
                  {m.value}
                  {currentUnit}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL — Add Measurement */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-black/60 justify-end"
            onPress={() => {
              setShowAddModal(false);
              setNewValue("");
            }}
          >
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-[#121212] px-8 pt-8 pb-12 rounded-t-[40px] border-t border-zinc-800">
                <Text className="text-white text-center font-black uppercase mb-2 tracking-widest text-base">
                  Add {activeTab === "weight" ? "Weight" : "Height"}
                </Text>
                <Text className="text-zinc-600 text-center font-bold uppercase text-[10px] mb-8">
                  Today´s measurement
                </Text>
                <View className="flex-row items-center border-b border-zinc-700 mb-8 pb-2">
                  <TextInput
                    value={newValue}
                    onChangeText={setNewValue}
                    placeholder={
                      activeTab === "weight" ? "e.g. 70.5" : "e.g. 175"
                    }
                    placeholderTextColor="#3f3f46"
                    keyboardType="decimal-pad"
                    className="flex-1 text-white text-2xl font-black"
                    selectionColor={RED}
                    autoFocus
                  />
                  <Text className="text-zinc-500 font-black uppercase text-lg ml-2">
                    {currentUnit}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleAdd}
                  disabled={saving || !newValue.trim()}
                  className="w-full py-4 rounded-2xl items-center"
                  style={{
                    backgroundColor:
                      saving || !newValue.trim() ? "#3f3f46" : RED,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black uppercase text-lg tracking-wider">
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
