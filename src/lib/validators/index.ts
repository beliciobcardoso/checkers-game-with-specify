import { z } from 'zod';

// Board position validator
export const positionSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7),
});

// Piece validator
export const pieceSchema = z.object({
  id: z.string(),
  color: z.enum(['WHITE', 'BLACK']),
  type: z.enum(['NORMAL', 'KING']),
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7),
});

// Move validator
export const moveSchema = z.object({
  from: positionSchema,
  to: positionSchema,
  pieceId: z.string(),
});

// Board state validator
export const boardStateSchema = z.object({
  pieces: z.array(pieceSchema),
  capturedPieces: z.object({
    white: z.number().int().min(0).max(12),
    black: z.number().int().min(0).max(12),
  }),
  positionHistory: z.array(z.string()),
});

// Player registration validator
export const playerRegistrationSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username deve conter apenas letras, números, hífens e underscores'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

// Player login validator
export const playerLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Room code validator
export const roomCodeSchema = z
  .string()
  .length(6, 'Código da sala deve ter 6 caracteres')
  .regex(/^[A-Z0-9]+$/, 'Código da sala deve conter apenas letras e números');

// Game creation validator
export const gameCreationSchema = z.object({
  type: z.enum(['LOCAL', 'ONLINE', 'BOT']),
  botDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  roomCode: roomCodeSchema.optional(),
});

export type Position = z.infer<typeof positionSchema>;
export type Piece = z.infer<typeof pieceSchema>;
export type Move = z.infer<typeof moveSchema>;
export type BoardState = z.infer<typeof boardStateSchema>;
export type PlayerRegistration = z.infer<typeof playerRegistrationSchema>;
export type PlayerLogin = z.infer<typeof playerLoginSchema>;
export type RoomCode = z.infer<typeof roomCodeSchema>;
export type GameCreation = z.infer<typeof gameCreationSchema>;
