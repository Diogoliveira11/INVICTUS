import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, AppState } from "react-native";

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

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [lastExercise, setLastExercise] = useState("");
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const [restTimer, setRestTimer] = useState<number | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.round((endTimeRef.current - now) / 1000);
        if (remaining > 0) {
          setRestTimer(remaining);
        } else {
          setRestTimer(null);
          endTimeRef.current = null;
        }
      }
    });
    return () => subscription.remove();
  }, []);

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
    } else {
      clearInterval(interval);
      startTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev && prev > 1) return prev - 1;
          endTimeRef.current = null;
          return null;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const scheduleRestNotification = async (secs: number) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    endTimeRef.current = Date.now() + secs * 1000;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rest period over! 🔔",
        body: "Time for the next series.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secs,
      },
    });
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
                  scheduleRestNotification(ex.rest_time);
                } else if (!newState) {
                  setRestTimer(null);
                  endTimeRef.current = null;
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

  const updateSet = (
    logId: string,
    setId: string,
    field: any,
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.logId === logId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const startWorkout = (name: string) => {
    startTimeRef.current = Date.now();
    setSeconds(0);
    setExercises([]);
    setIsActive(true);
    setIsMinimized(false);
    setLastExercise(name);
  };

  const stopWorkout = (confirm = false) => {
    const clear = () => {
      setIsActive(false);
      setIsMinimized(false);
      setExercises([]);
      setSeconds(0);
      startTimeRef.current = null;
      setRestTimer(null);
      endTimeRef.current = null;
      setLastExercise("");
      Notifications.cancelAllScheduledNotificationsAsync();
    };
    if (confirm)
      Alert.alert("Descartar Treino?", "Tens a certeza?", [
        { text: "Cancelar" },
        { text: "Descartar", style: "destructive", onPress: clear },
      ]);
    else clear();
  };

  return (
    <WorkoutContext.Provider
      value={{
        isActive,
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
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout error");
  return context;
};
