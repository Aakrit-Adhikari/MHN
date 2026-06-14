import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

export async function authenticateAdmin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function createDefaultAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });

  if (existingAdmin) return;

  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: env.ADMIN_EMAIL,
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });
}