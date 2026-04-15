import { SQLiteDatabase } from "expo-sqlite";

const logDB = (operation: string, params: any[], success: boolean) => {
  if (success) {
    // USE CRASE ` EM VEZ DE '
    console.log(`✅ [DB SUCCESS] ${operation}`);
  } else {
    console.log(`⚠️ [DB INFO] ${operation} - Nenhuma alteração.`);
  }
};

// --- FUNÇÕES PARA ACCOUNT SETTINGS ---
// --- FUNÇÃO PARA ALTERAR USERNAME ---

export const updateUsername = async (
  db: SQLiteDatabase,
  currentUsername: string,
  pass: string,
  newUsername: string,
) => {
  if (currentUsername.toLowerCase() === newUsername.toLowerCase()) {
    return { success: false, message: "You must insert a different username" };
  }

  const params = [newUsername, currentUsername, pass];
  try {
    const result = await db.runAsync(
      "UPDATE users SET username = ? WHERE username = ? AND pass = ?",
      params,
    );

    if (result.changes > 0) {
      logDB("UPDATE (Username)", params, true);
      return { success: true };
    } else {
      logDB("UPDATE (Username)", params, false);
      return { success: false, message: "Username or password are incorrect" };
    }
  } catch (e) {
    console.log("❌ Erro SQL:", e);
    return { success: false, message: "This username is already taken." };
  }
};
// --- FUNÇÃO PARA ALTERAR EMAIL ---

export const updateEmail = async (
  db: SQLiteDatabase,
  currentEmail: string,
  pass: string,
  newEmail: string,
) => {
  // 1. Validar se o novo é igual ao antigo introduzido no formulário
  if (currentEmail.toLowerCase() === newEmail.toLowerCase()) {
    return { success: false, message: "You must insert a different email" };
  }

  try {
    // 2. VERIFICAÇÃO CRÍTICA: O novo email já existe na BD?
    const emailExists = await db.getFirstAsync(
      "SELECT id FROM users WHERE email = ? AND email != ?",
      [newEmail.toLowerCase(), currentEmail.toLowerCase()],
    );

    if (emailExists) {
      return { success: false, message: "This email is already registered" };
    }

    // 3. Tentar o update validando email atual e password
    const result = await db.runAsync(
      "UPDATE users SET email = ? WHERE email = ? AND pass = ?",
      [newEmail.toLowerCase(), currentEmail.toLowerCase(), pass],
    );

    if (result.changes > 0) {
      logDB("UPDATE (Email)", [newEmail], true);
      return { success: true };
    } else {
      logDB("UPDATE (Email)", [currentEmail], false);
      return { success: false, message: "Current email or password incorrect" };
    }
  } catch (e) {
    console.log("❌ Erro SQL:", e);
    return { success: false, message: "A database error occurred." };
  }
};

// --- FUNÇÃO PARA ALTERAR PASSWORD ---

export const updatePassword = async (
  db: SQLiteDatabase,
  email: string, // Usamos o email como identificador único do user logado
  currentPass: string,
  newPass: string,
) => {
  // 1. Validar se a nova é igual à atual
  if (currentPass === newPass) {
    return { success: false, message: "New password must be different" };
  }

  try {
    // 2. Tentar o update apenas se o email e a password atual coincidirem
    const result = await db.runAsync(
      "UPDATE users SET pass = ? WHERE email = ? AND pass = ?",
      [newPass, email, currentPass],
    );

    if (result.changes > 0) {
      logDB("UPDATE (Password)", [""], true);
      return { success: true };
    } else {
      logDB("UPDATE (Password)", [""], false);
      return { success: false, message: "Current password is incorrect" };
    }
  } catch (e) {
    console.log("❌ Erro SQL Password:", e);
    return { success: false, message: "A database error occurred." };
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
