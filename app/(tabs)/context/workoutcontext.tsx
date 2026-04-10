import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Vibration } from "react-native";

export type SetType = "W" | "1" | "F" | "D";
export type SetEntry = {
  id: string;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
  previous?: string;
};
export type ActiveExercise = {
  logId: string;
  id: number;
  name: string;
  sets: SetEntry[];
};

type WorkoutContextType = {
  isActive: boolean;
  isMinimized: boolean;
  timer: string;
  restTimer: number | null;
  exercises: ActiveExercise[];
  lastExercise: string; // Adiciona se faltar
  setExercises: React.Dispatch<React.SetStateAction<ActiveExercise[]>>;
  updateSet: (
    exLogId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => void;
  toggleSetCompleted: (exLogId: string, setId: string) => void;
  setIsActive: (val: boolean) => void;
  setIsMinimized: (val: boolean) => void;
  setLastExercise: (val: string) => void;
  stopWorkout: (confirm?: boolean) => void;
  startWorkout: (name: string) => void; //
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [lastExercise, setLastExercise] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState("00:00");
  const [restTimer, setRestTimer] = useState<number | null>(null);

  // Cronómetro de Treino
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    } else {
      setSeconds(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Cronómetro de Descanso (Regressivo)
  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(
        () => setRestTimer((prev) => (prev !== null ? prev - 1 : null)),
        1000,
      );
    } else if (restTimer === 0) {
      Vibration.vibrate([0, 500, 200, 500]);
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    setTimer(`${m}:${s}`);
  }, [seconds]);

  const updateSet = (
    exLogId: string,
    setId: string,
    field: "weight" | "reps",
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.logId === exLogId
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

  const toggleSetCompleted = (exLogId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.logId === exLogId) {
          return {
            ...ex,
            sets: ex.sets.map((s) => {
              if (s.id === setId) {
                const newState = !s.completed;
                if (newState) setRestTimer(90); // Ativa descanso de 90s ao marcar como feito
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
      Alert.alert(
        "Descartar Treino?",
        "Tens a certeza? Todos os dados serão perdidos.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: clear },
        ],
      );
    } else {
      clear();
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        isActive,
        isMinimized,
        timer,
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
