import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image"; // Importar para as imagens
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronLeft,
  GripVertical,
  Plus,
  Search,
  Target,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Mapa de imagens locais do projeto
const IMAGE_MAP: { [key: string]: any } = {
  "assets/exercises_images/back_extension.png": require("../../../assets/exercises_images/back_extension.png"),
  "assets/exercises_images/back_extension_machine.png": require("../../../assets/exercises_images/back_extension_machine.png"),
  "assets/exercises_images/back_extension_weighted_hyperextension.png": require("../../../assets/exercises_images/back_extension_weighted_hyperextension.png"),
  "assets/exercises_images/barbell_row.png": require("../../../assets/exercises_images/barbell_row.png"),
  "assets/exercises_images/barbell_shrug.png": require("../../../assets/exercises_images/barbell_shrug.png"),
  "assets/exercises_images/behind_back_wrist_curl_barbell.png": require("../../../assets/exercises_images/behind_back_wrist_curl_barbell.png"),
  "assets/exercises_images/bench_press_barbell.png": require("../../../assets/exercises_images/bench_press_barbell.png"),
  "assets/exercises_images/bench_press_cable.png": require("../../../assets/exercises_images/bench_press_cable.png"),
  "assets/exercises_images/bench_press_dumbbell.png": require("../../../assets/exercises_images/bench_press_dumbbell.png"),
  "assets/exercises_images/bench_press_smith_machine.png": require("../../../assets/exercises_images/bench_press_smith_machine.png"),
  "assets/exercises_images/bicep_curl_barbell.png": require("../../../assets/exercises_images/bicep_curl_barbell.png"),
  "assets/exercises_images/bicep_curl_cable.png": require("../../../assets/exercises_images/bicep_curl_cable.png"),
  "assets/exercises_images/bicep_curl_dumbbell.png": require("../../../assets/exercises_images/bicep_curl_dumbbell.png"),
  "assets/exercises_images/bicep_curl_machine.png": require("../../../assets/exercises_images/bicep_curl_machine.png"),
  "assets/exercises_images/bulgarian_split_squat.png": require("../../../assets/exercises_images/bulgarian_split_squat.png"),
  "assets/exercises_images/butterfly_pec_deck.png": require("../../../assets/exercises_images/butterfly_pec_deck.png"),
  "assets/exercises_images/cable_crunch.png": require("../../../assets/exercises_images/cable_crunch.png"),
  "assets/exercises_images/cable_fly_crossovers.png": require("../../../assets/exercises_images/cable_fly_crossovers.png"),
  "assets/exercises_images/calf_extension_machine.png": require("../../../assets/exercises_images/calf_extension_machine.png"),
  "assets/exercises_images/calf_press_machine.png": require("../../../assets/exercises_images/calf_press_machine.png"),
  "assets/exercises_images/chest_dip_weighted.png": require("../../../assets/exercises_images/chest_dip_weighted.png"),
  "assets/exercises_images/chest_fly_dumbbell.png": require("../../../assets/exercises_images/chest_fly_dumbbell.png"),
  "assets/exercises_images/chest_fly_machine.png": require("../../../assets/exercises_images/chest_fly_machine.png"),
  "assets/exercises_images/chest_press_machine.png": require("../../../assets/exercises_images/chest_press_machine.png"),
  "assets/exercises_images/chin_up.png": require("../../../assets/exercises_images/chin_up.png"),
  "assets/exercises_images/concentration_curl.png": require("../../../assets/exercises_images/concentration_curl.png"),
  "assets/exercises_images/crunch_machine.png": require("../../../assets/exercises_images/crunch_machine.png"),
  "assets/exercises_images/crunch_weighted.png": require("../../../assets/exercises_images/crunch_weighted.png"),
  "assets/exercises_images/deadlift_barbell.png": require("../../../assets/exercises_images/deadlift_barbell.png"),
  "assets/exercises_images/deadlift_dumbbell.png": require("../../../assets/exercises_images/deadlift_dumbbell.png"),
  "assets/exercises_images/deadlift_smith_machine.png": require("../../../assets/exercises_images/deadlift_smith_machine.png"),
  "assets/exercises_images/decline_bench_press_barbell.png": require("../../../assets/exercises_images/decline_bench_press_barbell.png"),
  "assets/exercises_images/decline_bench_press_dumbbell.png": require("../../../assets/exercises_images/decline_bench_press_dumbbell.png"),
  "assets/exercises_images/decline_bench_press_machine.png": require("../../../assets/exercises_images/decline_bench_press_machine.png"),
  "assets/exercises_images/decline_bench_press_smith_machine.png": require("../../../assets/exercises_images/decline_bench_press_smith_machine.png"),
  "assets/exercises_images/decline_chest_fly_dumbbell.png": require("../../../assets/exercises_images/decline_chest_fly_dumbbell.png"),
  "assets/exercises_images/decline_crunch_weighted.png": require("../../../assets/exercises_images/decline_crunch_weighted.png"),
  "assets/exercises_images/dumbbell_row.png": require("../../../assets/exercises_images/dumbbell_row.png"),
  "assets/exercises_images/dumbbell_shrug.png": require("../../../assets/exercises_images/dumbbell_shrug.png"),
  "assets/exercises_images/elliptical_trainer.png": require("../../../assets/exercises_images/elliptical_trainer.png"),
  "assets/exercises_images/ez_bar_biceps_curl.png": require("../../../assets/exercises_images/ez_bar_biceps_curl.png"),
  "assets/exercises_images/full_squat.png": require("../../../assets/exercises_images/full_squat.png"),
  "assets/exercises_images/glute_kickback_machine.png": require("../../../assets/exercises_images/glute_kickback_machine.png"),
  "assets/exercises_images/hack_squat_machine.png": require("../../../assets/exercises_images/hack_squat_machine.png"),
  "assets/exercises_images/hammer_curl_cable.png": require("../../../assets/exercises_images/hammer_curl_cable.png"),
  "assets/exercises_images/hammer_curl_dumbbell.png": require("../../../assets/exercises_images/hammer_curl_dumbbell.png"),
  "assets/exercises_images/hanging_leg_raise.png": require("../../../assets/exercises_images/hanging_leg_raise.png"),
  "assets/exercises_images/hip_abduction_machine.png": require("../../../assets/exercises_images/hip_abduction_machine.png"),
  "assets/exercises_images/hip_adduction_machine.png": require("../../../assets/exercises_images/hip_adduction_machine.png"),
  "assets/exercises_images/hip_thrust_barbell.png": require("../../../assets/exercises_images/hip_thrust_barbell.png"),
  "assets/exercises_images/hip_thrust_machine.png": require("../../../assets/exercises_images/hip_thrust_machine.png"),
  "assets/exercises_images/incline_bench_press_barbell.png": require("../../../assets/exercises_images/incline_bench_press_barbell.png"),
  "assets/exercises_images/incline_bench_press_dumbbell.png": require("../../../assets/exercises_images/incline_bench_press_dumbbell.png"),
  "assets/exercises_images/incline_bench_press_smith_machine.png": require("../../../assets/exercises_images/incline_bench_press_smith_machine.png"),
  "assets/exercises_images/incline_chest_fly_dumbbell.png": require("../../../assets/exercises_images/incline_chest_fly_dumbbell.png"),
  "assets/exercises_images/iso_lateral_chest_press_machine.png": require("../../../assets/exercises_images/iso_lateral_chest_press_machine.png"),
  "assets/exercises_images/iso_lateral_high_row_machine.png": require("../../../assets/exercises_images/iso_lateral_high_row_machine.png"),
  "assets/exercises_images/iso_lateral_row_machine.png": require("../../../assets/exercises_images/iso_lateral_row_machine.png"),
  "assets/exercises_images/lat_pulldown_cable.png": require("../../../assets/exercises_images/lat_pulldown_cable.png"),
  "assets/exercises_images/lat_pulldown_close_grip_cable.png": require("../../../assets/exercises_images/lat_pulldown_close_grip_cable.png"),
  "assets/exercises_images/lat_pulldown_machine.png": require("../../../assets/exercises_images/lat_pulldown_machine.png"),
  "assets/exercises_images/lateral_raise_cable.png": require("../../../assets/exercises_images/lateral_raise_cable.png"),
  "assets/exercises_images/lateral_raise_dumbbell.png": require("../../../assets/exercises_images/lateral_raise_dumbbell.png"),
  "assets/exercises_images/lateral_raise_machine.png": require("../../../assets/exercises_images/lateral_raise_machine.png"),
  "assets/exercises_images/leg_extension_machine.png": require("../../../assets/exercises_images/leg_extension_machine.png"),
  "assets/exercises_images/leg_press_horizontal_machine.png": require("../../../assets/exercises_images/leg_press_horizontal_machine.png"),
  "assets/exercises_images/leg_press_machine.png": require("../../../assets/exercises_images/leg_press_machine.png"),
  "assets/exercises_images/leg_raise_parallel_bars.png": require("../../../assets/exercises_images/leg_raise_parallel_bars.png"),
  "assets/exercises_images/low_cable_fly_crossovers.png": require("../../../assets/exercises_images/low_cable_fly_crossovers.png"),
  "assets/exercises_images/lying_leg_curl_machine.png": require("../../../assets/exercises_images/lying_leg_curl_machine.png"),
  "assets/exercises_images/lying_leg_raise.png": require("../../../assets/exercises_images/lying_leg_raise.png"),
  "assets/exercises_images/overhead_press_barbell.png": require("../../../assets/exercises_images/overhead_press_barbell.png"),
  "assets/exercises_images/overhead_press_dumbbell.png": require("../../../assets/exercises_images/overhead_press_dumbbell.png"),
  "assets/exercises_images/overhead_press_smith_machine.png": require("../../../assets/exercises_images/overhead_press_smith_machine.png"),
  "assets/exercises_images/overhead_triceps_extension_cable.png": require("../../../assets/exercises_images/overhead_triceps_extension_cable.png"),
  "assets/exercises_images/plank.png": require("../../../assets/exercises_images/plank.png"),
  "assets/exercises_images/preacher_curl_barbell.png": require("../../../assets/exercises_images/preacher_curl_barbell.png"),
  "assets/exercises_images/preacher_curl_dumbbell.png": require("../../../assets/exercises_images/preacher_curl_dumbbell.png"),
  "assets/exercises_images/preacher_curl_machine.png": require("../../../assets/exercises_images/preacher_curl_machine.png"),
  "assets/exercises_images/pullover_dumbbell.png": require("../../../assets/exercises_images/pullover_dumbbell.png"),
  "assets/exercises_images/pullover_machine.png": require("../../../assets/exercises_images/pullover_machine.png"),
  "assets/exercises_images/rear_delt_reverse_fly_cable.png": require("../../../assets/exercises_images/rear_delt_reverse_fly_cable.png"),
  "assets/exercises_images/rear_delt_reverse_fly_machine.png": require("../../../assets/exercises_images/rear_delt_reverse_fly_machine.png"),
  "assets/exercises_images/rear_kick_machine.png": require("../../../assets/exercises_images/rear_kick_machine.png"),
  "assets/exercises_images/reverse_fly_single_arm_cable.png": require("../../../assets/exercises_images/reverse_fly_single_arm_cable.png"),
  "assets/exercises_images/reverse_grip_lat_pulldown_cable.png": require("../../../assets/exercises_images/reverse_grip_lat_pulldown_cable.png"),
  "assets/exercises_images/romanian_deadlift_barbell.png": require("../../../assets/exercises_images/romanian_deadlift_barbell.png"),
  "assets/exercises_images/romanian_deadlift_dumbbell.png": require("../../../assets/exercises_images/romanian_deadlift_dumbbell.png"),
  "assets/exercises_images/rope_straight_arm_pulldown.png": require("../../../assets/exercises_images/rope_straight_arm_pulldown.png"),
  "assets/exercises_images/rowing_machine.png": require("../../../assets/exercises_images/rowing_machine.png"),
  "assets/exercises_images/seated_cable_row_bar_wide_grip.png": require("../../../assets/exercises_images/seated_cable_row_bar_wide_grip.png"),
  "assets/exercises_images/seated_cable_row_v_grip.png": require("../../../assets/exercises_images/seated_cable_row_v_grip.png"),
  "assets/exercises_images/seated_calf_raise.png": require("../../../assets/exercises_images/seated_calf_raise.png"),
  "assets/exercises_images/seated_chest_flys_cable.png": require("../../../assets/exercises_images/seated_chest_flys_cable.png"),
  "assets/exercises_images/seated_dip_machine.png": require("../../../assets/exercises_images/seated_dip_machine.png"),
  "assets/exercises_images/seated_leg_curl_machine.png": require("../../../assets/exercises_images/seated_leg_curl_machine.png"),
  "assets/exercises_images/seated_palms_up_wrist_curl.png": require("../../../assets/exercises_images/seated_palms_up_wrist_curl.png"),
  "assets/exercises_images/seated_wrist_extension_barbell.png": require("../../../assets/exercises_images/seated_wrist_extension_barbell.png"),
  "assets/exercises_images/shoulder_press_dumbbell.png": require("../../../assets/exercises_images/shoulder_press_dumbbell.png"),
  "assets/exercises_images/shrug_barbell.png": require("../../../assets/exercises_images/shrug_barbell.png"),
  "assets/exercises_images/shrug_cable.png": require("../../../assets/exercises_images/shrug_cable.png"),
  "assets/exercises_images/shrug_dumbbell.png": require("../../../assets/exercises_images/shrug_dumbbell.png"),
  "assets/exercises_images/side_plank.png": require("../../../assets/exercises_images/side_plank.png"),
  "assets/exercises_images/single_arm_cable_crossover.png": require("../../../assets/exercises_images/single_arm_cable_crossover.png"),
  "assets/exercises_images/single_arm_triceps_pushdown_cable.png": require("../../../assets/exercises_images/single_arm_triceps_pushdown_cable.png"),
  "assets/exercises_images/single_leg_hip_thrust_dumbbell.png": require("../../../assets/exercises_images/single_leg_hip_thrust_dumbbell.png"),
  "assets/exercises_images/single_leg_standing_calf_raise_machine.png": require("../../../assets/exercises_images/single_leg_standing_calf_raise_machine.png"),
  "assets/exercises_images/skullcrusher_barbell.png": require("../../../assets/exercises_images/skullcrusher_barbell.png"),
  "assets/exercises_images/stair_machine_steps.png": require("../../../assets/exercises_images/stair_machine_steps.png"),
  "assets/exercises_images/standing_cable_glute_kickbacks.png": require("../../../assets/exercises_images/standing_cable_glute_kickbacks.png"),
  "assets/exercises_images/standing_calf_raise_machine.png": require("../../../assets/exercises_images/standing_calf_raise_machine.png"),
  "assets/exercises_images/standing_calf_raise_smith.png": require("../../../assets/exercises_images/standing_calf_raise_smith.png"),
  "assets/exercises_images/standing_leg_curls.png": require("../../../assets/exercises_images/standing_leg_curls.png"),
  "assets/exercises_images/straight_arm_lat_pulldown_cable.png": require("../../../assets/exercises_images/straight_arm_lat_pulldown_cable.png"),
  "assets/exercises_images/straight_leg_deadlift.png": require("../../../assets/exercises_images/straight_leg_deadlift.png"),
  "assets/exercises_images/sumo_deadlift.png": require("../../../assets/exercises_images/sumo_deadlift.png"),
  "assets/exercises_images/treadmill.png": require("../../../assets/exercises_images/treadmill.png"),
  "assets/exercises_images/triceps_pushdown.png": require("../../../assets/exercises_images/triceps_pushdown.png"),
  "assets/exercises_images/triceps_rope_pushdown.png": require("../../../assets/exercises_images/triceps_rope_pushdown.png"),
  "assets/exercises_images/upright_row_cable.png": require("../../../assets/exercises_images/upright_row_cable.png"),
  "assets/exercises_images/wrist_roller.png": require("../../../assets/exercises_images/wrist_roller.png"),
};

type Exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  image: string | null;
};

export default function NewRoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const isFocused = useIsFocused();
  const { routineId: rawId, mode: rawMode } = useLocalSearchParams();

  const routineId = Array.isArray(rawId) ? rawId[0] : rawId;
  const mode = Array.isArray(rawMode) ? rawMode[0] : rawMode;

  const [name, setName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dbExercises, setDbExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isFocused && mode !== "edit") {
      setName("");
      setSelectedExercises([]);
    }
  }, [isFocused, mode]);

  useEffect(() => {
    if (mode === "edit" && routineId && isFocused) {
      (async () => {
        try {
          const res = await db.getFirstAsync<{ name: string }>(
            "SELECT name FROM routines WHERE id = ?",
            [Number(routineId)],
          );
          if (res) setName(res.name);

          const exes = await db.getAllAsync<Exercise>(
            `SELECT e.* FROM exercises e 
              JOIN routine_exercises re ON e.id = re.exercise_id 
              WHERE re.routine_id = ? 
              ORDER BY re.index_order ASC`,
            [Number(routineId)],
          );
          setSelectedExercises(exes);
        } catch (error) {
          console.error("Erro ao carregar rotina para edição:", error);
        }
      })();
    }
  }, [routineId, mode, db, isFocused]);

  const fetchModalExercises = useCallback(async () => {
    try {
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      let params: any[] = [];
      if (search.trim()) {
        query += " AND name LIKE ? COLLATE NOCASE";
        params.push(`%${search.trim()}%`);
      }
      query += " ORDER BY name ASC";
      const rows = await db.getAllAsync<Exercise>(query, params);
      setDbExercises(rows);
    } catch (error) {
      console.error("Erro modal:", error);
    }
  }, [search, db]);

  useEffect(() => {
    if (isModalVisible) fetchModalExercises();
  }, [isModalVisible, fetchModalExercises]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Aviso", "Dá um nome à tua rotina.");
    if (selectedExercises.length === 0)
      return Alert.alert("Aviso", "Adiciona exercícios.");

    try {
      const email = await AsyncStorage.getItem("userEmail");
      const userRow = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      const userId = userRow?.id || 1;

      let currentRoutineId: number;

      if (mode === "edit" && routineId) {
        currentRoutineId = Number(routineId);
        await db.runAsync("UPDATE routines SET name = ? WHERE id = ?", [
          name,
          currentRoutineId,
        ]);
        await db.runAsync(
          "DELETE FROM routine_exercises WHERE routine_id = ?",
          [currentRoutineId],
        );
      } else {
        const result = await db.runAsync(
          "INSERT INTO routines (name, user_id) VALUES (?, ?)",
          [name, userId],
        );
        currentRoutineId = result.lastInsertRowId;
      }

      for (let i = 0; i < selectedExercises.length; i++) {
        await db.runAsync(
          "INSERT INTO routine_exercises (exercise_id, routine_id, index_order) VALUES (?, ?, ?)",
          [selectedExercises[i].id, currentRoutineId, i],
        );
      }

      Alert.alert("Sucesso", "Rotina guardada!");
      setName("");
      setSelectedExercises([]);
      router.replace("/workout");
    } catch (e: any) {
      console.error("ERRO AO GRAVAR:", e);
      Alert.alert("Erro", "Falha ao gravar na base de dados.");
    }
  };

  const toggleSelection = (ex: Exercise) => {
    const exists = selectedExercises.find((e) => e.id === ex.id);
    if (exists)
      setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id));
    else setSelectedExercises((prev) => [...prev, ex]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.replace("/workout")}>
          <ChevronLeft size={28} color="#E31C25" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black uppercase italic">
          {mode === "edit" ? "Edit Routine" : "New Routine"}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-[#E31C25] text-lg font-black uppercase italic">
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-5 mt-6" showsVerticalScrollIndicator={false}>
        <TextInput
          placeholder="Routine Name"
          placeholderTextColor="#52525b"
          value={name}
          onChangeText={setName}
          className="text-white text-3xl font-black italic border-b border-zinc-800 pb-3 uppercase"
        />

        <View className="mt-8">
          <Text className="text-zinc-500 font-black uppercase mb-4 tracking-widest text-xs italic">
            Exercises ({selectedExercises.length})
          </Text>

          {selectedExercises.map((ex) => (
            <View
              key={ex.id}
              className="flex-row items-center bg-zinc-900/50 p-4 rounded-2xl mb-3 border border-zinc-800"
            >
              <GripVertical size={20} color="#3f3f46" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold uppercase italic">
                  {ex.name}
                </Text>
                <Text className="text-zinc-500 text-xs uppercase">
                  {ex.muscle_group}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleSelection(ex)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="flex-row items-center justify-center bg-zinc-900/30 border-2 border-dashed border-zinc-800 py-6 rounded-2xl mt-2"
          >
            <Plus size={22} color="#E31C25" />
            <Text className="text-zinc-400 font-black ml-2 text-lg uppercase italic">
              Add Exercises
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE SELEÇÃO - ESTILO EXPLORE/HEVY */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-[#000]">
          <View className="flex-1 px-6 pt-4">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X color="white" size={26} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-black uppercase italic">
                Select Exercises
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text className="text-[#E31C25] text-lg font-black uppercase italic">
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 h-12 mb-6 border border-zinc-800">
              <Search color="#52525b" size={20} className="mr-3" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search exercise..."
                placeholderTextColor="#52525b"
                className="flex-1 text-white font-bold italic"
              />
            </View>

            <FlatList
              data={dbExercises}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedExercises.some(
                  (e) => e.id === item.id,
                );
                const imageKey = item.image?.trim();
                const isCustomImage =
                  imageKey?.startsWith("file://") ||
                  imageKey?.startsWith("http");
                const imageSource = isCustomImage
                  ? { uri: imageKey }
                  : imageKey
                    ? IMAGE_MAP[imageKey]
                    : null;

                return (
                  <View className="flex-row items-center py-4 border-b border-zinc-900">
                    {/* ESQUERDA: Clique para Detalhes */}
                    <TouchableOpacity
                      className="flex-1 flex-row items-center"
                      onPress={() => {
                        setIsModalVisible(false);
                        router.push({
                          pathname: "/workout/[id]",
                          params: { id: item.id, from: "new_routine" },
                        });
                      }}
                    >
                      <View className="w-14 h-14 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
                        {imageSource ? (
                          <Image
                            source={imageSource}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Target size={24} color="#E31C25" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-black italic uppercase ${isSelected ? "text-[#E31C25]" : "text-white"}`}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-zinc-500 text-xs uppercase italic">
                          {item.muscle_group}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* DIREITA: Bola para selecionar */}
                    <TouchableOpacity
                      onPress={() => toggleSelection(item)}
                      className="w-12 h-12 items-center justify-center"
                    >
                      <View
                        className={`w-7 h-7 rounded-full items-center justify-center border-2 ${
                          isSelected
                            ? "bg-[#E31C25] border-[#E31C25]"
                            : "border-zinc-800"
                        }`}
                      >
                        {isSelected && (
                          <Check color="white" size={14} strokeWidth={4} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
