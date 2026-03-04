import { useRouter } from "expo-router"; // Importar router
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MIN_WEIGHT = 20;
const MAX_WEIGHT = 250; // Aumentado para suportar LBs mais altos
const ITEM_WIDTH = 20;

const weightData = Array.from(
  { length: MAX_WEIGHT - MIN_WEIGHT + 1 },
  (_, i) => MIN_WEIGHT + i,
);

export default function WeightSelection() {
  const router = useRouter(); // Inicializar router
  const [weight, setWeight] = useState(54);
  const [unit, setUnit] = useState<"KG" | "LB">("KG");
  const flatListRef = useRef<FlatList>(null);
  const isSwitchingUnit = useRef(false);

  // Função de conversão
  const toggleUnit = (newUnit: "KG" | "LB") => {
    if (unit === newUnit) return;

    isSwitchingUnit.current = true;
    let newWeightValue: number;

    if (newUnit === "LB") {
      newWeightValue = Math.round(weight * 2.20462);
    } else {
      newWeightValue = Math.round(weight / 2.20462);
    }

    // Garantir que não sai dos limites da régua
    newWeightValue = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, newWeightValue));

    setWeight(newWeightValue);
    setUnit(newUnit);

    // Mover a régua para a nova posição
    const index = weightData.indexOf(newWeightValue);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
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
      const selectedWeight = weightData[index];
      if (selectedWeight !== weight) {
        setWeight(selectedWeight);
      }
    }
  };

  const renderItem = ({ item }: { item: number }) => {
    const isMajor = item % 5 === 0;
    return (
      <View style={[styles.ruleItem, { width: ITEM_WIDTH }]}>
        <View
          style={[styles.bar, isMajor ? styles.barMajor : styles.barMinor]}
        />
      </View>
    );
  };

  const initialScroll = () => {
    const index = weightData.indexOf(54);
    if (index !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} onLayout={initialScroll}>
        <View style={styles.header}>
          <Text style={styles.title}>What’s your weight?</Text>
          <Text style={styles.subtitle}>You can always change this later</Text>
        </View>

        <View style={styles.weightDisplay}>
          <Text style={styles.weightNumber}>{weight}</Text>
          <Text style={styles.weightUnit}>{unit.toLowerCase()}</Text>
        </View>

        <View style={styles.rulerContainer}>
          <FlatList
            ref={flatListRef}
            data={weightData}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
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
          <View style={styles.centerIndicator} pointerEvents="none" />
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
          {/* BOTÃO VOLTAR CORRIGIDO */}
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

// ... (teus estilos mantêm-se iguais)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121417" },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  header: { alignItems: "center", marginTop: 30 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
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
    marginTop: 50,
  },
  weightNumber: { fontSize: 80, fontWeight: "bold", color: "white" },
  weightUnit: {
    fontSize: 24,
    color: "#D1D5DB",
    marginLeft: 10,
    fontWeight: "500",
  },
  rulerContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginTop: 30,
  },
  ruleItem: { alignItems: "center", justifyContent: "center", height: "100%" },
  bar: { width: 2, backgroundColor: "#FF0000", borderRadius: 1 },
  barMinor: { height: 30, opacity: 0.5 },
  barMajor: { height: 60, opacity: 1 },
  centerIndicator: {
    position: "absolute",
    height: 90,
    width: 3,
    backgroundColor: "#FF0000",
    top: "50%",
    marginTop: -45,
    borderRadius: 2,
    zIndex: 10,
  },
  unitSwitcherContainer: { alignItems: "center", marginTop: 40 },
  unitSwitcherBg: {
    flexDirection: "row",
    backgroundColor: "#374151",
    borderRadius: 30,
    padding: 5,
    width: 220,
    height: 60,
  },
  unitButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  unitButtonActive: { backgroundColor: "#FF0000" },
  unitButtonText: { color: "#9CA3AF", fontSize: 18, fontWeight: "bold" },
  unitButtonTextActive: { color: "white" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
  },
  backButton: {
    backgroundColor: "#374151",
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
    paddingVertical: 15,
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
