import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { SQLiteDatabase } from "expo-sqlite";

export const exportUserData = async (db: SQLiteDatabase, email: string) => {
  try {
    const user = await db.getFirstAsync<{
      id: number;
      username: string;
      profile_picture: string | null;
      gender: string | null;
      birthday: string | null;
      weight: string | null;
      height: string | null;
      weekly_goal: number | null;
    }>(
      "SELECT id, username, profile_picture, gender, birthday, weight, height, weekly_goal FROM users WHERE email = ?",
      [email],
    );
    if (!user) throw new Error("User not found");

    // user_settings
    const userSettings = await db.getFirstAsync<any>(
      "SELECT * FROM user_settings WHERE user_id = ?",
      [user.id],
    );

    // exercícios custom do utilizador
    const customExercises = await db.getAllAsync<any>(
      "SELECT * FROM exercises WHERE is_custom = 1 AND created_by_user = ?",
      [user.id],
    );

    // routines
    const routines = await db.getAllAsync<any>(
      "SELECT * FROM routines WHERE user_id = ?",
      [user.id],
    );

    const routinesWithDetails = await Promise.all(
      routines.map(async (routine) => {
        const routineExercises = await db.getAllAsync<any>(
          "SELECT * FROM routine_exercises WHERE routine_id = ?",
          [routine.id],
        );
        const routineExercisesWithSets = await Promise.all(
          routineExercises.map(async (re) => {
            const sets = await db.getAllAsync<any>(
              "SELECT * FROM routine_sets WHERE routine_exercise_id = ?",
              [re.id],
            );
            return { ...re, sets };
          }),
        );
        return { ...routine, exercises: routineExercisesWithSets };
      }),
    );

    // workouts
    const workouts = await db.getAllAsync<any>(
      "SELECT * FROM workouts WHERE user_id = ?",
      [user.id],
    );

    const workoutsWithDetails = await Promise.all(
      workouts.map(async (workout) => {
        const exercises = await db.getAllAsync<any>(
          "SELECT * FROM workout_exercises WHERE workout_id = ?",
          [workout.id],
        );
        const exercisesWithSets = await Promise.all(
          exercises.map(async (exercise) => {
            const sets = await db.getAllAsync<any>(
              "SELECT * FROM workout_sets WHERE workout_exercise_id = ?",
              [exercise.id],
            );
            return { ...exercise, sets };
          }),
        );
        return { ...workout, exercises: exercisesWithSets };
      }),
    );

    const exportData = {
      exported_at: new Date().toISOString(),
      version: 2,
      user: {
        username: user.username,
        email,
        profile_picture: user.profile_picture,
        gender: user.gender,
        birthday: user.birthday,
        weight: user.weight,
        height: user.height,
        weekly_goal: user.weekly_goal,
      },
      user_settings: userSettings,
      custom_exercises: customExercises,
      routines: routinesWithDetails,
      workouts: workoutsWithDetails,
    };

    const fileName = `INVICTUS_export_${Date.now()}.json`;
    const filePath = (FileSystem.documentDirectory ?? "") + fileName;

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
    );

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error("Sharing not available");

    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Export INVICTUS Data",
    });
  } catch (e) {
    console.error("Export error:", e);
    throw e;
  }
};

export const importUserData = async (
  db: SQLiteDatabase,
  email: string,
): Promise<void> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const data = JSON.parse(content);

  if (!data.workouts) throw new Error("Invalid file format");

  const user = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE email = ?",
    [email],
  );
  if (!user) throw new Error("User not found");

  // ── 1. Apagar TUDO do utilizador ──

  // workout_sets
  await db.runAsync(
    `DELETE FROM workout_sets WHERE workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = ?
    )`,
    [user.id],
  );
  // workout_exercises
  await db.runAsync(
    `DELETE FROM workout_exercises WHERE workout_id IN (
      SELECT id FROM workouts WHERE user_id = ?
    )`,
    [user.id],
  );
  // workouts
  await db.runAsync("DELETE FROM workouts WHERE user_id = ?", [user.id]);

  // routine_sets
  await db.runAsync(
    `DELETE FROM routine_sets WHERE routine_exercise_id IN (
      SELECT re.id FROM routine_exercises re
      JOIN routines r ON re.routine_id = r.id
      WHERE r.user_id = ?
    )`,
    [user.id],
  );
  // routine_exercises
  await db.runAsync(
    `DELETE FROM routine_exercises WHERE routine_id IN (
      SELECT id FROM routines WHERE user_id = ?
    )`,
    [user.id],
  );
  // routines
  await db.runAsync("DELETE FROM routines WHERE user_id = ?", [user.id]);

  // exercícios custom
  await db.runAsync(
    "DELETE FROM exercises WHERE is_custom = 1 AND created_by_user = ?",
    [user.id],
  );

  // user_settings
  await db.runAsync("DELETE FROM user_settings WHERE user_id = ?", [user.id]);

  // ── 2. Atualizar dados do utilizador (se existirem no ficheiro) ──
  if (data.user) {
    await db.runAsync(
      `UPDATE users SET
        profile_picture = ?,
        gender = ?,
        birthday = ?,
        weight = ?,
        height = ?,
        weekly_goal = ?
      WHERE id = ?`,
      [
        data.user.profile_picture ?? null,
        data.user.gender ?? null,
        data.user.birthday ?? null,
        data.user.weight ?? null,
        data.user.height ?? null,
        data.user.weekly_goal ?? null,
        user.id,
      ],
    );
  }

  // ── 3. Inserir user_settings ──
  if (data.user_settings) {
    const s = data.user_settings;
    await db.runAsync(
      `INSERT INTO user_settings (user_id, weight_unit, height_unit, biometrics_enabled, rest_timer_default, theme)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        s.weight_unit ?? "kg",
        s.height_unit ?? "cm",
        s.biometrics_enabled ?? 0,
        s.rest_timer_default ?? null,
        s.theme ?? "dark",
      ],
    );
  }

  // ── 4. Inserir exercícios custom ──
  const exerciseIdMap: { [oldId: number]: number } = {};

  for (const ex of data.custom_exercises ?? []) {
    await db.runAsync(
      `INSERT INTO exercises (name, image, gif, instructions, muscle_group, equipment, is_custom, created_by_user)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        ex.name,
        ex.image ?? null,
        ex.gif ?? null,
        ex.instructions ?? null,
        ex.muscle_group,
        ex.equipment,
        user.id,
      ],
    );
    const inserted = await db.getFirstAsync<{ id: number }>(
      "SELECT MAX(id) as id FROM exercises WHERE is_custom = 1 AND created_by_user = ?",
      [user.id],
    );
    if (inserted) exerciseIdMap[ex.id] = inserted.id;
  }

  // ── 5. Inserir routines ──
  for (const routine of data.routines ?? []) {
    await db.runAsync(
      `INSERT INTO routines (user_id, name, description) VALUES (?, ?, ?)`,
      [user.id, routine.name, routine.description ?? null],
    );
    const insertedRoutine = await db.getFirstAsync<{ id: number }>(
      "SELECT MAX(id) as id FROM routines WHERE user_id = ?",
      [user.id],
    );
    const newRoutineId = insertedRoutine!.id;

    for (const re of routine.exercises ?? []) {
      const resolvedExId = exerciseIdMap[re.exercise_id] ?? re.exercise_id;
      await db.runAsync(
        `INSERT INTO routine_exercises (exercise_id, routine_id, index_order, rest_duration, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          resolvedExId,
          newRoutineId,
          re.index_order ?? 0,
          re.rest_duration ?? null,
          re.notes ?? null,
        ],
      );
      const insertedRE = await db.getFirstAsync<{ id: number }>(
        "SELECT MAX(id) as id FROM routine_exercises WHERE routine_id = ?",
        [newRoutineId],
      );
      const newREId = insertedRE!.id;

      for (const rs of re.sets ?? []) {
        await db.runAsync(
          `INSERT INTO routine_sets (routine_exercise_id, index_order, set_type, target_reps, target_weight, target_duration)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            newREId,
            rs.index_order ?? 0,
            rs.set_type ?? "1",
            rs.target_reps ?? null,
            rs.target_weight ?? null,
            rs.target_duration ?? null,
          ],
        );
      }
    }
  }

  // ── 6. Inserir workouts ──
  for (const workout of data.workouts) {
    await db.runAsync(
      `INSERT INTO workouts (user_id, date, title, notes, description, total_volume, duration, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        workout.date,
        workout.title,
        workout.notes ?? null,
        workout.description ?? null,
        workout.total_volume ?? 0,
        workout.duration ?? null,
        workout.photo ?? null,
      ],
    );
    const insertedWorkout = await db.getFirstAsync<{ id: number }>(
      "SELECT MAX(id) as id FROM workouts WHERE user_id = ?",
      [user.id],
    );
    const newWorkoutId = insertedWorkout!.id;

    for (const exercise of workout.exercises ?? []) {
      const lastWEx = await db.getFirstAsync<{ id: number }>(
        "SELECT COALESCE(MAX(id), 0) as id FROM workout_exercises",
      );
      const newExerciseId = lastWEx!.id + 1;
      const resolvedExId =
        exerciseIdMap[exercise.exercise_id] ?? exercise.exercise_id;

      await db.runAsync(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, index_order, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          newExerciseId,
          newWorkoutId,
          resolvedExId,
          exercise.index_order ?? 0,
          exercise.notes ?? null,
        ],
      );

      for (const set of exercise.sets ?? []) {
        const lastSet = await db.getFirstAsync<{ id: number }>(
          "SELECT COALESCE(MAX(id), 0) as id FROM workout_sets",
        );
        const newSetId = lastSet!.id + 1;

        await db.runAsync(
          `INSERT INTO workout_sets (id, workout_exercise_id, exercise_id, index_order, set_type, weight, reps, is_personal_record, distance, time)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newSetId,
            newExerciseId,
            resolvedExId,
            set.index_order ?? 0,
            set.set_type ?? "1",
            set.weight ?? 0,
            set.reps ?? 0,
            set.is_personal_record ?? 0,
            set.distance ?? null,
            set.time ?? null,
          ],
        );
      }
    }
  }
};
