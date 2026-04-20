import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Target,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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

export default function ExploreExercisesPage() {
  const router = useRouter();
  const db = useSQLiteContext();
  const isFocused = useIsFocused();

  const [search, setSearch] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [muscleOptions, setMuscleOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"muscle" | "equipment">("muscle");

  const fetchFilterOptions = useCallback(async () => {
    try {
      const muscles = await db.getAllAsync<{ muscle_group: string }>(
        "SELECT DISTINCT muscle_group FROM exercises WHERE muscle_group IS NOT NULL ORDER BY muscle_group ASC",
      );
      setMuscleOptions(muscles.map((m) => m.muscle_group));

      const equipment = await db.getAllAsync<{ equipment: string }>(
        "SELECT DISTINCT equipment FROM exercises WHERE equipment IS NOT NULL ORDER BY equipment ASC",
      );
      setEquipmentOptions(equipment.map((e) => e.equipment));
    } catch (e) {
      console.error("Erro ao carregar filtros:", e);
    }
  }, [db]);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      let query =
        "SELECT id, name, muscle_group, equipment, image FROM exercises WHERE 1=1";
      const params: any[] = [];

      if (search.trim()) {
        query += " AND name LIKE ? COLLATE NOCASE";
        params.push(`%${search.trim()}%`);
      }
      if (selectedMuscle) {
        query += " AND muscle_group = ?";
        params.push(selectedMuscle);
      }
      if (selectedEquipment) {
        query += " AND equipment = ?";
        params.push(selectedEquipment);
      }

      query += " ORDER BY name ASC";
      const allRows = await db.getAllAsync<Exercise>(query, params);
      setExercises(allRows);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoading(false);
    }
  }, [db, search, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    if (isFocused) {
      fetchFilterOptions();
      fetchExercises();
    }
  }, [isFocused, fetchFilterOptions, fetchExercises]);

  const selectFilterOption = (option: string | null) => {
    if (modalType === "muscle") setSelectedMuscle(option);
    else setSelectedEquipment(option);
    setIsModalVisible(false);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const imageKey = item.image?.trim();
    const isCustomImage =
      imageKey?.startsWith("file://") || imageKey?.startsWith("http");
    const imageSource = isCustomImage
      ? { uri: imageKey }
      : imageKey
        ? IMAGE_MAP[imageKey]
        : null;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center py-4 border-b border-zinc-800/50"
        onPress={() =>
          router.push({
            pathname: "/workout/[id]",
            params: { id: item.id, from: "explore" }, // Corrigido: from: explore aqui
          })
        }
      >
        <View className="w-16 h-16 rounded-2xl bg-zinc-900 items-center justify-center mr-4 border border-zinc-800 overflow-hidden">
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <Target size={26} color="#E31C25" />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-white text-[16px] font-bold uppercase italic">
            {item.name}
          </Text>
          <Text className="text-zinc-500 text-xs mt-1 uppercase font-medium">
            {item.muscle_group} • {item.equipment}
          </Text>
        </View>

        <ChevronRight color="#3f3f46" size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#000]">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 px-5 pt-4">
        {/* Header Corrigido */}
        <View className="flex-row items-center justify-between py-4 border-b border-zinc-900 mb-4">
          <TouchableOpacity onPress={() => router.replace("/workout")}>
            <ChevronLeft size={28} color="#E31C25" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-black uppercase italic">
            Explore
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/createexercise")}
            className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 flex-row items-center"
          >
            <Plus size={16} color="#E31C25" />
            <Text className="text-white font-black uppercase italic text-xs ml-1">
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-zinc-900/50 rounded-2xl px-4 h-14 mb-4 border border-zinc-800">
          <Search color="#52525b" size={20} className="mr-3" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#52525b"
            className="flex-1 text-white text-base font-bold italic"
            selectionColor="#E31C25"
          />
        </View>

        {/* Filters */}
        <View className="flex-row justify-between mb-6 gap-x-3">
          <TouchableOpacity
            onPress={() => {
              setModalType("equipment");
              setIsModalVisible(true);
            }}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 px-4 ${selectedEquipment ? "bg-[#E31C25]" : "bg-zinc-900"}`}
          >
            <Text
              numberOfLines={1}
              className="text-white text-[10px] font-black uppercase italic mr-2 flex-shrink"
            >
              {selectedEquipment || "Equipment"}
            </Text>
            <ChevronDown color="white" size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setModalType("muscle");
              setIsModalVisible(true);
            }}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 px-4 ${selectedMuscle ? "bg-[#E31C25]" : "bg-zinc-900"}`}
          >
            <Text
              numberOfLines={1}
              className="text-white text-[10px] font-black uppercase italic mr-2 flex-shrink"
            >
              {selectedMuscle || "Muscles"}
            </Text>
            <ChevronDown color="white" size={14} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#E31C25" size="large" className="mt-20" />
        ) : (
          <FlatList
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text className="text-zinc-600 text-center mt-20 uppercase font-bold italic">
                No exercises found
              </Text>
            }
          />
        )}
      </View>

      {/* Modal de Filtros */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/80 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#121212] rounded-t-[40px] min-h-[50%] p-8 border-t border-zinc-800">
                <View className="w-12 h-1 bg-zinc-800 rounded-full self-center mb-6" />
                <Text className="text-white text-xl font-black uppercase italic mb-6">
                  {modalType === "muscle" ? "Muscles" : "Equipment"}
                </Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => selectFilterOption(null)}
                    className="flex-row items-center py-4 border-b border-zinc-900"
                  >
                    <Text className="text-white text-lg flex-1 font-bold italic uppercase">
                      All
                    </Text>
                    {(modalType === "muscle"
                      ? !selectedMuscle
                      : !selectedEquipment) && (
                      <Check color="#E31C25" size={24} />
                    )}
                  </TouchableOpacity>

                  {(modalType === "muscle"
                    ? muscleOptions
                    : equipmentOptions
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => selectFilterOption(opt)}
                      className="flex-row items-center py-4 border-b border-zinc-900"
                    >
                      <Text className="text-white text-lg flex-1 font-bold italic uppercase">
                        {opt}
                      </Text>
                      {(modalType === "muscle"
                        ? selectedMuscle
                        : selectedEquipment) === opt && (
                        <Check color="#E31C25" size={24} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
