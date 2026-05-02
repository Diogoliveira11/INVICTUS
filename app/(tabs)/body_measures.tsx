import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { useUnits } from "./context/units_context";

// We need Text from react-native-svg — let's redo with proper imports
import Svg2, {
  Circle as C2,
  Line as L2,
  Polyline as P2,
  Text as SvgText,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48; // px-6 on each side
const CHART_HEIGHT = 160;
const PADDING_X = 40;
const PADDING_Y = 20;

type Measurement = {
  id: number;
  value: number;
  recorded_at: string; // ISO string
};

type PeriodKey = "1M" | "3M" | "6M" | "1Y" | "All";

const PERIODS: { label: string; key: PeriodKey }[] = [
  { label: "Last month", key: "1M" },
  { label: "Last 3 months", key: "3M" },
  { label: "Last 6 months", key: "6M" },
  { label: "Last year", key: "1Y" },
  { label: "All time", key: "All" },
];

const RED = "#E31C25";

// ── helpers ────────────────────────────────────────────────────────────────

function filterByPeriod(data: Measurement[], period: PeriodKey): Measurement[] {
  if (period === "All") return data;
  const now = new Date();
  const months = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[period];
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter((d) => new Date(d.recorded_at) >= cutoff);
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── LineChart ───────────────────────────────────────────────────────────────

function LineChart({ data, unit }: { data: Measurement[]; unit: string }) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const innerW = CHART_WIDTH - PADDING_X * 2;
  const innerH = CHART_HEIGHT - PADDING_Y * 2;

  const toX = (i: number) =>
    PADDING_X + (i / Math.max(data.length - 1, 1)) * innerW;
  const toY = (v: number) =>
    PADDING_Y + innerH - ((v - minVal) / range) * innerH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");

  // Y-axis labels (4 lines)
  const yLabels = [0, 1, 2, 3].map((i) => {
    const v = minVal + (range / 3) * i;
    const y = toY(v);
    return { label: v.toFixed(1) + unit, y };
  });

  // X-axis: show first, middle, last
  const xIndices =
    data.length === 1
      ? [0]
      : data.length === 2
        ? [0, 1]
        : [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Grid lines */}
      {yLabels.map((l, i) => (
        <Line
          key={i}
          x1={PADDING_X}
          y1={l.y}
          x2={CHART_WIDTH - 10}
          y2={l.y}
          stroke="#27272a"
          strokeWidth="1"
        />
      ))}

      {/* Y labels */}
      {yLabels.map((l, i) => (
        <Svg
          key={`yl-${i}`}
          x={0}
          y={l.y - 6}
          width={PADDING_X - 4}
          height={14}
        >
          <Circle cx={0} cy={0} r={0} />
          {/* We render text via a trick below */}
        </Svg>
      ))}

      {/* Line */}
      {data.length > 1 && (
        <Polyline
          points={points}
          fill="none"
          stroke={RED}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dots */}
      {data.map((d, i) => (
        <Circle
          key={i}
          cx={toX(i)}
          cy={toY(d.value)}
          r={4}
          fill={RED}
          stroke="#000"
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}

function LineChartFull({ data, unit }: { data: Measurement[]; unit: string }) {
  if (data.length === 0) return null;

  // 1. Valores para o eixo Y (Peso/Medida)
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const rangeY = maxVal - minVal || 1;

  // 2. Timestamps para o eixo X (Tempo) - Isto garante a distância proporcional
  const timestamps = data.map((d) => new Date(d.recorded_at).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const rangeX = maxTime - minTime || 1;

  const innerW = CHART_WIDTH - PADDING_X * 2;
  const innerH = CHART_HEIGHT - PADDING_Y * 2;

  // 3. Função toX: Calcula a posição baseada no tempo decorrido
  const toX = (timestamp: number) => {
    if (data.length === 1) return PADDING_X + innerW / 2;
    // (Tempo Atual - Tempo Inicial) / Tempo Total * Largura do Gráfico
    return PADDING_X + ((timestamp - minTime) / rangeX) * innerW;
  };

  const toY = (v: number) =>
    PADDING_Y + innerH - ((v - minVal) / rangeY) * innerH;

  const points = data
    .map((d) => `${toX(new Date(d.recorded_at).getTime())},${toY(d.value)}`)
    .join(" ");

  const yTicks = [0, 1, 2, 3].map((i) => {
    const v = minVal + (rangeY / 3) * i;
    return { label: v.toFixed(1), y: toY(v) };
  });

  return (
    <Svg2 width={CHART_WIDTH} height={CHART_HEIGHT + 24}>
      {/* Linhas de Grade Horizontais */}
      {yTicks.map((t, i) => (
        <L2
          key={i}
          x1={PADDING_X}
          y1={t.y}
          x2={CHART_WIDTH - 6}
          y2={t.y}
          stroke="#27272a"
          strokeWidth="1"
        />
      ))}

      {/* Labels do Eixo Y (Valores) */}
      {yTicks.map((t, i) => (
        <SvgText
          key={`yl${i}`}
          x={PADDING_X - 4}
          y={t.y + 4}
          fontSize="9"
          fill="#52525b"
          textAnchor="end"
          fontWeight="bold"
        >
          {t.label}
        </SvgText>
      ))}

      {/* A Linha do Gráfico */}
      {data.length > 1 && (
        <P2
          points={points}
          fill="none"
          stroke={RED}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Pontos (Círculos) - Posicionados proporcionalmente ao tempo */}
      {data.map((d, i) => (
        <C2
          key={i}
          cx={toX(new Date(d.recorded_at).getTime())}
          cy={toY(d.value)}
          r={4}
          fill={RED}
          stroke="#000"
          strokeWidth={2}
        />
      ))}

      {/* Datas no Eixo X (Início e Fim) */}
      {data.length > 0 && (
        <>
          <SvgText
            x={toX(timestamps[0])}
            y={CHART_HEIGHT + 18}
            fontSize="9"
            fill="#52525b"
            textAnchor="start"
            fontWeight="bold"
          >
            {formatAxisDate(data[0].recorded_at)}
          </SvgText>
          {data.length > 1 && (
            <SvgText
              x={toX(timestamps[data.length - 1])}
              y={CHART_HEIGHT + 18}
              fontSize="9"
              fill="#52525b"
              textAnchor="end"
              fontWeight="bold"
            >
              {formatAxisDate(data[data.length - 1].recorded_at)}
            </SvgText>
          )}
        </>
      )}
    </Svg2>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

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
  const [period, setPeriod] = useState<PeriodKey>("3M");
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  // ── DB setup & load ──────────────────────────────────────────────────────

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

      // Mudança aqui: Usamos o activeTab na query
      const rows = await db.getAllAsync<Measurement>(
        `SELECT id, value, recorded_at
        FROM body_measurements
        WHERE user_email = ? AND type = ?
        ORDER BY recorded_at ASC`,
        [email, activeTab], // activeTab será 'weight' ou 'height'
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

  // ── Add measurement ──────────────────────────────────────────────────────

  const handleAdd = async () => {
    const parsed = parseFloat(newValue.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;

    setSaving(true);
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) return;

      // 1. Insere na tabela de histórico usando o activeTab ('weight' ou 'height')
      await db.runAsync(
        `INSERT INTO body_measurements (user_email, value, type, recorded_at)
          VALUES (?, ?, ?, datetime('now'))`,
        [email, parsed, activeTab],
      );

      // 2. Atualiza o valor mais recente na tabela de utilizadores (perfil)
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
      await loadData(); // Recarrega os dados do gráfico ativo
    } catch (e) {
      console.error("Error saving measurement:", e);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const filtered = filterByPeriod(allData, period);
  const latest = allData.length > 0 ? allData[allData.length - 1] : null;
  const selectedPeriodLabel =
    PERIODS.find((p) => p.key === period)?.label ?? "Last 3 months";

  // ── Render ───────────────────────────────────────────────────────────────

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
        {/* TOP ROW — latest value + period picker */}
        <View className="flex-row items-center justify-between px-6 mt-6 mb-4">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-white text-2xl font-black uppercase">
              {latest
                ? `${latest.value}${activeTab === "weight" ? weightUnit : heightUnit}`
                : "—"}
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

          <TouchableOpacity
            onPress={() => setShowPeriodModal(true)}
            className="flex-row items-center gap-1"
          >
            <Text
              style={{ color: RED }}
              className="font-black text-sm uppercase"
            >
              {selectedPeriodLabel}
            </Text>
            <ChevronDown size={14} color={RED} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* CHART */}
        <View className="px-6">
          {filtered.length >= 1 ? (
            <LineChartFull
              data={filtered}
              unit={activeTab === "weight" ? weightUnit : heightUnit}
            />
          ) : (
            <View
              style={{ height: CHART_HEIGHT }}
              className="items-center justify-center"
            >
              <Text className="text-zinc-700 font-black uppercase text-sm">
                No data for this period
              </Text>
            </View>
          )}
        </View>

        {/* METRIC SELECTOR TABS */}
        <View className="px-6 mt-6 flex-row gap-3">
          {/* Botão Weight */}
          <TouchableOpacity
            onPress={() => setActiveTab("weight")}
            style={{
              backgroundColor: activeTab === "weight" ? RED : "#1c1c1e",
            }}
            className="px-6 py-2 rounded-full border border-zinc-800"
          >
            <Text
              style={{ color: activeTab === "weight" ? "white" : "#52525b" }}
              className="font-black uppercase text-sm"
            >
              Weight
            </Text>
          </TouchableOpacity>

          {/* Botão Height */}
          <TouchableOpacity
            onPress={() => setActiveTab("height")}
            style={{
              backgroundColor: activeTab === "height" ? RED : "#1c1c1e",
            }}
            className="px-6 py-2 rounded-full border border-zinc-800"
          >
            <Text
              style={{ color: activeTab === "height" ? "white" : "#52525b" }}
              className="font-black uppercase text-sm"
            >
              Height
            </Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY */}
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
                  {/* MUDANÇA AQUI: Usa currentUnit em vez de weightUnit ou KG */}
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
                {/* TÍTULO DINÂMICO */}
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
                    // PLACEHOLDER DINÂMICO
                    placeholder={
                      activeTab === "weight" ? "e.g. 70.5" : "e.g. 175"
                    }
                    placeholderTextColor="#3f3f46"
                    keyboardType="decimal-pad"
                    className="flex-1 text-white text-2xl font-black"
                    selectionColor={RED}
                    autoFocus
                  />
                  {/* UNIDADE DINÂMICA */}
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

      {/* MODAL — Period Picker */}
      <Modal visible={showPeriodModal} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowPeriodModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-[#121212] px-6 pt-8 pb-12 rounded-t-[40px] border-t border-zinc-800">
              <Text className="text-white text-center font-black uppercase mb-6 tracking-widest text-sm">
                Select Period
              </Text>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => {
                    setPeriod(p.key);
                    setShowPeriodModal(false);
                  }}
                  className="flex-row items-center justify-between py-4 border-b border-zinc-800"
                >
                  <Text className="text-white font-bold uppercase text-base">
                    {p.label}
                  </Text>
                  {period === p.key && (
                    <View
                      style={{ backgroundColor: RED }}
                      className="w-2 h-2 rounded-full"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
