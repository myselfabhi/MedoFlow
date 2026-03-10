import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
const SUPER_ADMIN_PASSWORD = 'superadmin';

const CLINIC_ADMIN_EMAIL = 'clinicadmin@example.com';
const CLINIC_ADMIN_PASSWORD = 'clinicadmin';

async function main() {
  const superAdminHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existingSuperAdmin) {
    await prisma.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: { password: superAdminHash, role: 'SUPER_ADMIN', name: 'Super Admin' },
    });
    console.log('Super admin password reset.');
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        password: superAdminHash,
        role: 'SUPER_ADMIN',
        clinicId: null,
      },
    });
    console.log('Super admin created successfully.');
  }

  // Clinic admin (SUPER_ADMIN with clinic - clinic owner)
  const clinicAdminHash = await bcrypt.hash(CLINIC_ADMIN_PASSWORD, 12);
  let clinic = await prisma.clinic.findFirst({
    where: { name: 'Demo Clinic' },
  });
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Demo Clinic',
        email: 'demo@clinic.com',
      },
    });
    console.log('Demo clinic created.');
  }

  const existingClinicAdmin = await prisma.user.findUnique({
    where: { email: CLINIC_ADMIN_EMAIL },
  });

  if (existingClinicAdmin) {
    await prisma.user.update({
      where: { email: CLINIC_ADMIN_EMAIL },
      data: {
        password: clinicAdminHash,
        role: 'SUPER_ADMIN',
        name: 'Clinic Admin',
        clinicId: clinic.id,
      },
    });
    console.log('Clinic admin password reset.');
  } else {
    await prisma.user.create({
      data: {
        name: 'Clinic Admin',
        email: CLINIC_ADMIN_EMAIL,
        password: clinicAdminHash,
        role: 'SUPER_ADMIN',
        clinicId: clinic.id,
      },
    });
    console.log('Clinic admin created successfully.');
  }

  console.log('\n--- Login credentials ---');
  console.log('Super Admin:');
  console.log('  Email:', SUPER_ADMIN_EMAIL);
  console.log('  Password:', SUPER_ADMIN_PASSWORD);
  console.log('\nClinic Admin:');
  console.log('  Email:', CLINIC_ADMIN_EMAIL);
  console.log('  Password:', CLINIC_ADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
