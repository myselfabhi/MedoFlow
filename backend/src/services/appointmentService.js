const prisma = require('../config/prisma');

const CANCELLED_STATUS = 'CANCELLED';

const validateServiceBelongsToClinic = async (serviceId, clinicId) => {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, clinicId, isActive: true },
  });
  if (!service) {
    const err = new Error('Service not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  return service;
};

const validateProviderOffersService = async (providerId, serviceId, clinicId) => {
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, clinicId, isActive: true },
    include: {
      providerServices: {
        where: { serviceId },
        include: { service: true },
      },
    },
  });
  if (!provider) {
    const err = new Error('Provider not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  const assignment = provider.providerServices[0];
  if (!assignment) {
    const err = new Error('Provider does not offer this service');
    err.statusCode = 400;
    throw err;
  }
  return assignment;
};

const validateLocationBelongsToClinic = async (locationId, clinicId) => {
  const location = await prisma.location.findFirst({
    where: { id: locationId, clinicId, isActive: true },
  });
  if (!location) {
    const err = new Error('Location not found or does not belong to this clinic');
    err.statusCode = 404;
    throw err;
  }
  return location;
};

const validatePatient = async (patientId) => {
  const user = await prisma.user.findUnique({
    where: { id: patientId },
  });
  if (!user) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'PATIENT') {
    const err = new Error('User is not a patient');
    err.statusCode = 400;
    throw err;
  }
  return user;
};

const checkDoubleBooking = async (providerId, startTime, endTime, excludeId = null) => {
  const where = {
    providerId,
    status: { not: CANCELLED_STATUS },
    OR: [
      {
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    ],
  };
  if (excludeId) {
    where.id = { not: excludeId };
  }
  const conflicting = await prisma.appointment.findFirst({ where });
  if (conflicting) {
    const err = new Error('Provider has a conflicting appointment in this time slot');
    err.statusCode = 409;
    throw err;
  }
};

const createAppointment = async (data, clinicId) => {
  const { locationId, providerId, serviceId, patientId, startTime, endTime } = data;

  await validateServiceBelongsToClinic(serviceId, clinicId);
  const assignment = await validateProviderOffersService(providerId, serviceId, clinicId);
  await validateLocationBelongsToClinic(locationId, clinicId);
  await validatePatient(patientId);
  await checkDoubleBooking(providerId, startTime, endTime);

  const priceAtBooking = assignment.priceOverride ?? assignment.service.defaultPrice;

  return prisma.appointment.create({
    data: {
      clinicId,
      locationId,
      providerId,
      serviceId,
      patientId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'CONFIRMED',
      priceAtBooking,
    },
    include: {
      clinic: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true, duration: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAppointmentsByPatient = async (patientId, clinicId) => {
  const where = { patientId };
  if (clinicId) where.clinicId = clinicId;
  return prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
  });
};

const getAppointmentsByProvider = async (providerId, clinicId) => {
  const where = { providerId };
  if (clinicId) where.clinicId = clinicId;
  return prisma.appointment.findMany({
    where,
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAppointmentsByClinic = async (clinicId) => {
  return prisma.appointment.findMany({
    where: { clinicId },
    orderBy: { startTime: 'desc' },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAppointmentById = async (id, where = {}) => {
  return prisma.appointment.findFirst({
    where: { id, ...where },
    include: {
      clinic: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true, duration: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

const getProviderByUserId = async (userId) => {
  return prisma.provider.findFirst({
    where: { userId },
  });
};

const updateAppointmentStatus = async (id, status, req) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    const err = new Error('Appointment not found');
    err.statusCode = 404;
    throw err;
  }

  if (req.user.role === 'PROVIDER') {
    const provider = await getProviderByUserId(req.user.id);
    if (!provider || provider.id !== appointment.providerId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
    const allowedStatuses = ['COMPLETED', 'NO_SHOW', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      const err = new Error('Provider can only update status to COMPLETED, NO_SHOW, or CANCELLED');
      err.statusCode = 403;
      throw err;
    }
  }

  if (req.user.role === 'PATIENT') {
    if (appointment.patientId !== req.user.id) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
    const allowedStatuses = ['CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      const err = new Error('Patient can only cancel appointments');
      err.statusCode = 403;
      throw err;
    }
  }

  if (req.user.role === 'CLINIC_ADMIN' && req.clinicId !== appointment.clinicId) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      location: { select: { id: true, name: true } },
      provider: {
        include: {
          discipline: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      },
      service: { select: { id: true, name: true } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });
};

module.exports = {
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentsByProvider,
  getAppointmentsByClinic,
  getAppointmentById,
  getProviderByUserId,
  updateAppointmentStatus,
};
