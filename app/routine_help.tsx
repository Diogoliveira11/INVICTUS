import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  RefreshCw,
  Shuffle,
  Target
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const RED = "#E31C25";

type FAQ = {
  question: string;
  answer: string;
};

type Section = {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  faqs: FAQ[];
};

const SECTIONS: Section[] = [
  {
    icon: Target,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.12)",
    title: "What Is a Routine?",
    faqs: [
      {
        question: "What's the difference between a routine and a workout?",
        answer:
          "A workout is a single training session that you log in real time. A routine is a reusable plan — a template of workouts organised by day — that you can repeat week after week. Think of it as your weekly training schedule.",
      },
      {
        question: "Do I need a routine to use INVICTUS?",
        answer:
          "Not at all. You can log individual workouts freely at any time without a routine. Routines are simply there if you want structure and consistency in your training.",
      },
      {
        question: "Can I have more than one routine?",
        answer:
          "Yes. You can create as many routines as you like — for example, a Chest routine, a Back routine, and a Legs routine — and switch between them whenever you want.",
      },
    ],
  },
  {
    icon: Calendar,
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.12)",
    title: "Creating a Routine",
    faqs: [
      {
        question: "How do I create a new routine?",
        answer:
          'Go to the Workouts tab and tap "New Routine". Give it a name (e.g. "Push Pull Legs"), then add the exercices you want to train.',
      },
      {
        question: "Can I modify a session on the fly?",
        answer:
          "No. When you start a session from a routine, you get workout screen where you can´t add, remove, or swap exercises.",
      },
    ],
  },
  {
    icon: Dumbbell,
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.12)",
    title: "Adding Exercises",
    faqs: [
      {
        question: "How do I add exercises to a routine day?",
        answer:
          'Open the day, tap "Add Exercise", then search or browse by muscle group. Tap an exercise to add it. You can add as many exercises as you need.',
      },
      {
        question: "Can I set target sets and reps inside the routine?",
        answer:
          "No. For each exercise in the routine, you cannot set the desired number of sets, number of repetitions, and weight. To do so, you’ll need to start the workout and train",
      },
      {
        question: "What if an exercise I want isn't in the list?",
        answer:
          'You can create a custom exercise. Tap "Create Exercise" at the bottom of the search results, fill in the name, muscle group, and equipment type, and it will be saved to your library.',
      },
    ],
  },
  {
    icon: RefreshCw,
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.12)",
    title: "Managing & Editing",
    faqs: [
      {
        question: "How do I edit an existing routine?",
        answer:
          "Open the “Workouts” section, tap the three dots next to the routine you want to edit, and tap the edit icon (pencil).",
      },
      {
        question: "How do I delete a routine?",
        answer:
          "Open the “Workouts”, tap three dots o the routine you want to Delete. This only deletes the routine template — your past logged workouts are kept.",
      },
      {
        question: "Will editing a routine affect my workout history?",
        answer:
          "No. Your workout history is independent of the routine template. Editing or deleting a routine never changes workouts that have already been logged.",
      },
    ],
  },
  {
    icon: Clock,
    iconColor: "#22d3ee",
    iconBg: "rgba(34,211,238,0.12)",
    title: "Progressive Overload",
    faqs: [
      {
        question: "What is progressive overload?",
        answer:
          "Progressive overload means gradually increasing the stress placed on your muscles over time — by adding weight, reps, sets, or reducing rest time. It is the fundamental principle behind getting stronger and building muscle.",
      },
      {
        question: "How does INVICTUS help me progressively overload?",
        answer:
          "INVICTUS shows your last session's weights and reps for each exercise when you log a workout. Use that as your baseline and aim to beat it — even by one extra rep or 2.5 kg — every session.",
      },
      {
        question: "How often should I increase weight?",
        answer:
          "As a beginner, aim to add weight every session. As an intermediate, every week or two. As an advanced lifter, every training cycle (4–8 weeks). Small consistent increases compound into massive progress over time.",
      },
    ],
  },
  {
    icon: Flame,
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.12)",
    title: "Tips & Best Practices",
    faqs: [
      {
        question: "How long should a workout take?",
        answer:
          "45–75 minutes is the sweet spot for most people. Beyond 90 minutes, fatigue affects performance. If your sessions run too long, reduce rest times or cut volume.",
      },
      {
        question: "Should I warm up before starting?",
        answer:
          "Always. Do 5–10 minutes of light cardio or dynamic stretching, then perform 1–2 warm-up sets for your first exercise. INVICTUS lets you mark sets as Warm-up so they don't count toward your working volume.",
      },
      {
        question: "How long should I rest between sets?",
        answer:
          "For heavy compound lifts (squat, deadlift, bench), rest 2–4 minutes. For isolation exercises (curls, lateral raises), 60–90 seconds is usually sufficient. Use the built-in rest timer in INVICTUS to stay on track.",
      },
      {
        question: "When should I deload?",
        answer:
          "Every 4–8 weeks of hard training, consider a deload week: reduce weight by 40–50% and focus on technique. This lets your joints and nervous system recover and often leads to a performance spike the following week.",
      },
    ],
  },
  {
    icon: Shuffle,
    iconColor: "#86efac",
    iconBg: "rgba(134,239,172,0.12)",
    title: "Common Mistakes",
    faqs: [
      {
        question: "Training the same muscles every day",
        answer:
          "Muscles grow during rest, not during training. Make sure each muscle group has at least 48 hours of recovery before being trained again. Structure your routine so that push and pull muscles are on alternating days.",
      },
      {
        question: "Skipping legs",
        answer:
          "Leg training releases more anabolic hormones than any other muscle group and builds overall athleticism. Include at least one dedicated leg day per week.",
      },
      {
        question: "Changing the routine too often",
        answer:
          "Stick with a routine for at least 8–12 weeks before switching. Progress requires consistency. Constantly changing exercises makes it impossible to track whether you're actually getting stronger.",
      },
      {
        question: "Ignoring form for heavier weight",
        answer:
          "Poor form shifts load to the wrong muscles and risks injury. Record yourself occasionally, film from the side, and use INVICTUS notes to track cues that help you lift with better technique.",
      },
    ],
  },
];

const FAQItem = ({
  faq,
  isOpen,
  onToggle,
  accentColor,
}: {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
  accentColor: string;
}) => (
  <View
    style={{
      borderBottomWidth: 1,
      borderBottomColor: "#1f1f1f",
    }}
  >
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        gap: 12,
      }}
    >
      <Text
        style={{
          color: isOpen ? "#fff" : "#d4d4d8",
          fontSize: 14,
          fontWeight: "700",
          flex: 1,
          lineHeight: 20,
        }}
      >
        {faq.question}
      </Text>
      {isOpen ? (
        <ChevronUp size={18} color={accentColor} strokeWidth={2.5} />
      ) : (
        <ChevronDown size={18} color="#52525b" strokeWidth={2.5} />
      )}
    </TouchableOpacity>

    {isOpen && (
      <View style={{ paddingBottom: 16 }}>
        <View
          style={{
            borderLeftWidth: 2,
            borderLeftColor: accentColor,
            paddingLeft: 14,
          }}
        >
          <Text
            style={{
              color: "#a1a1aa",
              fontSize: 13,
              lineHeight: 21,
              fontWeight: "500",
            }}
          >
            {faq.answer}
          </Text>
        </View>
      </View>
    )}
  </View>
);

const SectionCard = ({ section }: { section: Section }) => {
  const Icon = section.icon;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <View
      style={{
        backgroundColor: "#0f0f0f",
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#1f1f1f",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 20,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: "#1a1a1a",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: section.iconBg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: section.iconColor + "30",
          }}
        >
          <Icon size={20} color={section.iconColor} strokeWidth={2} />
        </View>
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            flex: 1,
          }}
        >
          {section.title}
        </Text>
      </View>

      {/* FAQs */}
      <View style={{ paddingHorizontal: 20 }}>
        {section.faqs.map((faq, i) => (
          <FAQItem
            key={i}
            faq={faq}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
            accentColor={section.iconColor}
          />
        ))}
      </View>
    </View>
  );
};

export default function RoutineHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="pb-3 bg-black flex-row items-center px-4 border-b border-zinc-900"
      >
        <TouchableOpacity
          onPress={() => router.replace("/settings")}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft size={26} color="#fff" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-white text-lg font-bold tracking-wide">
          Routine Help
        </Text>
        <View className="w-9" />
      </View>

      {/* Subtitle */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          Everything About{"\n"}Routines
        </Text>
        <Text
          style={{
            color: "#71717a",
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 20,
          }}
        >
          Tap any question to expand the answer.
        </Text>
      </View>

      {/* Sections */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {SECTIONS.map((section, i) => (
          <SectionCard key={i} section={section} />
        ))}
      </ScrollView>
    </View>
  );
}
