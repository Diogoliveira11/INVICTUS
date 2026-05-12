import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { SQLiteDatabase } from "expo-sqlite";
import { Alert } from "react-native";

export const exportUserData = async (db: SQLiteDatabase, email: string) => {
  try {
    const user = await db.getFirstAsync<{ id: number; username: string }>(
      "SELECT id, username FROM users WHERE email = ?",
      [email],
    );
    if (!user) throw new Error("User not found");

    const workouts = await db.getAllAsync<any>(
      "SELECT * FROM workouts WHERE user_id = ?",
      [user.id],
    );

    const workoutsWithDetails = await Promise.all(
      workouts.map(async (workout) => {
        const exercises = await db.getAllAsync<any>(
          `SELECT we.*, e.name as exercise_name 
           FROM workout_exercises we 
           LEFT JOIN exercises e ON we.exercise_id = e.id 
           WHERE we.workout_id = ?`,
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
      user: { username: user.username, email },
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

export const importUserData = async (db: SQLiteDatabase, email: string) => {
  return new Promise<void>((resolve, reject) => {
    Alert.alert(
      "Import Data",
      "This will replace all your current workout data. Are you sure?",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve() },
        {
          text: "Replace",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
                copyToCacheDirectory: true,
              });

              if (result.canceled) return resolve();

              const fileUri = result.assets[0].uri;
              const content = await FileSystem.readAsStringAsync(fileUri);
              const data = JSON.parse(content);

              if (!data.workouts) throw new Error("Invalid file format");

              const user = await db.getFirstAsync<{ id: number }>(
                "SELECT id FROM users WHERE email = ?",
                [email],
              );
              if (!user) throw new Error("User not found");

              // Apagar dados existentes
              await db.runAsync(
                `DELETE FROM workout_sets WHERE workout_exercise_id IN (
                  SELECT we.id FROM workout_exercises we
                  JOIN workouts w ON we.workout_id = w.id
                  WHERE w.user_id = ?
                )`,
                [user.id],
              );
              await db.runAsync(
                `DELETE FROM workout_exercises WHERE workout_id IN (
                  SELECT id FROM workouts WHERE user_id = ?
                )`,
                [user.id],
              );
              await db.runAsync("DELETE FROM workouts WHERE user_id = ?", [
                user.id,
              ]);

              // Inserir dados importados
              for (const workout of data.workouts) {
                await db.runAsync(
                  `INSERT INTO workouts (user_id, date, title, notes, description, total_volume, duration)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    user.id,
                    workout.date,
                    workout.title,
                    workout.notes,
                    workout.description,
                    workout.total_volume,
                    workout.duration,
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

                  await db.runAsync(
                    `INSERT INTO workout_exercises (id, workout_id, exercise_id, index_order, notes)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                      newExerciseId,
                      newWorkoutId,
                      exercise.exercise_id,
                      exercise.index_order,
                      exercise.notes,
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
                        set.exercise_id,
                        set.index_order,
                        set.set_type,
                        set.weight,
                        set.reps,
                        set.is_personal_record,
                        set.distance,
                        set.time,
                      ],
                    );
                  }
                }
              }

              Alert.alert(
                "Success",
                "Your data has been imported successfully.",
              );
              resolve();
            } catch (e) {
              console.error("Import error:", e);
              Alert.alert(
                "Error",
                "Failed to import data. Make sure the file is valid.",
              );
              reject(e);
            }
          },
        },
      ],
    );
  });
};
