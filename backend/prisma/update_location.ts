import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLocation() {
    console.log('Updating location to be online...');

    const location = await prisma.location.findFirst();

    if (!location) {
        console.error('No location found in DB');
        process.exit(1);
    }

    const updated = await prisma.location.update({
        where: { id: location.id },
        data: {
            name: 'Online Consultation',
            addressLine1: 'Virtual Meet',
            city: 'Online',
            state: 'Online',
            zipCode: '000000',
            isVirtual: true // If this field exists, we'll try to set it, but we can just use the name for now
        }
    });

    console.log('Location updated to Online:', updated.name);
}

updateLocation()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
