import { SQLiteDatabase } from "expo-sqlite";

export const login = async (
  db: SQLiteDatabase,
  email: string,
  pass: string,
) => {
  const result = await db.getFirstAsync(
    "SELECT * FROM users WHERE email = ? AND pass = ?",
    [email, pass],
  );
  return result;
};

export const signup = (
  db: SQLiteDatabase,
  username: string,
  email: string,
  pass: string,
) => {
  return db.runSync(
    "INSERT INTO users (id, username, email, pass, created_count) VALUES (?, ?, ?, ?, ?)",
    [Date.now(), username, email, pass, new Date().toISOString()],
  );
};

export const checkEmailExists = async (db: SQLiteDatabase, email: string) => {
  return db.getFirstAsync("SELECT id FROM users WHERE email = ?", [email]);
};

export const getUserByEmail = async (db: SQLiteDatabase, email: string) => {
  const user = await db.getFirstAsync("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  console.log("Dados do utilizador:", user);
  return user;
};

export const updateUserGender = async (
  db: SQLiteDatabase,
  email: string,
  gender: string,
) => {
  return db.runAsync("UPDATE users SET gender = ? WHERE email = ?", [
    gender,
    email,
  ]);
};

export const updateUserBirthday = async (
  db: SQLiteDatabase,
  email: string,
  birthday: string,
) => {
  return db.runAsync("UPDATE users SET birthday = ? WHERE email = ?", [
    birthday,
    email,
  ]);
};

export const updateUserWeight = async (
  db: SQLiteDatabase,
  email: string,
  weight: number,
) => {
  return db.runAsync("UPDATE users SET weight = ? WHERE email = ?", [
    weight,
    email,
  ]);
};

export const updateUserHeight = async (
  db: SQLiteDatabase,
  email: string,
  height: string,
) => {
  return db.runAsync("UPDATE users SET height = ? WHERE email = ?", [
    height,
    email,
  ]);
};

export const updateUserWeeklyGoal = async (
  db: SQLiteDatabase,
  email: string,
  weeklyGoal: number,
) => {
  return db.runAsync("UPDATE users SET weekly_goal = ? WHERE email = ?", [
    weeklyGoal,
    email,
  ]);
};
