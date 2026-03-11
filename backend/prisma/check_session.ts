import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const appointmentId = 'cmmld5owe001bxm1934h226zx';
    console.log(`Checking ConsultationSession for appointment: ${appointmentId}\n`);

    const session = await prisma.consultationSession.findFirst({
        where: { appointmentId },
        include: {
            provider: true,
            patient: true,
        }
    });

    if (!session) {
        console.log("❌ ConsultationSession not found!");
        return;
    }

    console.log("✅ ConsultationSession Exists");
    console.log(`   ID: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   ConsentStatus: ${session.consentStatus}`);
    console.log(`   ConsentGrantedAt: ${session.consentGrantedAt}`);
    console.log(`   JoinToken: ${session.joinToken}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
