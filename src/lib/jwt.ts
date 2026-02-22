/**
 * JWT Session Management - Gestão de Sessões com JWT
 * Utiliza a biblioteca 'jose' para compatibilidade com Edge Runtime
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// Segredo para assinatura dos tokens (em produção deve ser uma variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'faturaat-jwt-secret-key-2024-super-secure';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// Configurações do token
export const JWT_CONFIG = {
  issuer: 'faturaat',
  audience: 'faturaat-users',
  accessTokenExpiry: '2h',    // Token de acesso expira em 2 horas
  refreshTokenExpiry: '7d',   // Refresh token expira em 7 dias
  algorithm: 'HS256' as const,
};

// Interface do payload do token
export interface JWTPayload {
  userId: string;
  email: string;
  nome: string;
  perfil: string;
  empresaId?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Interface do payload do refresh token
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;  // ID único para revogação
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Gera um token de acesso JWT
 */
export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    nome: payload.nome,
    perfil: payload.perfil,
    empresaId: payload.empresaId,
  })
    .setProtectedHeader({ alg: JWT_CONFIG.algorithm })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setAudience(JWT_CONFIG.audience)
    .setExpirationTime(JWT_CONFIG.accessTokenExpiry)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Gera um refresh token JWT
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const tokenId = crypto.randomUUID();
  
  const token = await new SignJWT({
    userId,
    tokenId,
    type: 'refresh' as const,
  })
    .setProtectedHeader({ alg: JWT_CONFIG.algorithm })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setAudience(JWT_CONFIG.audience)
    .setExpirationTime(JWT_CONFIG.refreshTokenExpiry)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verifica e decodifica um token de acesso
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: [JWT_CONFIG.algorithm],
    });

    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Verifica e decodifica um refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: [JWT_CONFIG.algorithm],
    });

    if (payload.type !== 'refresh') {
      return null;
    }

    return payload as RefreshTokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Decodifica um token sem verificar a assinatura (útil para debug)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return decodeJwt(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Verifica se um token está expirado
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  return decoded.exp * 1000 < Date.now();
}

/**
 * Obtém o tempo restante até a expiração do token (em segundos)
 */
export function getTokenTimeToLive(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  return Math.max(0, ttl);
}

/**
 * Gera par de tokens (access + refresh)
 */
export async function generateTokenPair(
  user: { id: string; email: string; nome: string; perfil: string; empresaId?: string }
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    nome: user.nome,
    perfil: user.perfil,
    empresaId: user.empresaId,
  });

  const refreshToken = await generateRefreshToken(user.id);

  // Calcular expiração em segundos (2 horas = 7200 segundos)
  const expiresIn = 2 * 60 * 60;

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Middleware helper para verificar autenticação em API routes
 */
export async function authenticateRequest(request: Request): Promise<{
  authenticated: boolean;
  user?: JWTPayload;
  error?: string;
}> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      authenticated: false,
      error: 'Token não fornecido',
    };
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return {
      authenticated: false,
      error: 'Token inválido ou expirado',
    };
  }

  return {
    authenticated: true,
    user: payload,
  };
}
