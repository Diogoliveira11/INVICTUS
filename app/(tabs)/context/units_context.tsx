import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type WeightUnit = "KG" | "LB";
type HeightUnit = "CM" | "FT";

interface UnitsContextType {
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  setWeightUnit: (u: WeightUnit) => void;
  setHeightUnit: (u: HeightUnit) => void;
}

const UnitsContext = createContext<UnitsContextType>({
  weightUnit: "KG",
  heightUnit: "CM",
  setWeightUnit: () => {},
  setHeightUnit: () => {},
});

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("KG");
  const [heightUnit, setHeightUnitState] = useState<HeightUnit>("CM");

  useEffect(() => {
    async function load() {
      const wu = await AsyncStorage.getItem("userWeightUnit");
      const hu = await AsyncStorage.getItem("userHeightUnit");
      if (wu === "KG" || wu === "LB") setWeightUnitState(wu);
      if (hu === "CM" || hu === "FT") setHeightUnitState(hu);
    }
    load();
  }, []);

  const setWeightUnit = async (u: WeightUnit) => {
    setWeightUnitState(u);
    await AsyncStorage.setItem("userWeightUnit", u);
  };

  const setHeightUnit = async (u: HeightUnit) => {
    setHeightUnitState(u);
    await AsyncStorage.setItem("userHeightUnit", u);
  };

  return (
    <UnitsContext.Provider
      value={{ weightUnit, heightUnit, setWeightUnit, setHeightUnit }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export const useUnits = () => useContext(UnitsContext);
