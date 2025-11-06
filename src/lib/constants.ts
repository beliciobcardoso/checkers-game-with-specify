// Board configuration
export const BOARD_SIZE = 8;
export const INITIAL_PIECES_PER_PLAYER = 12;

// Game rules
export const MAX_TURNS_WITHOUT_CAPTURE = 40; // For draw detection
export const MAX_POSITION_REPETITIONS = 3; // For draw by repetition

// Room configuration
export const ROOM_CODE_LENGTH = 6;
export const ROOM_EXPIRATION_HOURS = 24;
export const ROOM_CODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Session configuration
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Bot AI configuration
export const BOT_DIFFICULTIES = {
  EASY: {
    depth: 2,
    thinkingTime: 500, // milliseconds
  },
  MEDIUM: {
    depth: 4,
    thinkingTime: 1000,
  },
  HARD: {
    depth: 6,
    thinkingTime: 2000,
  },
} as const;

// WebSocket events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Room management
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  ROOM_ERROR: 'room:error',

  // Game flow
  GAME_START: 'game:start',
  GAME_MOVE: 'game:move',
  GAME_STATE: 'game:state',
  GAME_END: 'game:end',
  GAME_ABANDON: 'game:abandon',

  // Player actions
  PLAYER_READY: 'player:ready',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_DISCONNECTED: 'player:disconnected',
  PLAYER_RECONNECTED: 'player:reconnected',
} as const;

// Piece values (for AI evaluation)
export const PIECE_VALUES = {
  NORMAL: 100,
  KING: 150,
} as const;

// Position weights for AI evaluation (center control bonus)
export const POSITION_WEIGHTS = [
  [0, 4, 0, 4, 0, 4, 0, 4],
  [4, 0, 3, 0, 3, 0, 3, 0],
  [0, 3, 0, 2, 0, 2, 0, 4],
  [4, 0, 2, 0, 1, 0, 3, 0],
  [0, 3, 0, 1, 0, 2, 0, 4],
  [4, 0, 2, 0, 2, 0, 3, 0],
  [0, 3, 0, 3, 0, 3, 0, 4],
  [4, 0, 4, 0, 4, 0, 4, 0],
] as const;

// Error messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  EMAIL_ALREADY_EXISTS: 'Este email já está em uso',
  USERNAME_ALREADY_EXISTS: 'Este username já está em uso',
  UNAUTHORIZED: 'Você precisa estar autenticado para acessar este recurso',

  // Game
  GAME_NOT_FOUND: 'Jogo não encontrado',
  INVALID_MOVE: 'Movimento inválido',
  NOT_YOUR_TURN: 'Não é sua vez de jogar',
  GAME_ALREADY_FINISHED: 'Este jogo já foi finalizado',

  // Room
  ROOM_NOT_FOUND: 'Sala não encontrada',
  ROOM_FULL: 'Esta sala está cheia',
  ROOM_EXPIRED: 'Esta sala expirou',
  INVALID_ROOM_CODE: 'Código de sala inválido',

  // General
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor',
  VALIDATION_ERROR: 'Erro de validação',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PLAYER_CREATED: 'Conta criada com sucesso',
  PLAYER_UPDATED: 'Perfil atualizado com sucesso',
  GAME_CREATED: 'Jogo criado com sucesso',
  ROOM_CREATED: 'Sala criada com sucesso',
  MOVE_EXECUTED: 'Movimento executado com sucesso',
} as const;
