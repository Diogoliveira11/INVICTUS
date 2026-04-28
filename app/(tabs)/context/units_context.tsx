import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSQLiteContext } from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";

type WeightUnit = "KG" | "LB";
type HeightUnit = "CM" | "FT";

interface UnitsContextType {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  setHeightUnit: (unit: HeightUnit) => void;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("KG");
  const [heightUnit, setHeightUnitState] = useState<HeightUnit>("CM");

  // Carregar unidades da BD ao iniciar
  useEffect(() => {
    async function loadUnits() {
      try {
        const email = await AsyncStorage.getItem("userEmail");
        if (!email) return;

        const row = await db.getFirstAsync<any>(
          "SELECT weight_unit, height_unit FROM user_settings WHERE user_id = (SELECT id FROM users WHERE email = ?)",
          [email],
        );

        if (row) {
          setWeightUnitState(row.weight_unit as WeightUnit);
          setHeightUnitState(row.height_unit as HeightUnit);
        }
      } catch (e) {
        console.error("Erro ao carregar unidades da BD:", e);
      }
    }
    loadUnits();
  }, [db]);

  const setWeightUnit = async (unit: WeightUnit) => {
    setWeightUnitState(unit);
    const email = await AsyncStorage.getItem("userEmail");
    if (email) {
      await db.runAsync(
        "UPDATE user_settings SET weight_unit = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)",
        [unit, email],
      );
    }
  };

  const setHeightUnit = async (unit: HeightUnit) => {
    setHeightUnitState(unit);
    const email = await AsyncStorage.getItem("userEmail");
    if (email) {
      await db.runAsync(
        "UPDATE user_settings SET height_unit = ? WHERE user_id = (SELECT id FROM users WHERE email = ?)",
        [unit, email],
      );
    }
  };

  return (
    <UnitsContext.Provider
      value={{ weightUnit, heightUnit, setWeightUnit, setHeightUnit }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) throw new Error("useUnits must be used within UnitsProvider");
  return context;
};
