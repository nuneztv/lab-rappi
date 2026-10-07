import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/connection";
import { Role } from "../types/auth";

function token(id: string, role: Role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "rappi_lab_secret", { expiresIn: "7d" });
}

export async function register(data: any) {
  const { name, email, password, role, storeName } = data;
  if (!name || !email || !password) throw new Error("Nombre, correo y contraseña son obligatorios");
  if (!["consumer", "store", "delivery"].includes(role)) throw new Error("Rol invalido");
  if (role === "store" && !storeName) throw new Error("El nombre de la tienda es obligatorio");

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length) throw new Error("Ya existe un usuario con ese correo");

  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role",
      [name, email, hash, role]
    );
    const user = result.rows[0];
    if (role === "store") {
      await client.query("INSERT INTO stores (name,is_open,user_owner_id) VALUES ($1,false,$2)", [storeName, user.id]);
    }
    await client.query("COMMIT");
    return { token: token(user.id, user.role), user };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function login(email: string, password: string) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) throw new Error("Correo o contraseña incorrectos");
  return { token: token(user.id, user.role), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}
