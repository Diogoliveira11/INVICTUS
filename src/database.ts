import { SQLiteDatabase } from "expo-sqlite";

// Função para exibir logs no terminal do VS Code
const logDB = (operation: string, params: any[], success: boolean) => {
  if (success) {
    console.log(
      `✅ [DB SUCCESS] ${operation} | Params: ${JSON.stringify(params)}`,
    );
  } else {
    console.error(`❌ [DB ERROR] ${operation} falhou!`);
  }
};

// --- FUNÇÕES DE AUTENTICAÇÃO ---

export const login = async (
  db: SQLiteDatabase,
  email: string,
  pass: string,
) => {
  logDB("SELECT (Login)", [email, "****"], true);
  const result = await db.getFirstAsync(
    "SELECT * FROM users WHERE email = ? AND pass = ?",
    [email, pass],
  );
  return result;
};

export const signup = async (
  db: SQLiteDatabase,
  username: string,
  email: string,
  pass: string,
) => {
  const params = [Date.now(), username, email, pass, new Date().toISOString()];
  try {
    const result = await db.runAsync(
      "INSERT INTO users (id, username, email, pass, created_count) VALUES (?, ?, ?, ?, ?)",
      params,
    );
    logDB("INSERT (Signup)", params, true);
    return result;
  } catch (e) {
    logDB("INSERT (Signup)", params, false);
    throw e;
  }
};

export const checkEmailExists = async (db: SQLiteDatabase, email: string) => {
  return await db.getFirstAsync("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
};

// --- FUNÇÕES DE UPDATE (ONBOARDING) ---

export const updateUserGender = async (
  db: SQLiteDatabase,
  email: string,
  gender: string,
) => {
  logDB("UPDATE (Gender)", [gender, email], !!email);
  return await db.runAsync("UPDATE users SET gender = ? WHERE email = ?", [
    gender,
    email,
  ]);
};

export const updateUserBirthday = async (
  db: SQLiteDatabase,
  email: string,
  birthday: string,
) => {
  logDB("UPDATE (Birthday)", [birthday, email], !!email);
  return await db.runAsync("UPDATE users SET birthday = ? WHERE email = ?", [
    birthday,
    email,
  ]);
};

export const updateUserWeight = async (
  db: SQLiteDatabase,
  email: string,
  weight: number,
) => {
  logDB("UPDATE (Weight)", [weight, email], !!email);
  return await db.runAsync("UPDATE users SET weight = ? WHERE email = ?", [
    weight,
    email,
  ]);
};

export const updateUserHeight = async (
  db: SQLiteDatabase,
  email: string,
  height: string,
) => {
  logDB("UPDATE (Height)", [height, email], !!email);
  return await db.runAsync("UPDATE users SET height = ? WHERE email = ?", [
    height,
    email,
  ]);
};

export const updateUserWeeklyGoal = async (
  db: SQLiteDatabase,
  email: string,
  weeklyGoal: number,
) => {
  logDB("UPDATE (Weekly Goal)", [weeklyGoal, email], !!email);
  return await db.runAsync("UPDATE users SET weekly_goal = ? WHERE email = ?", [
    weeklyGoal,
    email,
  ]);
};

// --- FUNÇÕES DE CONSULTA E ESTATÍSTICAS ---

export const getUserByEmail = async (db: SQLiteDatabase, email: string) => {
  const user = await db.getFirstAsync("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  console.log("🔍 [DB SELECT] Utilizador atual:", user);
  return user;
};

export const printDatabaseStats = async (db: SQLiteDatabase) => {
  try {
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) as total FROM users",
    );
    const total = result?.total ?? 0;

    const users = await db.getAllAsync<{ username: string; email: string }>(
      "SELECT username, email FROM users",
    );

    console.log("\n--- 📊 ESTATÍSTICAS DA BASE DE DADOS ---");
    console.log(`| Total de utilizadores registados: ${total}`);
    console.log("| Lista de utilizadores:");
    users.forEach((u, i) => {
      console.log(`|   ${i + 1}. ${u.username} (${u.email})`);
    });
    console.log("----------------------------------------\n");
  } catch (e) {
    console.error("❌ Erro ao ler estatísticas:", e);
  }
};
