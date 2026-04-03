import React, { createContext, useContext, useEffect, useState } from "react";

type WorkoutContextType = {
  isActive: boolean;
  isMinimized: boolean;
  timer: string;
  lastExercise: string;
  setIsActive: (val: boolean) => void;
  setIsMinimized: (val: boolean) => void;
  setLastExercise: (val: string) => void;
  stopWorkout: () => void;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastExercise, setLastExercise] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState("00:00");

  // Cronómetro Global
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Formatar tempo sempre que os segundos mudam
  useEffect(() => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    setTimer(`${m}:${s}`);
  }, [seconds]);

  const stopWorkout = () => {
    setIsActive(false);
    setIsMinimized(false);
    setSeconds(0);
  };

  return (
    <WorkoutContext.Provider
      value={{
        isActive,
        isMinimized,
        timer,
        lastExercise,
        setIsActive,
        setIsMinimized,
        setLastExercise,
        stopWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context)
    throw new Error("useWorkout deve ser usado dentro de WorkoutProvider");
  return context;
};
