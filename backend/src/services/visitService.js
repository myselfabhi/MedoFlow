const prisma = require('../config/prisma');

const getProviderByUserId = async (userId) => {
  return prisma.provider.findFirst({
    where: { userId },
  });
};

const validateAppointmentForProvider = async (appointmentId, providerId, clinicId) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, providerId, clinicId },
  });
  if (!appointment) {
    const err = new Error('Appointment not found or provider not assigned');
    err.statusCode = 404;
    throw err;
  }
  return appointment;
};

const createVisitRecord = async (data, providerId, clinicId) => {
  const { appointmentId, patientId, subjective, objective, assessment, plan } = data;

  await validateAppointmentForProvider(appointmentId, providerId, clinicId);

  const existing = await prisma.visitRecord.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    const err = new Error('Visit record already exists for this appointment');
    err.statusCode = 409;
    throw err;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  return prisma.visitRecord.create({
    data: {
      clinicId,
      appointmentId,
      providerId,
      patientId: patientId || appointment.patientId,
      subjective,
      objective,
      assessment,
      plan,
    },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getVisitRecordByAppointment = async (appointmentId, clinicId) => {
  const where = { appointmentId };
  if (clinicId) where.clinicId = clinicId;

  return prisma.visitRecord.findFirst({
    where,
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getVisitRecordById = async (id, where = {}) => {
  return prisma.visitRecord.findFirst({
    where: { id, ...where },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const updateVisitRecord = async (id, data, providerId, clinicId) => {
  const record = await getVisitRecordById(id, { clinicId });
  if (!record) {
    const err = new Error('Visit record not found');
    err.statusCode = 404;
    throw err;
  }
  if (record.providerId !== providerId) {
    const err = new Error('Only the provider who created the record can edit it');
    err.statusCode = 403;
    throw err;
  }
  return prisma.visitRecord.update({
    where: { id },
    data: {
      ...(data.subjective !== undefined && { subjective: data.subjective }),
      ...(data.objective !== undefined && { objective: data.objective }),
      ...(data.assessment !== undefined && { assessment: data.assessment }),
      ...(data.plan !== undefined && { plan: data.plan }),
    },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const finalizeVisitRecord = async (id, providerId, clinicId) => {
  const record = await getVisitRecordById(id, { clinicId });
  if (!record) {
    const err = new Error('Visit record not found');
    err.statusCode = 404;
    throw err;
  }
  if (record.providerId !== providerId) {
    const err = new Error('Only the provider who created the record can finalize it');
    err.statusCode = 403;
    throw err;
  }

  return prisma.visitRecord.update({
    where: { id },
    data: { status: 'FINAL' },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getVisitRecordsByClinic = async (clinicId) => {
  return prisma.visitRecord.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    include: {
      appointment: { select: { id: true, startTime: true, status: true } },
      provider: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

module.exports = {
  createVisitRecord,
  getVisitRecordByAppointment,
  getVisitRecordById,
  updateVisitRecord,
  finalizeVisitRecord,
  getVisitRecordsByClinic,
  getProviderByUserId,
};
