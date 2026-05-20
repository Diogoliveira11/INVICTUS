import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Dumbbell,
  HelpCircle,
  Lock,
  Search,
  Settings,
  Smartphone,
  Star,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RED = "#E31C25";

type FAQ = {
  question: string;
  answer: string;
  tags: string[];
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
    icon: User,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.12)",
    title: "Account",
    faqs: [
      {
        question: "How do I create an account?",
        answer:
          "Open INVICTUS and tap 'Sign Up' on the welcome screen. Enter your name, email address, and a password. You'll be logged in immediately — no email verification required.",
        tags: ["account", "sign up", "register", "create"],
      },
      {
        question: "How do I change my email or password?",
        answer:
          "Go to Settings → Account. From there you can update your display name, email address, and password at any time.",
        tags: ["account", "email", "password", "change", "update"],
      },
      {
        question: "I forgot my password. What do I do?",
        answer:
          "On the login screen, tap 'Forgot Password'. Enter your email address and you'll receive a link to reset your password.",
        tags: ["password", "forgot", "reset", "login"],
      },
      {
        question: "Can I use INVICTUS on multiple devices?",
        answer:
          "Yes. Log in with the same credentials on any device. Your data is tied to your account, so everything syncs automatically.",
        tags: ["devices", "multiple", "sync", "account"],
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to Settings → Account and scroll to the bottom. Tap 'Delete Account'. This action is permanent and will erase all your data. We recommend exporting your data first.",
        tags: ["account", "delete", "remove", "erase"],
      },
    ],
  },
  {
    icon: Dumbbell,
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.12)",
    title: "Workouts",
    faqs: [
      {
        question: "How do I log a workout?",
        answer:
          "Tap the '+' button on the home screen to start a new workout. Add exercises, log your sets with weight and reps, and tap 'Finish Workout' when done.",
        tags: ["workout", "log", "start", "new"],
      },
      {
        question: "Can I edit a workout after finishing it?",
        answer:
          "Yes. Open your workout history, tap the workout you want to edit, and tap the edit icon. You can modify sets, reps, weights, notes, and the workout title.",
        tags: ["workout", "edit", "history", "change"],
      },
      {
        question: "How do I delete a workout from my history?",
        answer:
          "Open the workout in your history, tap the options menu (⋯) in the top right, and select Delete. This cannot be undone.",
        tags: ["workout", "delete", "history", "remove"],
      },
      {
        question: "What is a superset and how do I log one?",
        answer:
          "A superset is two exercises performed back-to-back with no rest. To log one, add both exercises to your workout, then press and hold the first exercise and select 'Pair as Superset' to link them together.",
        tags: ["superset", "exercises", "pair", "back to back"],
      },
      {
        question: "What are the different set types?",
        answer:
          "INVICTUS supports four set types:\n\n• Normal — a standard working set.\n• Warm-up — not counted toward your total volume.\n• Drop set — performed immediately after a working set at a lower weight.\n• Failure — a set taken to muscular failure.\n\nTap the set type label to cycle between them.",
        tags: ["set", "types", "warmup", "drop set", "failure", "normal"],
      },
      {
        question: "How does the rest timer work?",
        answer:
          "After logging a set, the rest timer starts automatically. You can configure the default rest time in Settings → Workouts. Tap the timer on screen to adjust it mid-workout.",
        tags: ["rest", "timer", "settings", "countdown"],
      },
      {
        question: "What does total volume mean?",
        answer:
          "Total volume is calculated as sets × reps × weight for all working sets in a workout. It is a useful way to measure overall training load over time.",
        tags: ["volume", "sets", "reps", "weight", "total"],
      },
    ],
  },
  {
    icon: Star,
    iconColor: "#facc15",
    iconBg: "rgba(250,204,21,0.12)",
    title: "Personal Records",
    faqs: [
      {
        question: "What counts as a personal record (PR)?",
        answer:
          "A PR is automatically detected whenever you log a single set with the highest weight × reps combination ever recorded for that exercise. INVICTUS highlights it with a trophy icon immediately after logging.",
        tags: ["pr", "personal record", "best", "record", "trophy"],
      },
      {
        question: "Where can I see all my personal records?",
        answer:
          "Go to the Stats tab and select an exercise to view its full PR history, including the date and session in which each record was set.",
        tags: ["pr", "records", "stats", "history"],
      },
      {
        question: "Can I manually set or override a PR?",
        answer:
          "PRs are detected automatically and cannot be manually edited. If you believe a PR was missed, check that the set was logged correctly with the right weight and reps.",
        tags: ["pr", "manual", "override", "edit"],
      },
    ],
  },
  {
    icon: BarChart2,
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.12)",
    title: "Stats & Progress",
    faqs: [
      {
        question: "Where can I see my progress over time?",
        answer:
          "Open the Stats tab. You'll find charts for total volume, workout frequency, and strength progression per exercise. Tap any exercise in your history to see its weight and rep trends.",
        tags: ["stats", "progress", "charts", "volume", "history"],
      },
      {
        question: "How far back does my history go?",
        answer:
          "Your entire workout history is stored locally on your device from the very first session you log. There is no limit to how far back you can view.",
        tags: ["history", "stats", "old", "data"],
      },
      {
        question: "Can I filter stats by date range?",
        answer:
          "Yes. On the Stats screen, tap the date range selector at the top to filter by the last 7 days, 30 days, 3 months, 6 months, or all time.",
        tags: ["stats", "filter", "date", "range"],
      },
    ],
  },
  {
    icon: Settings,
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.12)",
    title: "Settings & Preferences",
    faqs: [
      {
        question: "How do I change weight units (kg / lbs)?",
        answer:
          "Go to Settings → Units and toggle between kilograms and pounds. All existing and future weights will be converted automatically.",
        tags: ["units", "kg", "lbs", "weight", "settings"],
      },
      {
        question: "How do I change distance units (km / mi)?",
        answer:
          "Go to Settings → Units and switch between kilometres and miles. This affects distance-based exercises like running or cycling.",
        tags: ["units", "km", "miles", "distance", "settings"],
      },
      {
        question: "Can I customise the default rest time?",
        answer:
          "Yes. Go to Settings → Workouts and set your preferred default rest duration. You can still adjust it manually during any workout session.",
        tags: ["rest", "timer", "default", "settings", "workouts"],
      },
      {
        question: "How do I turn off automatic rest timer?",
        answer:
          "Go to Settings → Workouts and toggle off 'Auto-start Rest Timer'. The timer will no longer launch automatically after each set.",
        tags: ["rest", "timer", "auto", "off", "settings"],
      },
    ],
  },
  {
    icon: Lock,
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.12)",
    title: "Data & Privacy",
    faqs: [
      {
        question: "Where is my data stored?",
        answer:
          "All your workout data is stored locally on your device using an encrypted SQLite database. Nothing is sent to external servers without your explicit action.",
        tags: ["data", "storage", "local", "privacy", "sqlite"],
      },
      {
        question: "How do I back up my data?",
        answer:
          "Go to Settings → Export Data. INVICTUS will generate a JSON file containing all your workouts, exercises, and sets. Save this file to iCloud, Google Drive, or any other location of your choice.",
        tags: ["backup", "export", "data", "json", "save"],
      },
      {
        question: "How do I restore from a backup?",
        answer:
          "Go to Settings → Import Data and select your previously exported JSON file. Warning: this will replace all current workout data with the contents of the file.",
        tags: ["restore", "import", "backup", "data", "json"],
      },
      {
        question: "What happens to my data if I uninstall the app?",
        answer:
          "Uninstalling INVICTUS will delete all locally stored data permanently. Always export your data before uninstalling if you want to keep your history.",
        tags: ["uninstall", "data", "delete", "loss", "backup"],
      },
      {
        question: "Does INVICTUS share my data with third parties?",
        answer:
          "No. INVICTUS does not sell, share, or transmit your personal data to any third party. Your training data stays on your device.",
        tags: ["privacy", "data", "third party", "share", "sell"],
      },
    ],
  },
  {
    icon: Smartphone,
    iconColor: "#22d3ee",
    iconBg: "rgba(34,211,238,0.12)",
    title: "Technical",
    faqs: [
      {
        question: "The app crashed. What should I do?",
        answer:
          "Try closing and reopening the app. If the issue persists, restart your device. If it still crashes, contact us via Settings → Contact Us with a description of what you were doing when it crashed.",
        tags: ["crash", "bug", "error", "restart", "technical"],
      },
      {
        question: "The app is running slowly. How do I fix it?",
        answer:
          "Close background apps and restart INVICTUS. If your workout history is very large, some screens may take slightly longer to load — this is normal. Make sure your device OS is up to date.",
        tags: ["slow", "performance", "lag", "technical"],
      },
      {
        question: "Why are my weights showing in the wrong unit?",
        answer:
          "Go to Settings → Units and confirm the correct unit is selected. If you recently changed units, reload the app to make sure all screens have updated.",
        tags: ["units", "weight", "wrong", "bug", "technical"],
      },
      {
        question: "Is INVICTUS available on Android and iOS?",
        answer:
          "Yes. INVICTUS is available on both iOS (iPhone and iPad) and Android devices. Download it from the App Store or Google Play.",
        tags: ["android", "ios", "download", "availability", "platform"],
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
  <View style={{ borderBottomWidth: 1, borderBottomColor: "#1a1a1a" }}>
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

const SectionCard = ({
  section,
  filtered,
}: {
  section: Section;
  filtered: FAQ[];
}) => {
  const Icon = section.icon;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (filtered.length === 0) return null;

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
      {/* Header */}
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
        <View
          style={{
            backgroundColor: "#1f1f1f",
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: "#71717a", fontSize: 11, fontWeight: "800" }}>
            {filtered.length}
          </Text>
        </View>
      </View>

      {/* FAQs */}
      <View style={{ paddingHorizontal: 20 }}>
        {filtered.map((faq, i) => (
          <FAQItem
            key={i}
            faq={faq}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
            accentColor={section.iconColor}
          />
        ))}
      </View>
    </View>
  );
};

export default function FAQScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const normalised = query.toLowerCase().trim();

  const getFiltered = (section: Section): FAQ[] => {
    if (!normalised) return section.faqs;
    return section.faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(normalised) ||
        faq.answer.toLowerCase().includes(normalised) ||
        faq.tags.some((t) => t.includes(normalised)),
    );
  };

  const totalResults = SECTIONS.reduce(
    (acc, s) => acc + getFiltered(s).length,
    0,
  );

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
          FAQ
        </Text>
        <View className="w-9" />
      </View>

      {/* Title + search */}
      <View
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
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
          Frequently Asked{"\n"}Questions
        </Text>
        <Text
          style={{
            color: "#71717a",
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 20,
            marginBottom: 16,
          }}
        >
          Can´t find your answer? Contact us via Settings → Contact Us.
        </Text>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#0f0f0f",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: query ? RED : "#27272a",
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 10,
          }}
        >
          <Search size={18} color={query ? RED : "#52525b"} strokeWidth={2.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions..."
            placeholderTextColor="#52525b"
            style={{
              flex: 1,
              color: "#fff",
              fontSize: 14,
              fontWeight: "600",
              padding: 0,
            }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={{ color: "#52525b", fontSize: 18, lineHeight: 20 }}>
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Result count when searching */}
        {normalised.length > 0 && (
          <Text
            style={{
              color: totalResults > 0 ? RED : "#71717a",
              fontSize: 12,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 10,
            }}
          >
            {totalResults > 0
              ? `${totalResults} result${totalResults !== 1 ? "s" : ""} found`
              : "No results found"}
          </Text>
        )}
      </View>

      {/* Sections */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {totalResults === 0 && normalised.length > 0 ? (
          <View style={{ alignItems: "center", paddingTop: 48, gap: 12 }}>
            <HelpCircle size={48} color="#27272a" strokeWidth={1.5} />
            <Text
              style={{
                color: "#52525b",
                fontSize: 14,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              No questions match {query}.{"\n"}Try a different search term.
            </Text>
          </View>
        ) : (
          SECTIONS.map((section, i) => (
            <SectionCard
              key={i}
              section={section}
              filtered={getFiltered(section)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
