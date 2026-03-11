import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const appointmentId = 'cmmld5owe001bxm1934h226zx';

    const aiSession = await prisma.aIScribeSession.findFirst({
        where: { consultationSession: { appointmentId } },
        orderBy: { createdAt: 'desc' }
    });

    if (aiSession) {
        console.log("Status:", aiSession.status);
        console.log("Error:", aiSession.errorMessage);
        console.log("AI Draft Data:\n", JSON.stringify(aiSession.aiDraft, null, 2));
    } else {
        console.log("No AI session found.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
