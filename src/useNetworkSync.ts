// src/useNetworkSync.ts
import NetInfo from "@react-native-community/netinfo";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";
import { processSyncQueue } from "./syncQueue";

export const useNetworkSync = () => {
  const db = useSQLiteContext();
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isConnected = state.isConnected && state.isInternetReachable;

      if (isConnected && wasOffline.current) {
        console.log("🌐 Internet restaurada. A sincronizar...");
        await processSyncQueue(db);
      }

      wasOffline.current = !isConnected;
    });

    return () => unsubscribe();
  }, [db]);
};
