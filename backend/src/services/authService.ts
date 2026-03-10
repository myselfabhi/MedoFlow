import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { ApiError } from '../types/errors';

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

const validateRegistration = (body: RegisterBody): void => {
  const { name, email, password } = body;

  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required') as ApiError;
    err.statusCode = 400;
    throw err;
  }
};

export const registerUser = async (body: RegisterBody) => {
  validateRegistration(body);

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
  });
  if (existingUser) {
    const err = new Error('Email already registered') as ApiError;
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  return prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'PATIENT',
      clinicId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clinicId: true,
      isActive: true,
      createdAt: true,
    },
  });
};
