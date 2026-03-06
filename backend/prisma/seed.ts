import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'admin@medoflow.com';
const SUPER_ADMIN_PASSWORD = 'Admin123!';

async function main() {
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const existing = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: { password: hashedPassword, role: 'SUPER_ADMIN', name: 'Super Admin' },
    });
    console.log('Super admin password reset.');
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        clinicId: null,
      },
    });
    console.log('Super admin created successfully.');
  }

  console.log('Email:', SUPER_ADMIN_EMAIL);
  console.log('Password:', SUPER_ADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
