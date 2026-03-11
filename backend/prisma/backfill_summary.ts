import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillPatientSummaryPublished() {
    console.log('Starting backfill for patientSummaryPublished...');

    const updated = await prisma.aIScribeSession.updateMany({
        where: {
            status: 'APPROVED',
            patientSummaryPublished: false,
            patientSummary: { not: Prisma.AnyNull },
        },
        data: {
            patientSummaryPublished: true,
        },
    });

    console.log(`Updated ${updated.count} AI Scribe sessions.`);
}

backfillPatientSummaryPublished()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
