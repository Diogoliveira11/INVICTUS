import AsyncStorage from "@react-native-async-storage/async-storage";
import * as KeepAwake from "expo-keep-awake";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

interface WorkoutSettings {
  keepAwake: boolean;
  defaultRestTimer: number;
}

interface WorkoutSettingsContextType extends WorkoutSettings {
  setKeepAwake: (val: boolean) => Promise<void>;
  setDefaultRestTimer: (val: number) => Promise<void>;
}

const WorkoutSettingsContext = createContext<
  WorkoutSettingsContextType | undefined
>(undefined);

export function WorkoutSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [keepAwake, setKeepAwakeState] = useState(false);
  const [defaultRestTimer, setDefaultRestTimerState] = useState(120);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.multiGet([
        "ws_keepAwake",
        "ws_defaultRestTimer",
      ]);
      const map = Object.fromEntries(saved.map(([k, v]) => [k, v]));

      const ka = map.ws_keepAwake === "true";
      setKeepAwakeState(ka);

      if (map.ws_defaultRestTimer !== null)
        setDefaultRestTimerState(Number(map.ws_defaultRestTimer));

      if (ka) {
        KeepAwake.activateKeepAwakeAsync();
      }
    })();
  }, []);

  const setKeepAwake = useCallback(async (val: boolean) => {
    setKeepAwakeState(val);
    await AsyncStorage.setItem("ws_keepAwake", String(val));
    if (val) {
      await KeepAwake.activateKeepAwakeAsync();
    } else {
      KeepAwake.deactivateKeepAwake();
    }
  }, []);

  const setDefaultRestTimer = useCallback(async (val: number) => {
    setDefaultRestTimerState(val);
    await AsyncStorage.setItem("ws_defaultRestTimer", String(val));
  }, []);

  return (
    <WorkoutSettingsContext.Provider
      value={{
        keepAwake,
        defaultRestTimer,
        setKeepAwake,
        setDefaultRestTimer,
      }}
    >
      {children}
    </WorkoutSettingsContext.Provider>
  );
}

export const useWorkoutSettings = () => {
  const ctx = useContext(WorkoutSettingsContext);
  if (!ctx)
    throw new Error(
      "useWorkoutSettings must be used within WorkoutSettingsProvider",
    );
  return ctx;
};
