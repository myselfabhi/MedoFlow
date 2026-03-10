/**
 * One-off script: set password for a user by email.
 * Usage: npx ts-node -r dotenv/config scripts/set-password.ts
 * Edit EMAIL and PASSWORD below or pass via env SET_PASSWORD_EMAIL / SET_PASSWORD_PLAIN.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = process.env.SET_PASSWORD_EMAIL ?? 'myselfabhi.dev@gmail.com';
const PASSWORD = process.env.SET_PASSWORD_PLAIN ?? 'abhinav';

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.updateMany({
    where: { email: EMAIL.toLowerCase() },
    data: { password: hashed },
  });
  if (user.count === 0) {
    console.error(`No user found with email: ${EMAIL}`);
    process.exit(1);
  }
  console.log(`Password updated for ${EMAIL}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
