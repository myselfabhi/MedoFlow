import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const appointmentId = 'cmmld5owe001bxm1934h226zx';

    // Delete all ConsultationSessions for this appointment so the user can start fresh
    const deleted = await prisma.consultationSession.deleteMany({
        where: { appointmentId }
    });

    console.log(`✅ Deleted ${deleted.count} duplicate consultation sessions for appointment ${appointmentId}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
