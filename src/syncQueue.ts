// src/syncQueue.ts
import { SQLiteDatabase } from "expo-sqlite";

const SERVER_URL = "https://teu-servidor.com/api"; // mudar quando tiveres o servidor

// Adiciona um item à fila de sincronização
export const addToSyncQueue = async (
  db: SQLiteDatabase,
  action: string,
  payload: object,
): Promise<void> => {
  await db.runAsync(
    `INSERT INTO sync_queue (action, payload, created_at, attempts, synced)
     VALUES (?, ?, ?, 0, 0)`,
    [action, JSON.stringify(payload), new Date().toISOString()],
  );
  console.log(`📤 [SyncQueue] Item adicionado: ${action}`);
};

// Processa todos os itens pendentes quando há internet
export const processSyncQueue = async (db: SQLiteDatabase): Promise<void> => {
  const pending = await db.getAllAsync<{
    id: number;
    action: string;
    payload: string;
    attempts: number;
  }>(
    "SELECT * FROM sync_queue WHERE synced = 0 AND attempts < 3 ORDER BY created_at ASC",
  );

  if (pending.length === 0) {
    console.log("✅ [SyncQueue] Nada por sincronizar");
    return;
  }

  console.log(`📤 [SyncQueue] A sincronizar ${pending.length} item(s)...`);

  for (const item of pending) {
    try {
      const response = await fetch(`${SERVER_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.action,
          payload: JSON.parse(item.payload),
        }),
      });

      if (response.ok) {
        await db.runAsync("UPDATE sync_queue SET synced = 1 WHERE id = ?", [
          item.id,
        ]);
        console.log(`✅ [SyncQueue] Item ${item.id} sincronizado`);
      } else {
        await db.runAsync(
          "UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?",
          [item.id],
        );
      }
    } catch (e) {
      await db.runAsync(
        "UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?",
        [item.id],
      );
      console.log(
        `⚠️ [SyncQueue] No server yet, item ${item.id} saved for later`,
      );
    }
  }
};
