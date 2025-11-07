import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from '@/lib/constants';
import logger from '@/lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export function handleError(error: unknown): NextResponse {
  // Log the error
  logger.error('Error occurred:', error);

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Este valor já está em uso',
            field: error.meta?.target,
          },
          { status: 409 }
        );
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'Registro não encontrado',
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          },
          { status: 500 }
        );
    }
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    },
    { status: 500 }
  );
}

export function asyncHandler<T>(fn: (...args: T[]) => Promise<NextResponse>) {
  return async (...args: T[]): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
