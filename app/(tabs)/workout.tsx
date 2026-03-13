import {
    FolderPlus,
    MoreHorizontal,
    Plus,
    Search
} from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();

  const routines = [
    {
      title: "CHEST | TRICEPS | LATERAL RAISE",
      exercises:
        "Decline Bench Press (Barbell), Iso-Lateral Chest Press (Machine)...",
    },
    {
      title: "HAMSTRINGS | CALVES | QUADRICEPS",
      exercises: "Hip Adduction (Machine), Lying Leg Curl (Machine)...",
    },
    {
      title: "SHOULDERS | ABS",
      exercises:
        "Shoulder Press (Dumbbell), Single Arm Lateral Raise (Cable)...",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: insets.top }}>
      <ScrollView className="px-5">
        <Text className="text-white text-3xl font-bold mt-4">Workout</Text>

        {/* Start Empty Workout Button */}
        <TouchableOpacity className="flex-row items-center justify-center bg-zinc-900/50 py-3 rounded-xl mt-6">
          <Plus size={20} color="white" />
          <Text className="text-white font-semibold ml-2 text-lg">
            Start Empty Workout
          </Text>
        </TouchableOpacity>

        {/* Routines Header */}
        <View className="flex-row justify-between items-center mt-8">
          <Text className="text-white text-2xl font-bold">Routines</Text>
          <FolderPlus size={24} color="white" />
        </View>

        {/* Filter Buttons */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-2.5 rounded-full">
            <Text className="text-white font-bold text-base">New Routine</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-[#E31C25] py-2.5 rounded-full">
            <Search size={18} color="white" />
            <Text className="text-white font-bold text-base ml-2">Explore</Text>
          </TouchableOpacity>
        </View>

        {/* List of Routines */}
        <View className="mt-6 gap-y-4">
          {routines.map((item, index) => (
            <View
              key={index}
              className="bg-zinc-900/80 p-5 rounded-3xl border border-zinc-800"
            >
              <View className="flex-row justify-between items-start">
                <Text className="text-white text-lg font-bold flex-1 mr-4">
                  {item.title}
                </Text>
                <MoreHorizontal size={20} color="#71717a" />
              </View>
              <Text className="text-zinc-500 text-sm mt-1" numberOfLines={2}>
                {item.exercises}
              </Text>

              <TouchableOpacity className="bg-[#E31C25] w-full py-3 rounded-2xl mt-5 items-center">
                <Text className="text-white font-black text-lg">
                  Start Routine
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
