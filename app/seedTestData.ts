import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQLiteDatabase } from "expo-sqlite";

/**
 * Insere treinos falsos cobrindo todos os períodos:
 *   > 1 ano, > 3 meses, > 30 dias, > 7 dias, < 7 dias
 * Apaga depois chamando clearSeedData(db).
 */
export async function seedOldWorkouts(db: SQLiteDatabase) {
  try {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) return;

    const userRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (!userRow) return;
    const userId = userRow.id;

    // Evita duplicados
    const alreadySeeded = await db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? AND title LIKE 'SEED_%'",
      [userId],
    );
    if (alreadySeeded && alreadySeeded.cnt > 0) {
      console.log("[seed] Já foi feito seed, a saltar.");
      return;
    }

    // Busca um exercício real de cada grupo muscular
    const muscleGroups = [
      "Back",
      "Chest",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Quadriceps",
      "Hamstrings",
      "Abs",
      "Glutes",
      "Forearms",
    ];

    const exercisesByGroup: Record<string, number> = {};
    for (const mg of muscleGroups) {
      const ex = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM exercises WHERE muscle_group = ? LIMIT 1",
        [mg],
      );
      if (ex) exercisesByGroup[mg] = ex.id;
    }

    if (Object.keys(exercisesByGroup).length === 0) {
      console.warn("[senhum exercício encontrado.");
      return;
    }

    console.log(
      "[seed] Exercícios encontrados:",
      JSON.stringify(exercisesByGroup),
    );

    // Plano de treinos cobrindo todos os períodos
    // Duração em formato "M:SS" (mesmo formato que a BD usa)
    const workoutPlan: {
      daysAgo: number;
      groups: string[];
      duration: string;
    }[] = [
      // ── Há mais de 1 ano (366-450 dias) ──
      { daysAgo: 450, groups: ["Back", "Biceps"], duration: "40:00" },
      {
        daysAgo: 430,
        groups: ["Chest", "Triceps", "Shoulders"],
        duration: "45:00",
      },
      { daysAgo: 410, groups: ["Quadriceps", "Hamstrings"], duration: "50:00" },
      { daysAgo: 395, groups: ["Back", "Forearms", "Abs"], duration: "42:00" },
      { daysAgo: 380, groups: ["Chest", "Shoulders"], duration: "38:00" },
      {
        daysAgo: 370,
        groups: ["Glutes", "Hamstrings", "Abs"],
        duration: "44:00",
      },

      // ── Há mais de 3 meses (91-365 dias) ──
      {
        daysAgo: 340,
        groups: ["Back", "Biceps", "Forearms"],
        duration: "48:00",
      },
      { daysAgo: 300, groups: ["Chest", "Triceps"], duration: "44:30" },
      { daysAgo: 260, groups: ["Quadriceps", "Glutes"], duration: "52:00" },
      { daysAgo: 220, groups: ["Shoulders", "Biceps"], duration: "38:45" },
      { daysAgo: 175, groups: ["Back", "Abs"], duration: "46:00" },
      {
        daysAgo: 148,
        groups: ["Chest", "Shoulders", "Triceps"],
        duration: "50:15",
      },
      {
        daysAgo: 122,
        groups: ["Hamstrings", "Glutes", "Abs"],
        duration: "55:00",
      },
      { daysAgo: 110, groups: ["Back", "Biceps"], duration: "42:30" },
      {
        daysAgo: 98,
        groups: ["Chest", "Triceps", "Forearms"],
        duration: "47:00",
      },
      { daysAgo: 93, groups: ["Quadriceps", "Shoulders"], duration: "44:15" },

      // ── Há mais de 30 dias (31-90 dias) ──
      {
        daysAgo: 88,
        groups: ["Back", "Biceps", "Forearms"],
        duration: "52:30",
      },
      {
        daysAgo: 80,
        groups: ["Chest", "Triceps", "Shoulders"],
        duration: "48:15",
      },
      {
        daysAgo: 72,
        groups: ["Quadriceps", "Hamstrings", "Glutes"],
        duration: "58:00",
      },
      { daysAgo: 65, groups: ["Back", "Biceps"], duration: "45:20" },
      {
        daysAgo: 58,
        groups: ["Chest", "Shoulders", "Triceps"],
        duration: "50:10",
      },
      { daysAgo: 50, groups: ["Quadriceps", "Abs"], duration: "40:00" },
      { daysAgo: 43, groups: ["Back", "Forearms"], duration: "38:45" },
      { daysAgo: 38, groups: ["Chest", "Triceps"], duration: "42:30" },
      {
        daysAgo: 33,
        groups: ["Hamstrings", "Glutes", "Abs"],
        duration: "47:00",
      },

      // ── Há mais de 7 dias (8-30 dias) ──
      {
        daysAgo: 28,
        groups: ["Back", "Biceps", "Forearms"],
        duration: "58:20",
      },
      {
        daysAgo: 25,
        groups: ["Chest", "Triceps", "Shoulders"],
        duration: "53:45",
      },
      {
        daysAgo: 22,
        groups: ["Quadriceps", "Hamstrings", "Glutes"],
        duration: "62:00",
      },
      { daysAgo: 19, groups: ["Back", "Biceps"], duration: "50:30" },
      {
        daysAgo: 16,
        groups: ["Chest", "Shoulders", "Triceps"],
        duration: "55:15",
      },
      { daysAgo: 13, groups: ["Quadriceps", "Abs"], duration: "45:00" },
      { daysAgo: 10, groups: ["Back", "Forearms", "Abs"], duration: "48:30" },
      { daysAgo: 8, groups: ["Shoulders", "Biceps"], duration: "42:00" },

      // ── Últimos 7 dias (1-6 dias) ──
      { daysAgo: 6, groups: ["Back", "Biceps", "Forearms"], duration: "60:00" },
      { daysAgo: 5, groups: ["Chest", "Triceps"], duration: "55:30" },
      {
        daysAgo: 3,
        groups: ["Quadriceps", "Hamstrings", "Glutes"],
        duration: "65:00",
      },
      { daysAgo: 2, groups: ["Shoulders", "Abs"], duration: "48:45" },
      { daysAgo: 1, groups: ["Back", "Triceps", "Chest"], duration: "57:00" },
    ];

    for (const plan of workoutPlan) {
      // Volume real = sum(weight * reps) por set
      // 4 sets: 60×12 + 65×10 + 70×8 + 72.5×6 = 720+650+560+435 = 2365 por grupo
      const volumePerGroup = 60 * 12 + 65 * 10 + 70 * 8 + 72.5 * 6;
      const totalVolume = plan.groups.length * volumePerGroup;

      await db.runAsync(
        `INSERT INTO workouts (user_id, date, title, duration, total_volume)
         VALUES (?, date('now', '-${plan.daysAgo} days'), ?, ?, ?)`,
        [userId, `SEED_${plan.daysAgo}d`, plan.duration, totalVolume],
      );

      const workout = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM workouts WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        [userId],
      );
      if (!workout) continue;

      for (const group of plan.groups) {
        const exId = exercisesByGroup[group];
        if (!exId) continue;

        await db.runAsync(
          "INSERT INTO workout_exercises (workout_id, exercise_id, index_order) VALUES (?, ?, 0)",
          [workout.id, exId],
        );

        const we = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM workout_exercises WHERE workout_id = ? AND exercise_id = ? ORDER BY id DESC LIMIT 1",
          [workout.id, exId],
        );
        if (!we) continue;

        // 4 sets progressivos por grupo
        const weights = [60, 65, 70, 72.5];
        const reps = [12, 10, 8, 6];
        for (let s = 0; s < 4; s++) {
          await db.runAsync(
            "INSERT INTO workout_sets (workout_exercise_id, exercise_id, weight, reps, set_number) VALUES (?, ?, ?, ?, ?)",
            [we.id, exId, weights[s], reps[s], s + 1],
          );
        }
      }
    }

    console.log(`[seed] ✅ ${workoutPlan.length} treinos inseridos!`);
    console.log(`[seed] Distribuição:`);
    console.log(`[seed]   > 1 ano:    6 treinos (366+ dias)`);
    console.log(`[seed]   > 3 meses: 10 treinos (91-365 dias)`);
    console.log(`[seed]   > 30 dias:  9 treinos (31-90 dias)`);
    console.log(`[seed]   > 7 dias:   8 treinos (8-30 dias)`);
    console.log(`[seed]   < 7 dias:   5 treinos (1-6 dias)`);
  } catch (e) {
    console.error("[seed] Erro:", e);
  }
}

/**
 * Remove todos os dados de seed.
 */
export async function clearSeedData(db: SQLiteDatabase) {
  try {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) return;

    const userRow = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (!userRow) return;

    await db.runAsync(
      `DELETE FROM workout_sets WHERE workout_exercise_id IN (
         SELECT we.id FROM workout_exercises we
         JOIN workouts w ON we.workout_id = w.id
         WHERE w.user_id = ? AND w.title LIKE 'SEED_%'
       )`,
      [userRow.id],
    );
    await db.runAsync(
      `DELETE FROM workout_exercises WHERE workout_id IN (
         SELECT id FROM workouts WHERE user_id = ? AND title LIKE 'SEED_%'
       )`,
      [userRow.id],
    );
    await db.runAsync(
      "DELETE FROM workouts WHERE user_id = ? AND title LIKE 'SEED_%'",
      [userRow.id],
    );

    console.log("[seed] 🗑️ Dados de seed removidos.");
  } catch (e) {
    console.error("[seed] Erro ao limpar:", e);
  }
}
