import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
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

const { width } = Dimensions.get("window");
const ITEM_HEIGHT = 60;

interface ScrollColumnProps {
  data: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export default function BirthdaySelection() {
  const router = useRouter();

  // --- LÓGICA DE DATA DINÂMICA ---
  const today = new Date();
  const monthsNames = [
    "Jan.",
    "Feb.",
    "Mar.",
    "Apr.",
    "May.",
    "Jun.",
    "Jul.",
    "Aug.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
  ];

  const currentDay = today.getDate().toString();
  const currentMonth = monthsNames[today.getMonth()];

  // O utilizador tem de ter no mínimo 12 anos, logo o ano máximo permitido é 2014 (em 2026)
  const maxAllowedYear = today.getFullYear() - 12;
  const startingYear = maxAllowedYear.toString();

  const [day, setDay] = useState(currentDay);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(startingYear);

  // Listas de dados
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = monthsNames;

  // A lista de anos começa no ano máximo permitido (ex: 2014) e vai até 100 anos atrás
  const years = Array.from({ length: 90 }, (_, i) =>
    (maxAllowedYear - i).toString(),
  );

  const ScrollColumn = ({
    data,
    selectedValue,
    onValueChange,
  }: ScrollColumnProps) => {
    return (
      <View style={styles.column}>
        <View style={styles.individualOval} pointerEvents="none" />

        <FlatList
          data={data}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate={Platform.OS === "ios" ? "normal" : 0.9}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = e.nativeEvent.contentOffset.y;
            const index = Math.round(y / ITEM_HEIGHT);
            if (data[index] && data[index] !== selectedValue) {
              onValueChange(data[index]);
            }
          }}
          initialScrollIndex={
            data.indexOf(selectedValue) !== -1 ? data.indexOf(selectedValue) : 0
          }
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <Text
                style={[
                  styles.itemText,
                  selectedValue === item
                    ? styles.selectedItemText
                    : styles.unselectedItemText,
                ]}
              >
                {item}
              </Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Insert your birth date!</Text>
          <Text style={styles.subtitle}>
            To give you a better experience we need to know your gender
          </Text>
        </View>

        <View style={styles.pickerMainContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Day</Text>
            <Text style={styles.labelText}>Month</Text>
            <Text style={styles.labelText}>Year</Text>
          </View>

          <View style={styles.pickerWrapper}>
            <View style={styles.selectionLines} pointerEvents="none" />

            <View style={styles.pickersContainer}>
              <ScrollColumn
                data={days}
                selectedValue={day}
                onValueChange={setDay}
              />
              <ScrollColumn
                data={months}
                selectedValue={month}
                onValueChange={setMonth}
              />
              <ScrollColumn
                data={years}
                selectedValue={year}
                onValueChange={setYear}
              />
            </View>
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
            onPress={() => router.push("/WeightSelection")}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight color="white" size={20} />
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
    paddingVertical: 30,
    justifyContent: "space-between",
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
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },

  pickerMainContainer: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 30,
  },
  labelRow: { flexDirection: "row", width: "100%", marginBottom: 15 },
  labelText: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  pickerWrapper: {
    height: ITEM_HEIGHT * 5,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  pickersContainer: { flexDirection: "row", width: "100%", height: "100%" },

  column: { flex: 1, alignItems: "center", justifyContent: "center" },

  individualOval: {
    position: "absolute",
    height: ITEM_HEIGHT - 12,
    width: "80%",
    backgroundColor: "#2D2F33",
    borderRadius: 12,
    zIndex: 0,
    top: "50%",
    marginTop: -(ITEM_HEIGHT - 12) / 2,
  },

  selectionLines: {
    position: "absolute",
    height: ITEM_HEIGHT,
    width: "100%",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#FF0000",
    zIndex: 1,
    top: "50%",
    marginTop: -ITEM_HEIGHT / 2,
  },

  itemWrapper: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: { fontSize: 22, textAlign: "center" },
  selectedItemText: { color: "white", fontWeight: "bold" },
  unselectedItemText: { color: "#4B5563", fontSize: 18, opacity: 0.4 },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    paddingVertical: 14,
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
