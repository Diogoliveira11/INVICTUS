import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- LIMITES DEFINIDOS ---
const MIN_KG = 20;
const MAX_KG = 300;
const MIN_LB = 45;
const MAX_LB = 661;

const ITEM_WIDTH = 20;
const DEFAULT_WEIGHT_KG = 70;

// Geramos os dados baseados em KG (20 a 300)
const weightData = Array.from(
  { length: MAX_KG - MIN_KG + 1 },
  (_, i) => MIN_KG + i,
);

export default function WeightSelection() {
  const router = useRouter();
  const [weight, setWeight] = useState(DEFAULT_WEIGHT_KG);
  const [unit, setUnit] = useState<"KG" | "LB">("KG");
  const flatListRef = useRef<FlatList>(null);
  const isSwitchingUnit = useRef(false);

  // Inicialização da régua no peso padrão
  useEffect(() => {
    const initialIndex = weightData.indexOf(DEFAULT_WEIGHT_KG);
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_WIDTH,
        animated: false,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // --- LÓGICA DE TRANSIÇÃO COM LIMITES ESPECÍFICOS ---
  const toggleUnit = (newUnit: "KG" | "LB") => {
    if (unit === newUnit) return;

    isSwitchingUnit.current = true;
    let convertedValue: number;

    if (newUnit === "LB") {
      // Converte para Libras e aplica limites 45-661
      convertedValue = Math.round(weight * 2.20462);
      convertedValue = Math.max(MIN_LB, Math.min(MAX_LB, convertedValue));
    } else {
      // Converte para KG e aplica limites 20-300
      convertedValue = Math.round(weight / 2.20462);
      convertedValue = Math.max(MIN_KG, Math.min(MAX_KG, convertedValue));
    }

    setWeight(convertedValue);
    setUnit(newUnit);

    // Na nossa régua (que é baseada em índices), precisamos mapear o valor visual
    // Se estivermos em LB, o scroll deve ir para a posição proporcional na régua de KG
    // Para simplificar e manter a precisão visual, usamos o valor de KG correspondente para o scroll
    const scrollWeight =
      newUnit === "LB" ? Math.round(convertedValue / 2.20462) : convertedValue;
    const index = weightData.indexOf(
      Math.max(MIN_KG, Math.min(MAX_KG, scrollWeight)),
    );

    if (index !== -1) {
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: true,
      });
    }

    setTimeout(() => {
      isSwitchingUnit.current = false;
    }, 500);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSwitchingUnit.current) return;

    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / ITEM_WIDTH);

    if (index >= 0 && index < weightData.length) {
      const kgValue = weightData[index];

      if (unit === "KG") {
        setWeight(kgValue);
      } else {
        // Se a unidade for LB, mostramos o valor convertido na tela
        const lbValue = Math.round(kgValue * 2.20462);
        setWeight(Math.max(MIN_LB, Math.min(MAX_LB, lbValue)));
      }
    }
  };

  const renderItem = ({ item }: { item: number }) => {
    const isMajor = item % 5 === 0;
    return (
      <View
        style={{
          width: ITEM_WIDTH,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={[styles.bar, isMajor ? styles.barMajor : styles.barMinor]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>What’s your weight?</Text>
          <Text style={styles.subtitle}>You can always change this later</Text>
        </View>

        <View style={styles.weightDisplay}>
          <Text style={styles.weightNumber}>{weight}</Text>
          <Text style={styles.weightUnit}>{unit.toLowerCase()}</Text>
        </View>

        <View style={styles.rulerContainer}>
          <View style={styles.centerIndicator} pointerEvents="none" />

          <FlatList
            ref={flatListRef}
            data={weightData}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="center"
            decelerationRate="fast"
            bounces={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2,
            }}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
          />
        </View>

        <View style={styles.unitSwitcherContainer}>
          <View style={styles.unitSwitcherBg}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === "KG" && styles.unitButtonActive,
              ]}
              onPress={() => toggleUnit("KG")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === "KG" && styles.unitButtonTextActive,
                ]}
              >
                KG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === "LB" && styles.unitButtonActive,
              ]}
              onPress={() => toggleUnit("LB")}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  unit === "LB" && styles.unitButtonTextActive,
                ]}
              >
                LB
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push("/HeightSelection")}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121417" },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: { alignItems: "center", marginTop: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },
  weightDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  weightNumber: { fontSize: 80, fontWeight: "bold", color: "white" },
  weightUnit: { fontSize: 24, color: "#D1D5DB", marginLeft: 8 },
  rulerContainer: {
    height: 120,
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerIndicator: {
    position: "absolute",
    height: 90,
    width: 4,
    backgroundColor: "#FF0000",
    borderRadius: 2,
    zIndex: 10,
    left: "50%",
    marginLeft: -2,
  },
  bar: { width: 3, backgroundColor: "#FF0000", borderRadius: 2 },
  barMinor: { height: 35, opacity: 0.3 },
  barMajor: { height: 70, opacity: 1 },
  unitSwitcherContainer: { alignItems: "center" },
  unitSwitcherBg: {
    flexDirection: "row",
    backgroundColor: "#2D2F33",
    borderRadius: 30,
    padding: 4,
    width: 200,
  },
  unitButton: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  unitButtonActive: { backgroundColor: "#FF0000" },
  unitButtonText: { color: "#9CA3AF", fontWeight: "bold", fontSize: 16 },
  unitButtonTextActive: { color: "white" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#2D2F33",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#FF0000",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 5,
  },
});
