import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ChevronLeft, Dumbbell } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IMAGE_MAP } from "../constants/exercise_images";

// @ts-ignore
import InvictusLogo from "../assets/images/logo_invictus.jpeg";

type ExerciseCount = {
  id: number;
  name: string;
  image: string | null;
  muscle_group: string;
  times: number;
};

type TimeFilter = "Last 7 days" | "Last 30 days" | "Last 3 months" | "All time";

const TIME_FILTERS: TimeFilter[] = [
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "All time",
];

export default function MainExercisesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();

  const [exercises, setExercises] = useState<ExerciseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Last 30 days");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const user = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [userEmail],
      );
      if (!user) return;

      let dateFilter = "";
      const now = new Date();
      if (timeFilter === "Last 7 days") {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        dateFilter = `AND w.date >= '${cutoff.toISOString()}'`;
      } else if (timeFilter === "Last 30 days") {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        dateFilter = `AND w.date >= '${cutoff.toISOString()}'`;
      } else if (timeFilter === "Last 3 months") {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - 3);
        dateFilter = `AND w.date >= '${cutoff.toISOString()}'`;
      }

      const rows = await db.getAllAsync<ExerciseCount>(
        `SELECT 
          e.id, 
          e.name, 
          e.image,
          e.muscle_group,
          COUNT(ws.id) as times
        FROM workout_sets ws
        JOIN exercises e ON ws.exercise_id = e.id
        JOIN workout_exercises we ON ws.workout_exercise_id = we.id
        JOIN workouts w ON we.workout_id = w.id
        WHERE w.user_id = ? ${dateFilter}
        GROUP BY e.id
        ORDER BY times DESC`,
        [user.id],
      );

      setExercises(rows);
    } catch (e) {
      console.error("Erro ao carregar exercícios:", e);
    } finally {
      setLoading(false);
    }
  }, [db, timeFilter]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StatusBar style="light" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3 border-b border-[#1f1f1f] bg-[#0a0a0a]"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold">
          Main Exercises
        </Text>
        <View className="w-9" />
      </View>

      {/* Filter button */}
      <View className="px-6 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: "#18181b",
            borderWidth: 1,
            borderColor: "#27272a",
            borderRadius: 999,
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
            {timeFilter}
          </Text>
          <ChevronDown color="#71717a" size={16} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#E31C25" size="large" />
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <Dumbbell color="#27272a" size={56} />
          <Text
            style={{
              color: "#3f3f46",
              fontWeight: "700",
              fontSize: 14,
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: 16,
              letterSpacing: 1,
            }}
          >
            No exercises found{"\n"}for this period
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            paddingTop: 8,
          }}
        >
          {exercises.map((item, index) => {
            const imageKey = item.image?.trim();
            const isExternal =
              imageKey?.startsWith("file") || imageKey?.startsWith("http");
            const imageSource = isExternal
              ? { uri: imageKey }
              : imageKey && IMAGE_MAP[imageKey]
                ? IMAGE_MAP[imageKey]
                : InvictusLogo;

            const maxTimes = exercises[0]?.times ?? 1;
            const barWidth = `${Math.round((item.times / maxTimes) * 100)}%`;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]",
                    params: { id: item.id, from: "stats" },
                  } as any)
                }
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#0f0f0f",
                  borderWidth: 1,
                  borderColor: "#18181b",
                  borderRadius: 24,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                {/* Rank */}
                <Text
                  style={{
                    color: index < 3 ? "#E31C25" : "#3f3f46",
                    fontWeight: "900",
                    fontSize: 16,
                    width: 28,
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </Text>

                {/* Image */}
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: "#1a1a1a",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#27272a",
                    marginRight: 14,
                    marginLeft: 8,
                  }}
                >
                  <Image
                    source={imageSource}
                    style={{ width: "100%", height: "100%" }}
                    contentFit={
                      imageSource === InvictusLogo ? "contain" : "cover"
                    }
                    cachePolicy="memory-disk"
                  />
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "800",
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  {/* Progress bar */}
                  <View
                    style={{
                      height: 4,
                      backgroundColor: "#27272a",
                      borderRadius: 999,
                      overflow: "hidden",
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: barWidth as any,
                        backgroundColor: index < 3 ? "#E31C25" : "#3f3f46",
                        borderRadius: 999,
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      color: "#52525b",
                      fontWeight: "700",
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.muscle_group}
                  </Text>
                </View>

                {/* Times */}
                <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                  <Text
                    style={{
                      color: index < 3 ? "#E31C25" : "#71717a",
                      fontWeight: "900",
                      fontSize: 18,
                    }}
                  >
                    {item.times}
                  </Text>
                  <Text
                    style={{
                      color: "#3f3f46",
                      fontWeight: "700",
                      fontSize: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    sets
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#0f0f0f",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1,
            borderColor: "#18181b",
            paddingBottom: 48,
            paddingTop: 8,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#27272a",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: 1,
              paddingHorizontal: 24,
              marginBottom: 12,
            }}
          >
            Time Period
          </Text>
          {TIME_FILTERS.map((tf) => (
            <TouchableOpacity
              key={tf}
              onPress={() => {
                setTimeFilter(tf);
                setShowFilterModal(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#18181b",
              }}
            >
              <Text
                style={{
                  color: timeFilter === tf ? "#E31C25" : "white",
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
    </View>
  );
}
