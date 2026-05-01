import * as Notifications from "expo-notifications";
import { Trash2 } from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AppState,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

export type SetType = "W" | "1" | "F" | "D";

export type WorkoutSet = {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
  previous?: string;
  suggestedWeight?: string;
  suggestedReps?: string;
};

export type ActiveExercise = {
  id: number;
  logId: string;
  name: string;
  muscle_group?: string;
  image_url?: string;
  notes?: string;
  rest_time: number;
  personalRecords: { weight: number; reps: number }[];
  sets: WorkoutSet[];
};

type WorkoutContextType = {
  isActive: boolean;
  isMinimized: boolean;
  timer: string;
  restTimer: number | null;
  activeRestSetId: string | null;
  exercises: ActiveExercise[];
  lastExercise: string;
  setExercises: React.Dispatch<React.SetStateAction<ActiveExercise[]>>;
  updateSet: (
    exerciseLogId: string,
    setId: string,
    field: "weight" | "reps" | "type",
    value: string,
  ) => void;
  toggleSetCompleted: (exLogId: string, setId: string) => void;
  setIsActive: (val: boolean) => void;
  setIsMinimized: (val: boolean) => void;
  setLastExercise: (val: string) => void;
  stopWorkout: (confirm?: boolean) => void;
  startWorkout: (name: string) => void;
};

// Fora do componente — configura como as notificações se comportam quando a app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [lastExercise, setLastExercise] = useState("");
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const [activeRestSetId, setActiveRestSetId] = useState<string | null>(null);

  const [isDiscardModalVisible, setIsDiscardModalVisible] = useState(false);

  const [restTimer, setRestTimer] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const restIntervalRef = useRef<any>(null);

  // Pedir permissões e criar canal Android
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão de notificações negada");
      }
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("rest-timer", {
          name: "Rest Timer",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 400, 100, 400],
          sound: "default",
        });
      }
    };
    requestPermissions();
  }, []);

  // Timer master — sincroniza duration e rest timer, incluindo ao voltar do background
  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();

      if (endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - now) / 1000);
        if (remaining <= 0) {
          setRestTimer(null);
          setActiveRestSetId(null);
          endTimeRef.current = null;
          Vibration.vibrate([0, 400, 100, 400]);
        } else {
          setRestTimer(remaining);
        }
      }

      if (isActive && startTimeRef.current) {
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setSeconds(elapsed);
      }
    };

    updateTimers();
    const masterInterval = setInterval(updateTimers, 1000);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        updateTimers();
      }
    });

    return () => {
      clearInterval(masterInterval);
      subscription.remove();
    };
  }, [isActive]);

  // Timer de duração do treino
  useEffect(() => {
    let interval: any;
    if (isActive) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - seconds * 1000;
      }
      interval = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor(
            (Date.now() - startTimeRef.current) / 1000,
          );
          setSeconds(elapsed);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);

    if (restTimer !== null && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.round((endTimeRef.current - now) / 1000);
          if (remaining <= 0) {
            setRestTimer(null);
            setActiveRestSetId(null);
            endTimeRef.current = null;
            clearInterval(restIntervalRef.current);
            Vibration.vibrate([0, 400, 100, 400]);
          } else {
            setRestTimer(remaining);
          }
        }
      }, 1000);
    }

    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [restTimer === null, isActive]);

  const scheduleRestNotification = async (secs: number) => {
    const targetTime = Date.now() + secs * 1000;
    endTimeRef.current = targetTime;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rest period over! 🔔",
          body: "Time for the next series.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secs,
          channelId: "rest-timer",
        },
      });
    } catch (e) {
      console.log("Erro ao agendar notificação:", e);
    }
  };

  const toggleSetCompleted = (exLogId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.logId === exLogId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                const newState = !s.completed;
                if (newState && ex.rest_time > 0) {
                  setRestTimer(ex.rest_time);
                  setActiveRestSetId(setId);
                  scheduleRestNotification(ex.rest_time);
                } else if (!newState) {
                  setRestTimer(null);
                  setActiveRestSetId(null);
                  endTimeRef.current = null;
                  if (restIntervalRef.current)
                    clearInterval(restIntervalRef.current);
                  Notifications.cancelAllScheduledNotificationsAsync();
                }
                return { ...s, completed: newState };
              }
              return s;
            }),
          };
        }
        return ex;
      }),
    );
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${mins < 10 && hrs > 0 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  const updateSet = useCallback(
    (logId: string, setId: string, field: any, value: string) => {
      setExercises((prev) => {
        // Encontrar o exercício e o set alvo primeiro
        const exIndex = prev.findIndex((e) => e.logId === logId);
        if (exIndex === -1) return prev;

        const setIndex = prev[exIndex].sets.findIndex((s) => s.id === setId);
        if (setIndex === -1) return prev;

        // Se o valor for exatamente igual ao anterior, não atualiza o estado (evita re-render)
        if (prev[exIndex].sets[setIndex][field as keyof WorkoutSet] === value) {
          return prev;
        }

        const newExercises = [...prev];
        const newSets = [...newExercises[exIndex].sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        newExercises[exIndex] = { ...newExercises[exIndex], sets: newSets };

        return newExercises;
      });
    },
    [],
  );

  const startWorkout = (name: string) => {
    startTimeRef.current = Date.now();
    setSeconds(0);
    setExercises([]);
    setIsActive(true);
    setIsMinimized(false);
    setLastExercise(name);
  };

  const clearWorkoutData = () => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setIsActive(false);
    setIsMinimized(false);
    setExercises([]);
    setSeconds(0);
    startTimeRef.current = null;
    setRestTimer(null);
    setActiveRestSetId(null);
    endTimeRef.current = null;
    setLastExercise("");
    Notifications.cancelAllScheduledNotificationsAsync();
    setIsDiscardModalVisible(false);
  };

  const stopWorkout = (confirm = false) => {
    if (confirm) {
      setIsDiscardModalVisible(true);
    } else {
      clearWorkoutData();
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        isActive,
        activeRestSetId,
        isMinimized,
        timer: formatTime(seconds),
        restTimer,
        exercises,
        lastExercise,
        setExercises,
        updateSet,
        toggleSetCompleted,
        startWorkout,
        stopWorkout,
        setIsMinimized,
        setLastExercise,
        setIsActive,
      }}
    >
      {children}

      <Modal
        visible={isDiscardModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDiscardModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              padding: 32,
              borderRadius: 40,
              borderWidth: 1,
              borderColor: "#27272a",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(227, 28, 37, 0.1)",
                borderRadius: 100,
                marginBottom: 24,
                padding: 16,
              }}
            >
              <Trash2 color="#E31C25" size={32} />
            </View>

            <Text
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "900",
                textTransform: "uppercase",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Discard workout?
            </Text>

            <Text
              style={{
                color: "#71717a",
                fontSize: 14,
                fontWeight: "600",
                textTransform: "uppercase",
                marginBottom: 32,
                textAlign: "center",
              }}
            >
              Are you sure you want to stop? All progress will be lost.
            </Text>

            <View style={{ flexDirection: "row", width: "100%", gap: 16 }}>
              <TouchableOpacity
                onPress={() => setIsDiscardModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#18181b",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#27272a",
                }}
              >
                <Text
                  style={{
                    color: "#a1a1aa",
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearWorkoutData}
                style={{
                  flex: 1,
                  backgroundColor: "#E31C25",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "900",
                    textTransform: "uppercase",
                  }}
                >
                  Discard
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout error");
  return context;
};
