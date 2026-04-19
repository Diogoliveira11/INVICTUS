import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

export type SetType = "W" | "1" | "F" | "D";

export type WorkoutSet = {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
  previous?: string;
  suggestedWeight?: string; // NOVO
  suggestedReps?: string; // NOVO
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
  const [restTimer, setRestTimer] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const finalMins = hrs === 0 && mins < 10 ? `0${mins}` : mins;
    return `${hrs > 0 ? hrs + ":" : ""}${hrs > 0 && mins < 10 ? "0" + mins : finalMins}:${secs < 10 ? "0" + secs : secs}`;
  };

  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(
        () => setRestTimer((prev) => (prev !== null ? prev - 1 : null)),
        1000,
      );
    } else if (restTimer === 0) {
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const updateSet = (
    exerciseLogId: string,
    setId: string,
    field: "weight" | "reps" | "type",
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.logId === exerciseLogId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : ex,
      ),
    );
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
                if (newState && ex.rest_time > 0) setRestTimer(ex.rest_time);
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

  const startWorkout = (name: string) => {
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
      setRestTimer(null);
    };
    if (confirm) {
      Alert.alert("Descartar Treino?", "Tens a certeza?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: clear },
      ]);
    } else {
      clear();
    }
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
