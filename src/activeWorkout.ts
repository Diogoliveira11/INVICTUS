import { SQLiteDatabase } from "expo-sqlite";

export const saveActiveWorkoutExercises = async (
  db: SQLiteDatabase,
  workoutId: number,
  exercises: any[],
): Promise<void> => {
  await db.runAsync(
    "UPDATE active_workout SET exercises_json = ? WHERE id = ?",
    [JSON.stringify(exercises), workoutId],
  );
};

// Inicia um novo registo de treino ativo na BD
export const createActiveWorkout = async (
  db: SQLiteDatabase,
  routineId: string | null,
  routineName: string,
): Promise<number> => {
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO active_workout (routine_id, routine_name, started_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [routineId, routineName, now, now],
  );
  console.log("[DB] Active workout created, id:", result.lastInsertRowId);
  return result.lastInsertRowId;
};

// Guarda ou atualiza uma série no SQLite
export const upsertActiveWorkoutSet = async (
  db: SQLiteDatabase,
  workoutId: number,
  setData: {
    id: string;
    exerciseId: string;
    exerciseName: string;
    setIndex: number;
    setType: string;
    weight: string;
    reps: string;
    completed: boolean;
    notes: string;
    restTime: number;
  },
): Promise<void> => {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO active_workout_sets
       (id, workout_id, exercise_id, exercise_name, set_index, set_type,
        weight, reps, completed, notes, rest_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      setData.id,
      workoutId,
      setData.exerciseId,
      setData.exerciseName,
      setData.setIndex,
      setData.setType,
      setData.weight,
      setData.reps,
      setData.completed ? 1 : 0,
      setData.notes,
      setData.restTime,
      now,
    ],
  );
  await db.runAsync("UPDATE active_workout SET updated_at = ? WHERE id = ?", [
    now,
    workoutId,
  ]);
};

// Lê o treino ativo da BD (para recuperação após crash)
export const getActiveWorkout = async (db: SQLiteDatabase) => {
  const workout = await db.getFirstAsync<{
    id: number;
    routine_id: string | null;
    routine_name: string;
    started_at: string;
    updated_at: string;
    exercises_json: string | null;
  }>("SELECT * FROM active_workout ORDER BY id DESC LIMIT 1");

  if (!workout) return null;

  const sets = await db.getAllAsync<{
    id: string;
    exercise_id: string;
    exercise_name: string;
    set_index: number;
    set_type: string;
    weight: string;
    reps: string;
    completed: number;
    notes: string;
    rest_time: number;
  }>(
    "SELECT * FROM active_workout_sets WHERE workout_id = ? ORDER BY exercise_id, set_index ASC",
    [workout.id],
  );

  return { workout, sets };
};

// Limpa o treino ativo após o utilizador terminar
export const clearActiveWorkout = async (db: SQLiteDatabase): Promise<void> => {
  await db.runAsync("DELETE FROM active_workout_sets");
  await db.runAsync("DELETE FROM active_workout");
};
