import { SQLiteDatabase } from "expo-sqlite";

export const login = async (
  db: SQLiteDatabase,
  email: string,
  pass: string,
) => {
  return db.getFirstAsync("SELECT * FROM users WHERE email = ? AND pass = ?", [
    email,
    pass,
  ]);
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

export const getUserById = async (db: SQLiteDatabase, id: number) => {
  return db.getFirstAsync("SELECT * FROM users WHERE id = ?", [id]);
};
