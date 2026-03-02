const prisma = require('../config/prisma');

const validateAppointmentForPrescription = async (appointmentId, providerId, clinicId) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, providerId, clinicId },
  });
  if (!appointment) {
    const err = new Error('Appointment not found or provider not assigned');
    err.statusCode = 404;
    throw err;
  }
  if (appointment.status !== 'COMPLETED') {
    const err = new Error('Appointment must be COMPLETED before creating prescription');
    err.statusCode = 400;
    throw err;
  }
  return appointment;
};

const createPrescription = async (data, providerId, clinicId) => {
  const { appointmentId, patientId, notes } = data;

  const appointment = await validateAppointmentForPrescription(appointmentId, providerId, clinicId);

  return prisma.prescription.create({
    data: {
      clinicId,
      appointmentId,
      providerId,
      patientId: patientId || appointment.patientId,
      notes,
    },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getPrescriptionsByPatient = async (patientId, clinicId) => {
  const where = { patientId };
  if (clinicId) where.clinicId = clinicId;

  return prisma.prescription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      appointment: { select: { id: true, startTime: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

const getPrescriptionsByProvider = async (providerId, clinicId) => {
  const where = { providerId };
  if (clinicId) where.clinicId = clinicId;

  return prisma.prescription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      appointment: { select: { id: true, startTime: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getPrescriptionsByClinic = async (clinicId) => {
  return prisma.prescription.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    include: {
      appointment: { select: { id: true, startTime: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

module.exports = {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByProvider,
  getPrescriptionsByClinic,
};
