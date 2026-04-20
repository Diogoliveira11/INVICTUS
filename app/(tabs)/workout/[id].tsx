import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Trash2,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Mapa de gifs locais do projeto
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

type ExerciseDetails = {
  id: number;
  name: string;
  muscle_group: string;
  image: string | null;
  gif: string | null;
  instructions: string | null;
  is_custom: number;
};

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string; from: string }>(); // Captura o 'from'
  const db = useSQLiteContext();

  const [exercise, setExercise] = useState<ExerciseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    async function loadExercise() {
      try {
        const result = await db.getFirstAsync<ExerciseDetails>(
          "SELECT id, name, muscle_group, image, gif, instructions, is_custom FROM exercises WHERE id = ?",
          [id as string],
        );

        if (result) {
          setExercise(result);
          setActiveTab(result.is_custom === 1 ? "History" : "Summary");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExercise();
  }, [id, db]);

  // VOLTAR BASEADO NA ORIGEM
  const handleBack = () => {
    if (from === "workout") {
      // Caminho completo para o log de treino
      router.replace("/(tabs)/workout/log_workout" as any);
    } else if (from === "new_routine") {
      // CAMINHO CORRIGIDO: O ficheiro está dentro da pasta workout
      router.replace("/(tabs)/workout/new_routine" as any);
    } else {
      // Caso padrão: Explore Exercises
      router.replace("/(tabs)/workout/explore_exercises" as any);
    }
  };

  const handleDelete = async () => {
    Alert.alert("Eliminar", "Tens a certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await db.runAsync("DELETE FROM exercises WHERE id = ?", [
              id as string,
            ]);
            router.replace("/workout/explore_exercises");
          } catch (error) {
            Alert.alert("Erro", "Não foi possível eliminar.");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#E31C25" size="large" />
      </View>
    );
  if (!exercise)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">Não encontrado.</Text>
      </View>
    );

  const tabs =
    exercise.is_custom === 1
      ? ["History", "How to"]
      : ["Summary", "History", "How to"];
  const gifSource = exercise.gif
    ? (GIF_MAP[exercise.gif] ??
      GIF_MAP[exercise.gif.replace(/^\//, "")] ??
      GIF_MAP[exercise.gif.replace(/^assets\//, "")] ??
      null)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
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
        {activeTab === "Summary" && exercise.is_custom === 0 && (
          <View className="p-5">
            <View className="w-full h-80 bg-white rounded-[40px] overflow-hidden mb-6 items-center justify-center border-4 border-zinc-900">
              {gifSource ? (
                <Image
                  source={gifSource}
                  className="w-full h-full"
                  resizeMode="contain"
                  onError={() =>
                    console.warn("GIF failed to load:", exercise.gif)
                  }
                />
              ) : (
                <View className="items-center justify-center gap-2">
                  <Target size={48} color="#d4d4d8" />
                  <Text className="text-zinc-400 font-bold uppercase text-xs">
                    {exercise.name}
                  </Text>
                </View>
              )}
            </View>
            <View className="bg-zinc-900/50 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-500 uppercase font-black text-[10px] mb-1">
                Músculo Principal
              </Text>
              <Text className="text-white text-2xl font-black italic uppercase">
                {exercise.muscle_group}
              </Text>
            </View>
          </View>
        )}

        {activeTab === "History" && (
          <View className="p-6">
            {exercise.is_custom === 1 && (
              <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-900 mb-8 flex-row items-center">
                <View className="w-12 h-12 bg-[#E31C25]/10 rounded-2xl items-center justify-center mr-4">
                  <Target color="#E31C25" size={24} />
                </View>
                <View>
                  <Text className="text-zinc-500 uppercase font-black text-[8px]">
                    Muscle Group
                  </Text>
                  <Text className="text-white text-lg font-black italic uppercase">
                    {exercise.muscle_group}
                  </Text>
                </View>
              </View>
            )}
            <View className="items-center justify-center pt-10">
              <Trophy size={48} color="#f59e0b" />
              <Text className="text-white font-black uppercase italic text-lg mt-4">
                Personal Records
              </Text>
              <Text className="text-zinc-500 text-center mt-2 px-6 font-medium">
                Sem histórico disponível.
              </Text>
            </View>
          </View>
        )}

        {activeTab === "How to" && (
          <View className="p-6">
            <View className="flex-row items-center mb-4">
              <BookOpen size={20} color="#E31C25" />
              <Text className="text-white font-black ml-2 uppercase italic text-lg">
                Instruções
              </Text>
            </View>
            <View className="bg-zinc-900/30 p-6 rounded-[30px] border border-zinc-800">
              <Text className="text-zinc-400 leading-6 text-base italic">
                {exercise.instructions || "Sem instruções para este exercício."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
