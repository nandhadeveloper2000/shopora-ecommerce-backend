import bcrypt from "bcryptjs";

export async function hashValue(value: string) {
  return bcrypt.hash(value, 10);
}

export async function compareValue(value: string, hashed: string) {
  return bcrypt.compare(value, hashed);
}